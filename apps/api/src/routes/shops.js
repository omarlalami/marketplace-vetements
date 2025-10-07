const express = require('express');
const Shop = require('../models/Shop');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');
const pool = require('../config/database');

const router = express.Router();

const createShopSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().allow('').max(1000)
});

const updateShopSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().allow('').max(1000),
  logoUrl: Joi.string().uri().allow('')
}).min(1); // At least one field must be provided

// Creer une boutique
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error } = createShopSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description } = req.body;

    try {
      const shop = await Shop.create({
        name,
        description,
        ownerId: req.user.userId
      });

      return res.status(201).json({
        message: 'Boutique créée avec succès',
        shop
      });

    } catch (err) {

      // Erreur de nom déjà utilisé
      if (err.code === 'SHOP_NAME_EXISTS') {
        return res.status(409).json({ error: err.message });
      }

      // Autres erreurs gérées par le modèle (slug, etc.)
      if (err.message && err.message.startsWith('Erreur lors')) {
        return res.status(500).json({ error: err.message });
      }

      console.error('Erreur création boutique:', err);
      return res.status(500).json({ error: 'Erreur interne lors de la création de la boutique' });
    }

  } catch (err) {
    console.error('Erreur route /shops:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour une boutique
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validation du body
    const { error } = updateShopSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    // Vérifier que la boutique existe et appartient à l'utilisateur
    const existingShop = await Shop.findById(id);
    
    if (!existingShop) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }
    if (existingShop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette boutique' });
    }
    // Mise à jour
    const { name, description, logoUrl } = req.body;
    
    const updatedShop = await Shop.update(id, {
      name,
      description,
      logoUrl
    });
    if (!updatedShop) {
      return res.status(404).json({ error: 'Échec de la mise à jour' });
    }
    res.json({
      message: 'Boutique mise à jour avec succès',
      shop: updatedShop
    });
  } catch (err) {

    //Erreur de nom déjà utilisé
    if (err.code === 'SHOP_NAME_EXISTS') {
      return res.status(409).json({ error: err.message });
    }
    console.error('Erreur mise à jour boutique:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la boutique' });
  }
});

// Supprimer une boutique (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la boutique existe et appartient à l'utilisateur
    const existingShop = await Shop.findById(id);
    
    if (!existingShop) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }

    if (existingShop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette boutique' });
    }

    // Soft delete
    const deletedShop = await Shop.delete(id);

    if (!deletedShop) {
      return res.status(404).json({ error: 'Échec de la suppression' });
    }

    res.json({
      message: 'Boutique supprimée avec succès',
      shop: deletedShop
    });

  } catch (error) {
    console.error('Erreur suppression boutique:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la boutique' });
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

// Récupérer une boutique par ID (pour l'édition)
router.get('/edit/:id', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire
    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à accéder à cette boutique' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Erreur récupération boutique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la boutique' });
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