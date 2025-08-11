const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Debug environment variables (remove in production)
console.log("🔍 Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("MONGO_URI preview:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + "..." : "NOT SET");

const app = express();
app.use(cors());
// Increase payload size limit for profile updates (including Base64 images)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI environment variable is not set!");
  console.error("Please set MONGO_URI in your Vercel environment variables");
} else {
  console.log("🔗 Attempting to connect to MongoDB...");
  mongoose.connect(mongoUri)
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => {
      console.error("❌ Erreur MongoDB :", err.message);
      console.error("🔍 Check your MONGO_URI and MongoDB Atlas network access");
    });
}

// Routes
const authRoutes = require('./routes/auth.routes');
const medicalReportRoutes = require('./routes/medical-report.routes');
app.use('/api/auth', authRoutes);
app.use('/api/medical-reports', medicalReportRoutes);

// Export for Vercel serverless
module.exports = app;

// Only start server if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8002;
  const HOST = process.env.HOST || 'localhost';
  app.listen(PORT, () => {
    console.log(`🚀 Serveur Express lancé sur http://${HOST}:${PORT}`);
    console.log(`📊 MongoDB: ${process.env.MONGO_URI || 'mongodb://localhost:27017/auth-app'}`);
  });
}
