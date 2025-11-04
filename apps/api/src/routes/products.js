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
//tester ok 
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
// tester ... utiliser dans shops/puma homme products et page acceuilr
router.get('/public', async (req, res) => {
  try {
    const result = await Product.searchPublicProducts(req.query);

    // ✅ Enrich each product with its primary image
    const productsWithImages = await Promise.all(
      result.products.map(async (product) => {
        try {
          const image = await ImageService.getPrimaryImage(product.id);
          return {
            ...product,
            primary_image: image || null, // fallback if no image
          };
        } catch (err) {
          console.error(`Erreur chargement image produit ${product.id}:`, err);
          return {
            ...product,
            primary_image: null,
          };
        }
      })
    );
    res.json({
      ok: true,
      products: productsWithImages,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Erreur recherche produits publics:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de produits' });
  }
});

// Récupérer un produit par slug (public)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    // 🔹 Récupération du slug dans l’URL
    const { slug } = req.params;

    // 🔹 Recherche du produit via le slug
    const product = await Product.findBySlug(slug);

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // 🔹 Récupération des images liées au produit (via son id)
    product.images = await ImageService.getProductImages(product.id);

    res.json({ product });
  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});


// Upload d'images pour un produit
//tester ok
//a modifier pour adapter multer
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
    
    for (const file of req.files) {
      const object_name = await ImageService.uploadProductImage(file,productId);

      const query = `
        INSERT INTO product_images (product_id, object_name)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      await pool.query(query, [
        productId,
        object_name
      ]);

    }

    res.json({
      message: 'Images uploadées avec succès',
    });

  } catch (error) {
    console.error('Erreur upload images:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des images' });
  }
});

// Route pour mettre à jour un produit
//tester ok 
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
// test ok
router.delete('/:productId/images/:imageKey', authenticateToken, async (req, res) => {
  try {

    //imageKey contains a / so we need to encrypt/decrypt to pass to through api call
    const { productId } = req.params;
    const imageKey = decodeURIComponent(req.params.imageKey);
    
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
    await ImageService.deleteProductImage(imageKey);
    
    res.json({ message: 'Image supprimée avec succès' });

  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
  }
});

// Route pour supprimer un produit
//tester ok 
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
