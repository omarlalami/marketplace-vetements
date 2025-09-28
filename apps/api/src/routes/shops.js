const express = require('express');
const Shop = require('../models/Shop');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');
const pool = require('../config/database');

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

// Route publique pour lister toutes les boutiques
router.get('/', async (req, res) => {
  try {
    const {
      search,
      limit = 20,
      page = 1,
      sortBy = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, 
             up.first_name || ' ' || up.last_name as owner_name,
             (SELECT COUNT(*) FROM products p WHERE p.shop_id = s.id AND p.is_active = true) as product_count
      FROM shops s
      JOIN users u ON s.owner_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE s.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Recherche
    if (search) {
      query += ` AND (s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR up.first_name ILIKE $${paramIndex} OR up.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Tri
    switch (sortBy) {
      case 'name':
        query += ' ORDER BY s.name ASC';
        break;
      case 'products':
        query += ' ORDER BY product_count DESC';
        break;
      case 'oldest':
        query += ' ORDER BY s.created_at ASC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY s.created_at DESC';
    }
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      shops: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: result.rows.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération boutiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des boutiques' });
  }
});

module.exports = router;