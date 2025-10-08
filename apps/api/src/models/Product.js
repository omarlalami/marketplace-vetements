const pool = require('../config/database');

class Product {

  //tester ok
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
  //tester ok 
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
        WHERE v.product_id = $1 AND v.is_active = true
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

  // a supprimer, il faut mieux utiliser la logiquee de dashboard/product ou on voit tout les produits
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
  // Récupérer les produits d'une boutique spécifique (pour le dashboard)
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

  // Route pour mettre à jour un produit
  //tester ok 
  static async updateById(id, data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 🔹 1. Vérifier que le produit existe
      const existingProduct = await client.query(
        `SELECT * FROM products WHERE id = $1 AND is_active = true`,
        [id]
      );

      if (existingProduct.rowCount === 0) {
        throw new Error("Produit introuvable ou désactivé.");
      }

      // 🔹 2. Mettre à jour le produit principal
      const { name, description, category_id} = data;

      await client.query(
        `
        UPDATE products
        SET name = $1, description = $2, category_id = $3, updated_at = NOW()
        WHERE id = $4
        `,
        [name, description, category_id, id]
      );

      // 🔹 3. Gérer les variantes
      if (Array.isArray(data.variants)) {
        // Récupérer toutes les variantes existantes
        const existingVariantsRes = await client.query(
          `SELECT id FROM product_variants WHERE product_id = $1`,
          [id]
        );
        const existingVariantIds = existingVariantsRes.rows.map(v => v.id);

        const sentVariantIds = data.variants
          .filter(v => v.id)
          .map(v => v.id);

        // ➤ Désactiver les variantes supprimées (présentes en base mais pas dans le payload)
        const variantsToDisable = existingVariantIds.filter(
          vId => !sentVariantIds.includes(vId)
        );

        if (variantsToDisable.length > 0) {
          await client.query(
            `UPDATE product_variants SET is_active = false WHERE id = ANY($1)`,
            [variantsToDisable]
          );
        }

        // ➤ Boucler sur les variantes envoyées
        for (const variant of data.variants) {
          if (variant.id && existingVariantIds.includes(variant.id)) {
            // ✅ Variante existante → mise à jour
            await client.query(
              `
              UPDATE product_variants
              SET price = $1, stock_quantity = $2, is_active = true, updated_at = NOW()
              WHERE id = $3
              `,
              [variant.price, variant.stockQuantity, variant.id]
            );

            // Supprimer et recréer les attributs liés
            await client.query(
              `DELETE FROM product_variant_attributes WHERE product_variant_id = $1`,
              [variant.id]
            );
            for (const attrValueId of variant.attributes) {
              await client.query(
                `
                INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
                VALUES ($1, $2)
                `,
                [variant.id, attrValueId]
              );
            }
          } else {
            // 🆕 Nouvelle variante → création
            const newVariantRes = await client.query(
              `
              INSERT INTO product_variants (product_id, price, stock_quantity, is_active)
              VALUES ($1, $2, $3, true)
              RETURNING id
              `,
              [id, variant.price, variant.stockQuantity]
            );
            const newVariantId = newVariantRes.rows[0].id;

            for (const attrValueId of variant.attributes) {
              await client.query(
                `
                INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
                VALUES ($1, $2)
                `,
                [newVariantId, attrValueId]
              );
            }
          }
        }
      }

      await client.query("COMMIT");
      console.log(`✅ Produit mis à jour: ${id}`);
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Erreur update product:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Route pour supprimer un produit
  //tester ok
  static async deleteById(id) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 🔹 Vérifier si le produit existe
      const productRes = await client.query(
        `SELECT id, name FROM products WHERE id = $1`,
        [id]
      );
      if (productRes.rows.length === 0) throw new Error('Produit introuvable');
      const product = productRes.rows[0];

      // 🔹 Récupérer toutes les variantes du produit
      const variantIdsRes = await client.query(
        `SELECT id FROM product_variants WHERE product_id = $1`,
        [id]
      );
      const variantIds = variantIdsRes.rows.map(r => r.id);

      // 🔹 Vérifier si ces variantes sont liées à des commandes
      let isLinkedToOrders = false;
      if (variantIds.length > 0) {
        const ordersCheck = await client.query(
          `SELECT COUNT(*) AS count FROM order_items WHERE product_variant_id = ANY($1)`,
          [variantIds]
        );
        isLinkedToOrders = parseInt(ordersCheck.rows[0].count, 10) > 0;
      }

      // 🔹 Supprimer les images du produit sur MinIO
      const imagesQuery = `SELECT url FROM product_images WHERE product_id = $1`;
      const imagesResult = await client.query(imagesQuery, [id]);

      const { minioClient } = require('../config/minio');
      for (const image of imagesResult.rows) {
        try {
          const urlParts = image.url.split('/');
          const fileName = urlParts.slice(-2).join('/');
          await minioClient.removeObject('products', fileName);
          console.log(`🗑️ Image supprimée de MinIO: ${fileName}`);
        } catch (error) {
          console.error('⚠️ Erreur suppression image MinIO:', error);
          // on continue même si une image échoue
        }
      }

      if (isLinkedToOrders) {
        // 🟡 Cas 1 : Le produit est déjà utilisé dans des commandes → on désactive seulement
        console.log(`⚠️ Produit lié à des commandes, désactivation au lieu de suppression.`);

        // Désactiver les variantes
        await client.query(
          `UPDATE product_variants
          SET is_active = FALSE, updated_at = NOW()
          WHERE product_id = $1`,
          [id]
        );

        // Désactiver le produit
        await client.query(
          `UPDATE products
          SET is_active = FALSE, updated_at = NOW()
          WHERE id = $1`,
          [id]
        );

        await client.query('COMMIT');
        console.log(`🟡 Produit désactivé (lié à des commandes): ${product.name}`);
        return { ...product, is_active: false, message: 'Produit désactivé (lié à des commandes)' };
      } else {
        // 🟢 Cas 2 : Aucun lien → suppression complète autorisée

        // Supprimer les liens d’attributs
        if (variantIds.length > 0) {
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

        // Supprimer les images
        await client.query(`DELETE FROM product_images WHERE product_id = $1`, [id]);

        // Supprimer le produit
        const result = await client.query(
          `DELETE FROM products WHERE id = $1 RETURNING *`,
          [id]
        );

        await client.query('COMMIT');
        console.log(`✅ Produit supprimé définitivement: ${product.name}`);
        return { ...result.rows[0], message: 'Produit supprimé définitivement' };
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("❌ Erreur deleteById :", error);
      throw error;
    } finally {
      client.release();
    }
  }

}

module.exports = Product;
