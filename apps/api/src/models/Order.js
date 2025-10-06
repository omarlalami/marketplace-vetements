const pool = require('../config/database');

class Order {

  /**
   * Créer des commandes à partir du payload de checkout
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} payload - { items, address, total }
   * 
   * items format:
   * [{
   *   id: 'string',
   *   productId: 'uuid',
   *   variantId: 'uuid',
   *   name: 'string',
   *   price: number,
   *   quantity: number,
   *   image?: 'string',
   *   shopName?: 'string',
   *   shopSlug?: 'string',
   *   selectedVariants?: { attribute: value }
   * }]
   */
  static async createOrder(userId, payload) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { items, address } = payload;

      // --- Validation de base ---
      if (!items || items.length === 0) {
        throw new Error('Le panier est vide');
      }

      if (!address || !address.firstName || !address.lastName || !address.line) {
        throw new Error('Adresse de livraison incomplète');
      }

      // --- Formater l'adresse ---
      const shippingAddress = {
        name: `${address.firstName} ${address.lastName}`,
        street: address.line,
        city: address.city,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone,
        email: address.email
      };

      // --- Extraire les variantIds pour récupérer les données ---
      const variantIds = items.map(item => item.variantId);

      // --- Récupérer les infos des produits et variantes ---
      const productsQuery = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.shop_id,
          s.name AS shop_name,
          s.slug AS shop_slug,
          pv.id AS variant_id,
          pv.stock_quantity,
          pv.price AS variant_price,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS product_image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN shops s ON p.shop_id = s.id
        WHERE pv.id = ANY($1) AND p.is_active = true
      `;

      const productsResult = await client.query(productsQuery, [variantIds]);

      if (productsResult.rows.length === 0) {
        throw new Error('Aucun produit valide trouvé');
      }

      // --- Créer une map pour accès rapide aux variantes ---
      const variantsMap = new Map(productsResult.rows.map(row => [row.variant_id, row]));

      const enrichedItems = [];

      for (const cartItem of items) {
        const variantData = variantsMap.get(cartItem.variantId);

        if (!variantData) {
          throw new Error(`Produit non trouvé: ${cartItem.name}`);
        }

        // --- Vérifier le stock ---
        if (variantData.stock_quantity < cartItem.quantity) {
          throw new Error(
            `Stock insuffisant pour ${cartItem.name} (disponible: ${variantData.stock_quantity}, demandé: ${cartItem.quantity})`
          );
        }

        // --- Vérifier la cohérence du productId ---
        if (variantData.product_id !== cartItem.productId) {
          throw new Error(`Incohérence détectée pour ${cartItem.name}`);
        }

        // --- Calculer le prix et le sous-total ---
        const unitPrice = Number(variantData.variant_price);
        const subtotal = unitPrice * cartItem.quantity;

        enrichedItems.push({
          product_id: cartItem.productId,
          variant_id: cartItem.variantId,
          shop_id: variantData.shop_id,
          shop_name: variantData.shop_name,
          shop_slug: variantData.shop_slug,
          product_name: cartItem.name,
          product_image_url: cartItem.image || variantData.product_image_url,
          quantity: cartItem.quantity,
          unit_price: unitPrice,
          subtotal
        });
      }

      // --- Grouper les items par boutique ---
      const itemsByShop = enrichedItems.reduce((acc, item) => {
        if (!acc[item.shop_id]) {
          acc[item.shop_id] = {
            shop_name: item.shop_name,
            shop_slug: item.shop_slug,
            items: []
          };
        }
        acc[item.shop_id].items.push(item);
        return acc;
      }, {});

      const createdOrders = [];

      // --- Créer une commande par boutique ---
      for (const [shopId, shopData] of Object.entries(itemsByShop)) {
        const { items } = shopData;

        // Calculer les totaux
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const shippingCost = this.calculateShippingCost(subtotal, items.length);
        const tax = 0 //subtotal * 0.2; // 20% TVA
        const totalAmount = subtotal + shippingCost + tax;

        const orderNumber = await this.generateOrderNumber();

        // --- Créer la commande ---
        const orderQuery = `
          INSERT INTO orders (
            order_number, user_id, shop_id, subtotal, shipping_cost, 
            tax, total_amount, shipping_address, payment_method, payment_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;

        const orderResult = await client.query(orderQuery, [
          orderNumber,
          userId || null,
          shopId,
          subtotal,
          shippingCost,
          tax,
          totalAmount,
          JSON.stringify(shippingAddress),
          'card',
          'pending'
        ]);

        const order = orderResult.rows[0];

        // --- Créer les lignes de commande ---
        for (const item of items) {
          await client.query(
            `
            INSERT INTO order_items (
              order_id, product_id, product_variant_id, quantity, 
              unit_price, subtotal, product_name, product_image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
              order.id,
              item.product_id,
              item.variant_id,
              item.quantity,
              item.unit_price,
              item.subtotal,
              item.product_name,
              item.product_image_url
            ]
          );

          // --- Décrémenter le stock ---
          const stockResult = await client.query(
            `
            UPDATE product_variants
            SET stock_quantity = stock_quantity - $1
            WHERE id = $2 AND stock_quantity >= $1
            RETURNING stock_quantity
            `,
            [item.quantity, item.variant_id]
          );

          if (stockResult.rows.length === 0) {
            throw new Error(`Impossible de mettre à jour le stock pour ${item.product_name}`);
          }
        }

        // --- Historique de statut ---
        await client.query(
          `
          INSERT INTO order_status_history (order_id, status, comment)
          VALUES ($1, $2, $3)
          `,
          [order.id, 'pending', 'Commande créée']
        );

        createdOrders.push({
          ...order,
          shop_name: shopData.shop_name,
          items: items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal
          }))
        });
      }

      await client.query('COMMIT');
      return createdOrders;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur création commande:', error);
      throw error;
    } finally {
      client.release();
    }
  }

// Récupérer une commande précise (par ID et utilisateur)
static async findById(orderId) {

  const query = `
    SELECT 
      o.*,
      s.name AS shop_name,
      s.slug AS shop_slug,
      (
        SELECT json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'product_image_url', oi.product_image_url,
            'variant_attributes', oi.variant_attributes,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      ) AS items,
      (
        SELECT json_agg(
          json_build_object(
            'status', osh.status,
            'comment', osh.comment,
            'created_at', osh.created_at
          )
          ORDER BY osh.created_at DESC
        )
        FROM order_status_history osh
        WHERE osh.order_id = o.id
      ) AS status_history
    FROM orders o
    JOIN shops s ON o.shop_id = s.id
    WHERE o.id = $1
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      console.warn("⚠️ No order found for given orderId and userId");
      return null;
    }

    const order = result.rows[0];
    console.log("✅ Order found:", JSON.stringify(order, null, 2));

    return order;
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    throw error;
  }
}



  /**
   * Calculer les frais de livraison
   */
  static calculateShippingCost(subtotal, itemCount) {
    return 0;
/*     if (subtotal >= 50) {
      return 0;
    }
    return 5 + Math.max(0, itemCount - 1); */
  }

  // Créer une commande à partir du panier existant en base
  static async createFromCart(userId, shippingAddress, paymentMethod = 'card') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1️⃣ Récupérer les items du panier groupés par shop
      const cartItemsQuery = `
        SELECT 
          ci.shop_id,
          ci.product_id,
          ci.product_variant_id,
          ci.quantity,
          p.name as product_name,
          p.price + COALESCE(pv.price_modifier, 0) as unit_price,
          pv.stock_quantity,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_image_url,
          (
            SELECT json_agg(
              json_build_object(
                'attribute', a.name,
                'value', av.value
              )
            )
            FROM product_variant_attributes pva
            JOIN attribute_values av ON pva.attribute_value_id = av.id
            JOIN attributes a ON av.attribute_id = a.id
            WHERE pva.product_variant_id = pv.id
          ) as variant_attributes
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN product_variants pv ON ci.product_variant_id = pv.id
        WHERE ci.cart_id = (SELECT id FROM cart WHERE user_id = $1)
        ORDER BY ci.shop_id
      `;
      
      const cartItemsResult = await client.query(cartItemsQuery, [userId]);
      const cartItems = cartItemsResult.rows;
      
      if (cartItems.length === 0) {
        throw new Error('Le panier est vide');
      }
      
      // 2️⃣ Grouper les items par shop
      const itemsByShop = cartItems.reduce((acc, item) => {
        if (!acc[item.shop_id]) {
          acc[item.shop_id] = [];
        }
        acc[item.shop_id].push(item);
        return acc;
      }, {});
      
      const createdOrders = [];
      
      // 3️⃣ Créer une commande pour chaque shop
      for (const [shopId, items] of Object.entries(itemsByShop)) {
        // Vérifier le stock pour tous les items
        for (const item of items) {
          if (item.stock_quantity < item.quantity) {
            throw new Error(`Stock insuffisant pour ${item.product_name}`);
          }
        }
        
        // Calculer le total
        const subtotal = items.reduce((sum, item) => 
          sum + (item.unit_price * item.quantity), 0
        );
        
        const shippingCost = 5.00; // À adapter selon votre logique
        const tax = subtotal * 0.20; // TVA 20%
        const totalAmount = subtotal + shippingCost + tax;
        
        // Générer un numéro de commande unique
        const orderNumber = await this.generateOrderNumber();
        
        // Créer la commande
        const orderQuery = `
          INSERT INTO orders (
            order_number, user_id, shop_id, subtotal, shipping_cost, 
            tax, total_amount, shipping_address, payment_method, payment_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        
        const orderResult = await client.query(orderQuery, [
          orderNumber,
          userId,
          shopId,
          subtotal,
          shippingCost,
          tax,
          totalAmount,
          JSON.stringify(shippingAddress),
          paymentMethod,
          'pending'
        ]);
        
        const order = orderResult.rows[0];
        
        // Créer les order_items
        for (const item of items) {
          const itemSubtotal = item.unit_price * item.quantity;
          
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_variant_id, quantity, 
              unit_price, subtotal, product_name, product_image_url, variant_attributes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              order.id,
              item.product_id,
              item.product_variant_id,
              item.quantity,
              item.unit_price,
              itemSubtotal,
              item.product_name,
              item.product_image_url,
              item.variant_attributes
            ]
          );
          
          // Décrémenter le stock
          await client.query(
            `UPDATE product_variants 
             SET stock_quantity = stock_quantity - $1 
             WHERE id = $2`,
            [item.quantity, item.product_variant_id]
          );
        }
        
        // Ajouter l'historique de statut
        await client.query(
          `INSERT INTO order_status_history (order_id, status, comment)
           VALUES ($1, $2, $3)`,
          [order.id, 'pending', 'Commande créée']
        );
        
        createdOrders.push(order);
      }
      
      // 4️⃣ Vider le panier
      await client.query(
        `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1)`,
        [userId]
      );
      
      await client.query('COMMIT');
      return createdOrders;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

    /**
   * Générer un numéro de commande unique
   */
  static async generateOrderNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ORD-${year}-${random}`;
  }
  
    /**
   * Récupérer les commandes d'un utilisateur
   */
  // Récupérer les commandes d'un utilisateur
  static async findByUserId(userId, filters = {}) {
    let query = `
      SELECT 
        o.*,
        s.name as shop_name,
        s.slug as shop_slug,
        (
          SELECT json_agg(
            json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'product_image_url', oi.product_image_url,
              'variant_attributes', oi.variant_attributes,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) as items
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      WHERE o.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (filters.status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Récupérer les commandes d'un shop (pour le vendeur)
  static async findByShopId(shopId, filters = {}) {
    let query = `
      SELECT 
        o.*,
        up.first_name || ' ' || up.last_name as customer_name,
        u.email as customer_email,
        (
          SELECT json_agg(
            json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'product_image_url', oi.product_image_url,
              'variant_attributes', oi.variant_attributes,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE o.shop_id = $1
    `;
    
    const params = [shopId];
    let paramIndex = 2;
    
    if (filters.status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Mettre à jour le statut d'une commande
  static async updateStatus(orderId, newStatus, comment = null, updatedBy = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mettre à jour la commande
      const updateQuery = `
        UPDATE orders 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [newStatus, orderId]);
      
      // Ajouter à l'historique
      await client.query(
        `INSERT INTO order_status_history (order_id, status, comment, created_by)
         VALUES ($1, $2, $3, $4)`,
        [orderId, newStatus, comment, updatedBy]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Order;
