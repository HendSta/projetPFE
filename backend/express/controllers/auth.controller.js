const User = require('../models/user.model');

exports.registerUser = async (req, res) => {
  const { auth0Id, email, name,password, picture } = req.body;

  try {
    let user = await User.findOne({ auth0Id });

    if (!user) {
      user = new User({ auth0Id, email, name,password, picture });
      await user.save();
      console.log('Utilisateur enregistré');
    } else {
      console.log('Utilisateur déjà enregistré');
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Erreur :", err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’utilisateur' });
  }
};
