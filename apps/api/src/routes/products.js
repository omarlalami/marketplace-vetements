const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const ImageService = require('../services/ImageService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Configuration multer pour l'upload d'images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('').max(2000),
  shopId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().allow(null, ''),
  price: Joi.number().min(0).allow(null, ''),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      value: Joi.string().required(),
      stockQuantity: Joi.number().integer().min(0).default(0)
    })
  ).default([])
});

// Créer un produit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { shopId } = req.body;
    
    // Vérifier que l'utilisateur possède la boutique
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }

    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas les droits pour créer des produits dans cette boutique' });
    }

    const product = await Product.create({
      ...req.body,
      createdBy: req.user.userId
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    });

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// Récupérer un produit par ID (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// Rechercher des produits (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      limit = 20,
      page = 1
    } = req.query;

    const offset = (page - 1) * limit;

    const products = await Product.searchProducts({
      search,
      limit: parseInt(limit),
      offset
    });

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: products.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur recherche produits:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de produits' });
  }
});

// Upload d'images pour un produit
router.post('/:productId/images', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const shop = await Shop.findById(product.shop_id);
    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const uploadedImages = [];
    
    for (const file of req.files) {
      const image = await ImageService.uploadProductImage(file, productId);
      uploadedImages.push(image);
    }

    res.json({
      message: 'Images uploadées avec succès',
      images: uploadedImages
    });

  } catch (error) {
    console.error('Erreur upload images:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des images' });
  }
});

module.exports = router;
