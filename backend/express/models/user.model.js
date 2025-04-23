const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: String,
  name: String,
  password: String,
  picture: String,
  role: { type: String, default: 'user' },
  specialty: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  clinicAddress: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
