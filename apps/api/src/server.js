require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require('cors');
const { initializeBuckets } = require('./config/minio');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const attributesRoutes = require('./routes/attributes');
const ordersRoutes = require('./routes/orders');
const { authLimiter, globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ✅ AJOUTER: Headers de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Appliquer le limiteur global à toutes les routes
// Appliquer une limite plus stricte sur les routes sensibles
app.use(globalLimiter);
app.use('/auth', authLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/shops', shopRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/attributes', attributesRoutes);
app.use('/orders', ordersRoutes);

app.use((req, res, next) => {
  next()
}) 

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
    });
  })
  .catch(error => {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  });