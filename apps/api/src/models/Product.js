const pool = require('../config/database');

class Product {

static async create(productData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 🔹 Création du produit
    const productQuery = `
      INSERT INTO products (name, description, shop_id, created_by, category_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const productResult = await client.query(productQuery, [
      productData.name,
      productData.description || null,
      productData.shopId,
      productData.createdBy,
      productData.categoryId || null,
    ]);

    const product = productResult.rows[0];

    // 🔹 Gestion des variantes
    if (productData.variants?.length > 0) {
      for (const variant of productData.variants) {
        // Création de la variante
        const variantQuery = `
          INSERT INTO product_variants (product_id, stock_quantity, price)
          VALUES ($1, $2, $3)
          RETURNING id
        `;

        const variantResult = await client.query(variantQuery, [
          product.id,
          productData.stockQuantity ?? 0,
          productData.price ?? 0,
        ]);

        const variantId = variantResult.rows[0].id;

        // Associer les attributs (⚡ ici c’est attributeValueIds, pas "attributes")
        if (variant.attributeValueIds?.length > 0) {
          for (const valueId of variant.attributeValueIds) {
            await client.query(
              `
              INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
              VALUES ($1, $2)
            `,
              [variantId, valueId]
            );
          }
        }
      }
    } else {
      // ⚡ PRODUIT SIMPLE : Créer une variante par défaut
      // Cette variante n'a pas d'attributs, juste le stock et prix de base
      const defaultVariantQuery = `
        INSERT INTO product_variants (product_id, stock_quantity, price)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      await client.query(defaultVariantQuery, [
        product.id,
        productData.stockQuantity || 0,
        productData.price 
      ]);
      
      // Pas d'attributs pour une variante par défaut
    }

    await client.query('COMMIT');
    return product;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur create product:', error);
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
      // 🔹 Charger les variantes
      const variantsQuery = `
        SELECT v.id, v.stock_quantity, v.price
        FROM product_variants v
        WHERE v.product_id = $1
      `;
      const variantsResult = await pool.query(variantsQuery, [id]);
      product.variants = variantsResult.rows;

      // 🔹 Charger les attributs de chaque variante
      for (let variant of product.variants) {
        const attrsQuery = `
          SELECT av.id as value_id, av.value, a.name as attribute
          FROM product_variant_attributes pva
          JOIN attribute_values av ON pva.attribute_value_id = av.id
          JOIN attributes a ON av.attribute_id = a.id
          WHERE pva.product_variant_id = $1
        `;
        const attrsResult = await pool.query(attrsQuery, [variant.id]);
        variant.attributes = attrsResult.rows;
      }

      // 🔹 Charger les images
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

  // 🔹 Recherche produit (reste quasi identique)
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

  // 🔹 Produits d’une boutique
static async findByShopId(shopId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.created_at,
      s.name AS shop_name,
      s.slug AS shop_slug,
      c.name AS category_name,
      c.slug AS category_slug,
      (
        SELECT url 
        FROM product_images 
        WHERE product_id = p.id 
        LIMIT 1
      ) AS primary_image,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', v.id,
            'stock_quantity', v.stock_quantity,
            'price', v.price
          )
        ) FILTER (WHERE v.id IS NOT NULL), '[]'
      ) AS variants
    FROM products p
    LEFT JOIN shops s ON p.shop_id = s.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE p.shop_id = $1 AND p.is_active = true
    GROUP BY p.id, s.name, s.slug, c.name, c.slug
    ORDER BY p.created_at DESC
  `;

  const result = await pool.query(query, [shopId]);
  const products = result.rows;

  // 🛠️ Compléter chaque variante avec ses attributs
  for (const product of products) {
    for (const variant of product.variants) {
      const attrsQuery = `
        SELECT a.name AS attribute, av.value AS value
        FROM product_variant_attributes pva
        JOIN attribute_values av ON pva.attribute_value_id = av.id
        JOIN attributes a ON av.attribute_id = a.id
        WHERE pva.product_variant_id = $1
      `;
      const attrsResult = await pool.query(attrsQuery, [variant.id]);
      variant.attribute_values = attrsResult.rows; // [{ attribute: "Taille", value: "L" }]
    }
  }

  return products;
}


static async updateById(id, productData) {
        console.log("donne recu")
      console.log(productData)
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 🔹 Mettre à jour le produit
    const productQuery = `
      UPDATE products 
      SET name = $2, description = $3, category_id = $4,  updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const productResult = await client.query(productQuery, [
      id,
      productData.name,
      productData.description,
      productData.categoryId,
    ]);

    const product = productResult.rows[0];

    // 🔹 Supprimer toutes les anciennes variantes et leurs attributs
    const variantIdsResult = await client.query(
      `SELECT id FROM product_variants WHERE product_id = $1`,
      [id]
    );

    const variantIds = variantIdsResult.rows.map((row) => row.id);

    if (variantIds.length > 0) {
      await client.query(
        `DELETE FROM product_variant_attributes WHERE product_variant_id = ANY($1)`,
        [variantIds]
      );
      await client.query(
        `DELETE FROM product_variants WHERE product_id = $1`,
        [id]
      );
    }

    // 🔹 Réinsérer les nouvelles variantes si elles existent
    if (productData.variants && productData.variants.length > 0) {
      console.log("rentrer dans la condition de presente de variant")
      for (const variant of productData.variants) {
        console.log("variant boucle : " + variant)
        console.log(JSON.stringify(variant))
        console.log("stock quantite valeur inserer" + JSON.stringify(variant.stockQuantity))

        const variantQuery = `
          INSERT INTO product_variants (product_id, stock_quantity, price)
          VALUES ($1, $2, $3)
          RETURNING id
        `;

        const variantResult = await client.query(variantQuery, [
          id,
          variant.stockQuantity || 0,
          variant.price || 0,
        ]);


        const variantId = variantResult.rows[0].id;

        // Associer les attributs de la variante
        if (variant.attributes && variant.attributes.length > 0) {
                console.log("rentrer dans la condition de presente de attribut de variant")
          for (const attrValueId of variant.attributes) {
            console.log("variant attribut boucle : " + variant.attributes)
            console.log(JSON.stringify(variant.attributes))
             console.log(variantId, attrValueId)

            await client.query(
              `
              INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
              VALUES ($1, $2)
            `,
              [variantId, attrValueId]
            );
          }
        }
         else
              console.log("probleme n'est pas rentrer dans la condition de presente dattribut de  variant")
      }


    }      else
              console.log("probleme n'est pas rentrer dans la condition de presente de variant")

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

    // 🔹 Récupérer toutes les images du produit pour les supprimer de MinIO
    const imagesQuery = 'SELECT url FROM product_images WHERE product_id = $1';
    const imagesResult = await client.query(imagesQuery, [id]);

    const { minioClient } = require('../config/minio');
    for (const image of imagesResult.rows) {
      try {
        const urlParts = image.url.split('/');
        const fileName = urlParts.slice(-2).join('/');
        await minioClient.removeObject('products', fileName);
        console.log(`🗑️ Image supprimée de MinIO: ${fileName}`);
      } catch (error) {
        console.error('Erreur suppression image MinIO:', error);
        // continuer même si une image échoue
      }
    }

    // 🔹 Récupérer toutes les variantes
    const variantIdsResult = await client.query(
      `SELECT id FROM product_variants WHERE product_id = $1`,
      [id]
    );
    const variantIds = variantIdsResult.rows.map((row) => row.id);

    if (variantIds.length > 0) {
      // Supprimer les liens avec les attributs
      await client.query(
        `DELETE FROM product_variant_attributes WHERE product_variant_id = ANY($1)`,
        [variantIds]
      );

      // Supprimer les variantes
      await client.query(
        `DELETE FROM product_variants WHERE product_id = $1`,
        [id]
      );
    }

    // 🔹 Supprimer les images (cascade si FK ON DELETE CASCADE)
    await client.query(`DELETE FROM product_images WHERE product_id = $1`, [id]);

    // 🔹 Supprimer le produit
    const result = await client.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [id]
    );

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
