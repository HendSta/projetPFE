const express = require('express');
const router = express.Router();
const { registerUser, updateProfile, getProfile, changeAuth0Password } = require('../controllers/auth.controller');

router.post('/register', registerUser);
router.put('/profile/:auth0Id', updateProfile);
router.get('/profile/:auth0Id', getProfile);
router.post('/change-password', changeAuth0Password);

module.exports = router;
