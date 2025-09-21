const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Récupérer toutes les catégories (public)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = true) as product_count
      FROM categories c
      WHERE c.is_active = true
      ORDER BY c.name
    `;
    
    const result = await pool.query(query);
    
    const categories = result.rows;
    const categoryTree = [];
    const categoryMap = {};
    
    // Créer une map des catégories
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });
    
    // Construire l'arbre
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (categoryMap[cat.parent_id]) {
          categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
        }
      } else {
        categoryTree.push(categoryMap[cat.id]);
      }
    });

    res.json({ categories: categoryTree });

  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

module.exports = router;
