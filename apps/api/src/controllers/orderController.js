const Order = require('../models/Order');

const findByNumberAndEmail = async (req, res) => {
  try {
    const { orderNumber, email } = req.body;

    //console.log(" controller findByNumberAndEmail recoit orderNumber : " + orderNumber);
    //console.log(" controller findByNumberAndEmail recoit email : " + email);

    if (!orderNumber || !email)
      return res.status(400).json({ ok: false, message: 'Numéro de commande et e-mail requis.' });

    const order = await Order.findByNumberAndEmail(orderNumber, email);

    //console.log('controller findByNumberAndEmail order : ', JSON.stringify(order, null, 2));

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
