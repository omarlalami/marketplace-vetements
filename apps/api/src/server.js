require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeBuckets } = require('./config/minio');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/shops', shopRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

// Route de test
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Marketplace V1 - Version complète',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT;

// Initialiser MinIO puis démarrer le serveur
initializeBuckets()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API Marketplace démarrée sur le port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Documentation des routes:`);
      console.log(`   • POST /auth/register - Inscription`);
      console.log(`   • POST /auth/login - Connexion`);
      console.log(`   • GET /auth/profile - Profil utilisateur`);
      console.log(`   • POST /shops - Créer une boutique`);
      console.log(`   • GET /shops/my-shops - Mes boutiques`);
      console.log(`   • POST /products - Créer un produit`);
      console.log(`   • GET /products - Rechercher des produits`);
      console.log(`   • GET /categories - Toutes les catégories`);
    });
  })
  .catch(error => {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  });