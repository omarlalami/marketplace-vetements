const express = require('express');
const Shop = require('../models/Shop');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const createShopSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('').max(1000)
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error } = createShopSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description } = req.body;
    
    const shop = await Shop.create({
      name,
      description,
      ownerId: req.user.userId
    });

    res.status(201).json({
      message: 'Boutique créée avec succès',
      shop
    });

  } catch (error) {
    console.error('Erreur création boutique:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la boutique' });
  }
});

// Récupérer mes boutiques
router.get('/my-shops', authenticateToken, async (req, res) => {
  try {
    const shops = await Shop.findByOwnerId(req.user.userId);
    res.json({ shops });
  } catch (error) {
    console.error('Erreur récupération boutiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des boutiques' });
  }
});

// Récupérer une boutique par slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const shop = await Shop.findBySlug(req.params.slug);
    
    if (!shop) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Erreur récupération boutique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la boutique' });
  }
});

module.exports = router;