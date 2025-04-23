const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
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

// Controller to update user profile (includes email, name, password)
const updateProfile = async (req, res) => {
  console.log('updateProfile request body:', req.body);
  try {
    // Capture raw new password for DB and Auth0
    const { name, email, password: newPassword, specialty, experience, clinicAddress, picture, phone } = req.body;
    const { auth0Id } = req.params;
    // Build update object
    const updateFields = { specialty, experience, clinicAddress, picture, phone };
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (newPassword) {
      const salt = await bcrypt.genSalt(12);
      updateFields.password = await bcrypt.hash(newPassword, salt);
    }
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id },
      updateFields,
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    // If password changed, also update it in Auth0
    if (newPassword) {
      // Update Auth0 password via Management API
      const { ManagementClient } = require('auth0');
      console.log('Calling Auth0 Management API to update password for', auth0Id);
      const auth0Mgmt = new ManagementClient({
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_MGMT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        scope: 'update:users'
      });
      const connection = process.env.AUTH0_CONNECTION || 'Username-Password-Authentication';
      const auth0Result = await auth0Mgmt.users.update(
        { id: auth0Id },
        { password: newPassword, connection }
      );
      console.log('Auth0 updateUser result:', auth0Result);
    }
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Error updating profile', detail: err.message });
  }
};

// Controller to fetch user profile
const getProfile = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Controller to update Auth0 password via Management API
const changeAuth0Password = async (req, res) => {
  try {
    const { auth0Id, newPassword } = req.body;
    // Initialize Auth0 Management Client
    const { ManagementClient } = require('auth0');
    const auth0Mgmt = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_MGMT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      scope: 'update:users'
    });
    // Update the Auth0 user password
    console.log('Calling changeAuth0Password for', auth0Id);
    const connection = process.env.AUTH0_CONNECTION || 'Username-Password-Authentication';
    await auth0Mgmt.users.update(
      { id: auth0Id },
      { password: newPassword, connection }
    );
    console.log('Auth0 changePassword result returned with success');
    res.json({ message: 'Auth0 password updated' });
  } catch (err) {
    console.error('Error updating Auth0 password:', err);
    res.status(500).json({ message: 'Error updating Auth0 password', error: err.message });
  }
};

module.exports = {
  registerUser,
  updateProfile,
  getProfile,
  changeAuth0Password
};
