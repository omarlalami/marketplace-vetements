const rateLimit = require('express-rate-limit');

// 🔒 Limite stricte pour les routes sensibles (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max par IP
  message: {
    error: 'Trop de tentatives de connexion. Réessayez plus tard.'
  },
  standardHeaders: true, // Ajoute les headers RateLimit-* (RFC standard)
});

// 🌐 Limite plus large pour le reste du site
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requêtes / minute par IP
  message: { error: 'Trop de requêtes. Calmez-vous un peu 😅' },
  standardHeaders: true,
});

module.exports = { authLimiter, globalLimiter };
