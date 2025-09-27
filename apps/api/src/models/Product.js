const pool = require('../config/database');

class Product {
  static async create(productData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const productQuery = `
        INSERT INTO products (name, description, shop_id, created_by, category_id, price)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const productResult = await client.query(productQuery, [
        productData.name,
        productData.description,
        productData.shopId,
        productData.createdBy,
        productData.categoryId,
        productData.price
      ]);
      
      const product = productResult.rows[0];
      
      if (productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          const variantQuery = `
            INSERT INTO product_variants (product_id, name, type, value, stock_quantity)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(variantQuery, [
            product.id,
            variant.name,
            variant.type,
            variant.value,
            variant.stockQuantity || 0
          ]);
        }
      }
      
      await client.query('COMMIT');
      return product;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const query = `
      SELECT p.*, s.name as shop_name, s.slug as shop_slug,
             c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    const product = result.rows[0];
    
    if (product) {
      const variantsQuery = `
        SELECT * FROM product_variants 
        WHERE product_id = $1 
        ORDER BY type
      `;
      const variantsResult = await pool.query(variantsQuery, [id]);
      product.variants = variantsResult.rows;
      
      const imagesQuery = `
        SELECT * FROM product_images 
        WHERE product_id = $1 
        ORDER BY display_order, is_primary DESC
      `;
      const imagesResult = await pool.query(imagesQuery, [id]);
      product.images = imagesResult.rows;
    }
    
    return product;
  }

  static async searchProducts(options = {}) {
    const { limit = 20, offset = 0, search } = options;
    
    let query = `
      SELECT p.*, s.name as shop_name, s.slug as shop_slug, 
             c.name as category_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND s.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByShopId(shopId) {
  const query = `
    SELECT p.*, s.name as shop_name, s.slug as shop_slug,
            c.name as category_name, c.slug as category_slug,
            (SELECT url FROM product_images WHERE product_id = p.id LIMIT 1) as primary_image
    FROM products p
    LEFT JOIN shops s ON p.shop_id = s.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.shop_id = $1 AND p.is_active = true
    ORDER BY p.created_at DESC
  `;
  
  const result = await pool.query(query, [shopId]);
  
  // Pour chaque produit, récupérer les variantes
  for (let product of result.rows) {
    const variantsQuery = `
      SELECT type, value, stock_quantity 
      FROM product_variants 
      WHERE product_id = $1 
      ORDER BY type, value
    `;
    const variantsResult = await pool.query(variantsQuery, [product.id]);
    product.variants = variantsResult.rows;
  }
  
  return result.rows;
}

  static async updateById(id, productData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mettre à jour le produit
      const productQuery = `
        UPDATE products 
        SET name = $2, description = $3, category_id = $4, price = $5, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const productResult = await client.query(productQuery, [
        id,
        productData.name,
        productData.description,
        productData.categoryId,
        productData.price
      ]);
      
      const product = productResult.rows[0];
      
      // Supprimer les anciennes variantes
      await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
      
      // Ajouter les nouvelles variantes si elles existent
      if (productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          const variantQuery = `
            INSERT INTO product_variants (product_id, name, type, value, stock_quantity)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(variantQuery, [
            id,
            variant.name,
            variant.type,
            variant.value,
            variant.stockQuantity || 0
          ]);
        }
      }
      
      await client.query('COMMIT');
      return product;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteById(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Récupérer toutes les images du produit pour les supprimer de MinIO
      const imagesQuery = 'SELECT url FROM product_images WHERE product_id = $1';
      const imagesResult = await client.query(imagesQuery, [id]);
      
      // Supprimer les images de MinIO
      const { minioClient } = require('../config/minio');
      for (const image of imagesResult.rows) {
        try {
          const urlParts = image.url.split('/');
          const fileName = urlParts.slice(-2).join('/');
          await minioClient.removeObject('products', fileName);
          console.log(`🗑️  Image supprimée de MinIO: ${fileName}`);
        } catch (error) {
          console.error('Erreur suppression image MinIO:', error);
          // Continuer même si une image ne peut pas être supprimée
        }
      }
      
      // Supprimer les images de la base (cascade automatique)
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      
      // Supprimer les variantes (cascade automatique)
      await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
      
      // Supprimer le produit
      const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Produit non trouvé');
      }
      
      await client.query('COMMIT');
      console.log(`✅ Produit supprimé: ${result.rows[0].name}`);
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


}

module.exports = Product;
