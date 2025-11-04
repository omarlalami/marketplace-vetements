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

      // --- Validation ---
      if (!items || items.length === 0) throw new Error('Le panier est vide');
      if (!address || !address.firstName || !address.lastName || !address.line)
        throw new Error('Adresse de livraison incomplète');

      // --- Format shipping address ---
      const shippingAddress = {
        name: `${address.firstName} ${address.lastName}`,
        street: address.line,
        city: address.city,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone,
        email: address.email
      };

      // --- Retrieve product/variant data ---
      const variantIds = items.map(i => i.variantId);

      const productsQuery = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.shop_id,
          s.name AS shop_name,
          s.slug AS shop_slug,
          pv.id AS variant_id,
          pv.stock_quantity,
          pv.price AS variant_price
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN shops s ON p.shop_id = s.id
        WHERE pv.id = ANY($1) AND p.is_active = true
      `;

      const productsResult = await client.query(productsQuery, [variantIds]);
      if (productsResult.rows.length === 0) throw new Error('Aucun produit valide trouvé');

      const variantsMap = new Map(productsResult.rows.map(row => [row.variant_id, row]));

      const enrichedItems = [];

      for (const cartItem of items) {
        const variantData = variantsMap.get(cartItem.variantId);
        if (!variantData) throw new Error(`Produit non trouvé: ${cartItem.name}`);

        // Vérification stock
        if (variantData.stock_quantity < cartItem.quantity)
          throw new Error(`Stock insuffisant pour ${cartItem.name}`);

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
          subtotal,
          variant_attributes: cartItem.selectedVariants || null
        });
      }

      // --- Group items by shop ---
      const itemsByShop = enrichedItems.reduce((acc, item) => {
        if (!acc[item.shop_id]) acc[item.shop_id] = [];
        acc[item.shop_id].push(item);
        return acc;
      }, {});

      // --- Calculate global totals ---
      const globalSubtotal = enrichedItems.reduce((s, i) => s + i.subtotal, 0);
      const globalShipping = 0; // optional global shipping
      const globalTax = 0;
      const globalTotal = globalSubtotal + globalShipping + globalTax;

      // --- Create main order (global) ---
      const orderNumber = await this.generateOrderNumber();

      const orderResult = await client.query(
        `
        INSERT INTO orders (
          order_number, user_id, subtotal, shipping_cost, tax, total_amount, 
          shipping_address, payment_method, payment_status, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
        `,
        [
          orderNumber,
          userId || null,
          globalSubtotal,
          globalShipping,
          globalTax,
          globalTotal,
          JSON.stringify(shippingAddress),
          'cash_on_delivery',
          'pending',
          'pending'
        ]
      );

      const mainOrder = orderResult.rows[0];

      const createdShopOrders = [];

      // --- Create shop_orders + order_items ---
      for (const [shopId, shopItems] of Object.entries(itemsByShop)) {
        const shopSubtotal = shopItems.reduce((s, i) => s + i.subtotal, 0);
        const shopShipping = this.calculateShippingCost(shopSubtotal, shopItems.length);
        const shopTax = 0;
        const shopTotal = shopSubtotal + shopShipping + shopTax;

        const shopOrderResult = await client.query(
          `
          INSERT INTO shop_orders (
            order_id, shop_id, subtotal, shipping_cost, tax, total_amount, status
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          RETURNING *
          `,
          [mainOrder.id, shopId, shopSubtotal, shopShipping, shopTax, shopTotal, 'pending']
        );

        const shopOrder = shopOrderResult.rows[0];

        // --- Insert order_items for each product ---
        for (const item of shopItems) {
          await client.query(
            `
            INSERT INTO order_items (
              shop_order_id, product_id, product_variant_id, quantity,
              unit_price, subtotal, product_name, product_image_url, variant_attributes
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            `,
            [
              shopOrder.id,
              item.product_id,
              item.variant_id,
              item.quantity,
              item.unit_price,
              item.subtotal,
              item.product_name,
              item.product_image_url,
              JSON.stringify(item.variant_attributes)
            ]
          );

          // --- Update stock ---
          const stockUpdate = await client.query(
            `
            UPDATE product_variants
            SET stock_quantity = stock_quantity - $1
            WHERE id = $2 AND stock_quantity >= $1
            RETURNING stock_quantity
            `,
            [item.quantity, item.variant_id]
          );

          if (stockUpdate.rows.length === 0)
            throw new Error(`Impossible de mettre à jour le stock pour ${item.product_name}`);
        }

        // --- Insert status history ---
        await client.query(
          `
          INSERT INTO order_status_history (shop_order_id, status, comment)
          VALUES ($1,$2,$3)
          `,
          [shopOrder.id, 'pending', 'Commande créée']
        );

        createdShopOrders.push({
          ...shopOrder,
          shop_id: shopId,
          items: shopItems.map(i => ({
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.subtotal
          }))
        });
      }

      await client.query('COMMIT');

      return {
        order: mainOrder,
        shop_orders: createdShopOrders
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur création commande:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // Récupérer une commande par ordernumber
  static async findByOrderNumber(orderNumber, userId = null) {
    const client = await pool.connect();

    try {
      // 🔍 Récupérer la commande globale par order_number
      const orderQuery = `
        SELECT 
          o.id,
          o.order_number,
          o.user_id,
          o.status,
          o.subtotal,
          o.tax,
          o.shipping_cost,
          o.total_amount,
          o.shipping_address,
          o.payment_method,
          o.payment_status,
          o.notes,
          o.created_at
        FROM orders o
        WHERE o.order_number = $1
        ${userId ? 'AND o.user_id = $2' : ''}
      `;

      const orderValues = userId ? [orderNumber, userId] : [orderNumber];
      const { rows: orderRows } = await client.query(orderQuery, orderValues);

      if (orderRows.length === 0) {
        return null;
      }

      const order = orderRows[0];

      // 🔍 Sous-commandes (shop_orders)
      const shopOrdersQuery = `
        SELECT 
          so.id,
          so.shop_id,
          s.name AS shop_name,
          s.slug AS shop_slug,
          so.subtotal,
          so.tax,
          so.shipping_cost,
          so.total_amount,
          so.status,
          so.created_at
        FROM shop_orders so
        JOIN shops s ON s.id = so.shop_id
        WHERE so.order_id = $1
        ORDER BY s.name ASC
      `;
      const { rows: shopOrders } = await client.query(shopOrdersQuery, [order.id]);

      // 🔍 Articles
      const itemsQuery = `
        SELECT 
          oi.id,
          oi.shop_order_id,
          oi.product_id,
          oi.product_variant_id,
          oi.product_name,
          oi.product_image_url,
          oi.variant_attributes,
          oi.quantity,
          oi.unit_price,
          oi.subtotal
        FROM order_items oi
        JOIN shop_orders so ON so.id = oi.shop_order_id
        WHERE so.order_id = $1
        ORDER BY oi.created_at ASC
      `;
      const { rows: items } = await client.query(itemsQuery, [order.id]);

      // 🧩 Grouper les items par shop_order_id
      const itemsByShop = items.reduce((acc, item) => {
        if (!acc[item.shop_order_id]) acc[item.shop_order_id] = [];
        acc[item.shop_order_id].push(item);
        return acc;
      }, {});

      // 🧩 Attacher les items à chaque sous-commande
      const shopOrdersWithItems = shopOrders.map((shopOrder) => ({
        ...shopOrder,
        items: itemsByShop[shopOrder.id] || [],
      }));

      // ✅ Résultat final
      return {
        ...order,
        shipping_address: order.shipping_address,
        shop_orders: shopOrdersWithItems,
      };
    } catch (error) {
      console.error('Erreur findByOrderNumber:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Calculer les frais de livraison
  static calculateShippingCost(subtotal, itemCount) {
    return 0;
  }

  //Générer un numéro de commande unique
  static async generateOrderNumber() {
    const year = new Date().getFullYear();

    let orderNumber;
    let exists = true;

    while (exists) {
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      orderNumber = `ORD-${year}-${random}`;

      const result = await pool.query(
        'SELECT 1 FROM orders WHERE order_number = $1 LIMIT 1',
        [orderNumber]
      );

      exists = result.rows.length > 0;
    }

    return orderNumber;
  }
  
  // Récupérer les commandes d'un shop (pour le vendeur)
  static async findByShopId(shopId) {
    let query = `
      SELECT 
        so.*,
        o.order_number,
        o.payment_status,
        o.payment_method,
        o.created_at AS global_order_created_at,
        o.shipping_address,
        o.notes,
        COALESCE(up.first_name || ' ' || up.last_name, 'Guest') AS customer_name,
        COALESCE(u.email, o.shipping_address->>'email') AS customer_email,
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
          WHERE oi.shop_order_id = so.id
        ) AS items
      FROM shop_orders so
      JOIN orders o ON so.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE so.shop_id = $1
      ORDER BY so.created_at DESC
    `;

    const params = [shopId];

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

  // Track une commande par orderNumber & mail
  static async findByNumberAndEmail(orderNumber, email) {
    const query = `
      SELECT 
        o.id AS order_id,
        o.order_number,
        o.status AS order_status,
        o.payment_status,
        o.payment_method,
        o.total_amount,
        o.shipping_address,
        o.created_at AS order_date,
        u.email,
        up.first_name,
        up.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE o.order_number = $1
        AND (u.email = $2 OR o.shipping_address->>'email' = $2)
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [orderNumber, email]);

    if (rows.length === 0) return null;

    const order = rows[0];

    // Récupérer les sous-commandes et les articles associés
    const subOrdersQuery = `
      SELECT 
        so.id AS shop_order_id,
        s.name AS shop_name,
        s.slug AS shop_slug,
        so.status,
        so.tracking_number,
        so.estimated_delivery_date,
        so.total_amount
      FROM shop_orders so
      JOIN shops s ON s.id = so.shop_id
      WHERE so.order_id = $1
    `;
    const { rows: subOrders } = await pool.query(subOrdersQuery, [order.order_id]);

    for (const subOrder of subOrders) {
      const itemsQuery = `
        SELECT 
          oi.id AS item_id,
          oi.product_name,
          oi.product_image_url,
          oi.variant_attributes,
          oi.quantity,
          oi.unit_price,
          oi.subtotal
        FROM order_items oi
        WHERE oi.shop_order_id = $1
      `;
      const { rows: items } = await pool.query(itemsQuery, [subOrder.shop_order_id]);
      subOrder.items = items;
    }

    order.shop_orders = subOrders;
    return order;
  }

}

module.exports = Order;
