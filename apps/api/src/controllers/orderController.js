const Order = require('../models/Order');

const findByNumberAndEmail = async (req, res) => {
  try {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(400).json({
        ok: false,
        message: 'Numéro de commande et e-mail requis.'
      });
    }

    // ✅ Validate types
    if (typeof orderNumber !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ ok: false, message: 'Format de données invalide.' });
    }

    // ✅ Validate length
    if (orderNumber.length > 50 || email.length > 255) {
      return res.status(400).json({ ok: false, message: 'Entrée trop longue.' });
    }

    // ✅ Validate format
    const orderNumberRegex = /^ORD-\d{4}-\d{6}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!orderNumberRegex.test(orderNumber)) {
      return res.status(400).json({ ok: false, message: 'Format du numéro de commande invalide. Ex : ORD-2025-288344' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, message: 'Format d’e-mail invalide. Ex : yassine@gmail.com' });
    }

    const order = await Order.findByNumberAndEmail(orderNumber, email);

    if (!order) {
      return res.status(404).json({ ok: false, message: 'Aucune commande trouvée pour ces informations.' });
    }

    return res.json({ ok: true, order });

  } catch (err) {
    console.error('Erreur findByNumberAndEmail:', err);
    return res.status(500).json({ ok: false, message: 'Erreur interne du serveur.' });
  }
};

module.exports = { findByNumberAndEmail };
