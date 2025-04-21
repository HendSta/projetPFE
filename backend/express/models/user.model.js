const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: String,
  name: String,
  password: String,
  picture: String,
  role: { type: String, default: 'user' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
