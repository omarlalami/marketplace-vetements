const Order = require('../models/Order');

const findByNumberAndEmail = async (req, res) => {
  try {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email)
      return res.status(400).json({ ok: false, message: 'Numéro de commande et e-mail requis.' });

    const order = await Order.findByNumberAndEmail(orderNumber, email);

    if (!order)
      return res.status(404).json({ ok: false, message: 'Aucune commande trouvée pour ces informations.' });

    res.json({
      ok: true,
      order
    });

  } catch (err) {
    console.error('Erreur findByNumberAndEmail:', err);
    res.status(500).json({ ok: false, message: 'Erreur interne du serveur.' });
  }
};

module.exports = { findByNumberAndEmail };
