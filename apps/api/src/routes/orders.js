const express = require('express');
const Order = require('../models/Order');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// ✅ Schema validation
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        productId: Joi.string().uuid().required(),
        variantId: Joi.string().uuid().required(),
        name: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().integer().min(1).required(),
        image: Joi.string().allow('', null),
        shopName: Joi.string().allow('', null),
        shopSlug: Joi.string().allow('', null),
        selectedVariants: Joi.object().pattern(Joi.string(), Joi.string()).allow(null)
      })
    )
    .min(1)
    .required(),
  address: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    line: Joi.string().required(),
    city: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required()
  }).required(),
  total: Joi.number().required()
});

// ✅ Create a new order (multi-seller)
router.post('/', optionalAuth, async (req, res) => {
  try {
    // --- Validate request body ---
    const { error } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const payload = req.body;
    const userId = req.user ? req.user.userId : null;

    // --- Create the order ---
    const { order, shop_orders } = await Order.createOrder(userId, payload);

    res.status(201).json({
      ok: true,
      message: `Commande créée avec succès`,
      order,           // global order
      shop_orders,     // list of sub-orders per seller
      id: order.id,    // for redirection if needed
      order_number: order.order_number
    });

  } catch (error) {
    console.error('Erreur création commande:', error);

    // --- Specific error messages ---
    if (error.message.includes('Stock insuffisant')) {
      return res.status(400).json({ ok: false, message: error.message });
    }

    if (error.message.includes('Produit non trouvé')) {
      return res.status(404).json({ ok: false, message: error.message });
    }

    if (error.message.includes('panier est vide') || error.message.includes('Adresse')) {
      return res.status(400).json({ ok: false, message: error.message });
    }

    res.status(500).json({
      ok: false,
      message: 'Erreur lors de la création de la commande'
    });
  }
});

// Récupérer les commandes de l'utilisateur
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const { status, limit } = req.query;
    
    const orders = await Order.findByUserId(req.user.userId, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({ 
      ok: true,
      orders 
    });

  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ 
      ok: false,
      message: 'Erreur lors de la récupération des commandes' 
    });
  }
});

// Récupérer une commande par ID
router.get('/:orderId', optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId, req.user ? req.user.userId : null);
    if (!order) {
      return res.status(404).json({ ok: false, message: 'Commande non trouvée' });
    }

    res.json({
      ok: true,
      order
    });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({
      ok: false,
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

module.exports = router;
