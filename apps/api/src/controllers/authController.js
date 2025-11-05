const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // secure true seulement en prod
  sameSite: isProduction ? 'strict' : 'lax',
  // SameSite=strict: bloque TOUTES les requêtes cross-site
  // SameSite=lax: permet les navigations (links) mais pas fetch
  // ⚠️ si API et front sont sur 2 domaines différents → utiliser "none"
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 jours
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.isMailUsed(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const user = await User.create({ email, password, firstName, lastName });

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.profile.first_name,
        lastName: user.profile.last_name
      }//, token
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await User.verifyPassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user.id);

    res.cookie('auth-store', token, cookieOptions);

    res.json({
      message: 'Connexion réussie',
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar_url,
      bio: user.bio,
      brandName: user.brand_name
    });

  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("auth-store", {
      httpOnly: true,
      secure: isProduction, // en prod → true, en dev → false si tu n’as pas https
      sameSite: isProduction ? 'strict' : 'lax',
    // SameSite=strict: bloque TOUTES les requêtes cross-site
    // SameSite=lax: permet les navigations (links) mais pas fetch
    // ⚠️ si API et front sont sur 2 domaines différents → utiliser "none"
    });

    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error("Erreur logout:", error);
    res.status(500).json({ error: "Erreur lors de la déconnexion" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};
