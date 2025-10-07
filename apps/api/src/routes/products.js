const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const ImageService = require('../services/ImageService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const Joi = require('joi');
const pool = require('../config/database');

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
  stockQuantity: Joi.number().min(0).allow(null, ''),
  variants: Joi.array().items(
    Joi.object({
      stockQuantity: Joi.number().integer().min(0).default(0),
      price: Joi.number().min(0).default(0),
      attributeValueIds: Joi.array().items(
        Joi.number().integer().positive() // 👈 accepte des BIGINT
      ).min(1).required()
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

// Route publique pour les produits (avec filtre boutique)
router.get('/public', async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      shop, // Nouveau paramètre pour filtrer par slug de boutique
      limit = 20,
      page = 1
    } = req.query;

    const offset = (page - 1) * limit;

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
    
    if (category) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (minPrice) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(parseFloat(minPrice));
      paramIndex++;
    }
    
    if (maxPrice) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }
    
    if (shop) {
      query += ` AND s.slug = $${paramIndex}`;
      params.push(shop);
      paramIndex++;
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: result.rows.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur recherche produits publics:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de produits' });
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
router.get('/', async (req, res) => {
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

// Récupérer les produits d'une boutique spécifique (pour le dashboard)
router.get('/shop/:shopId/products', authenticateToken, async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // Vérifier que l'utilisateur possède cette boutique
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }

    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const products = await Product.findByShopId(shopId);

    res.json({
      products
    });

  } catch (error) {
    console.error('Erreur récupération produits boutique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// Récupérer un produit pour édition (protégé)
router.get('/:id/edit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérifier que l'utilisateur peut éditer ce produit
    const shop = await Shop.findById(product.shop_id);
    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas les droits pour éditer ce produit' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Erreur récupération produit pour édition:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// Route pour mettre à jour un produit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le produit existe et appartient à l'utilisateur
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const shop = await Shop.findById(existingProduct.shop_id);
    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas les droits pour modifier ce produit' });
    }

    // Mettre à jour le produit
    const updatedProduct = await Product.updateById(id, req.body);
    
    res.json({
      message: 'Produit mis à jour avec succès',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
  }
});

// Route pour supprimer une image
router.delete('/:productId/images/:imageId', authenticateToken, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    
    // Vérifier les droits
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const shop = await Shop.findById(product.shop_id);
    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Supprimer l'image de la base et de MinIO
    await ImageService.deleteProductImage(imageId);
    
    res.json({ message: 'Image supprimée avec succès' });

  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
  }
});

// Route pour supprimer un produit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le produit existe et appartient à l'utilisateur
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const shop = await Shop.findById(product.shop_id);
    if (shop.owner_id !== req.user.userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas les droits pour supprimer ce produit' });
    }

    // Supprimer le produit (avec cascade pour les variantes et images)
    await Product.deleteById(id);
    
    res.json({ message: 'Produit supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

module.exports = router;
