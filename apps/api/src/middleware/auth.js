const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {

/* console.log("🔍 HEADERS:", req.headers)
console.log("🔍 BODY:", req.body)
console.log("🔍 PARAMS:", req.params)
console.log("🔍 QUERY:", req.query)
console.log("🔍 COOKIES:", req.cookies) 
console.log("🔍 QUERY:", req.user)*/
  const token =  req.cookies["auth-store"];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = { userId: user.id, email: user.email };
    next();
    
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

const optionalAuth = async (req, res, next) => {
  const token = req.cookies["auth-store"];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = { userId: user.id, email: user.email };
      }
    } catch (error) {
      // Token invalide mais on continue sans erreur
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
