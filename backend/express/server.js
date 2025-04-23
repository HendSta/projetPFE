const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
// Increase payload size limit for profile updates (including Base64 images)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connecté"))
.catch((err) => console.error("Erreur MongoDB :", err));

// Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
