const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS middleware - MUST come before any routes
app.use((req, res, next) => {
  // Allow requests from your frontend domain
  const allowedOrigins = [
    'http://localhost:4200',
    'https://medwinanalyzing.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// MongoDB Atlas connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI environment variable is not set!");
  console.error("Please set MONGO_URI in your Vercel environment variables");
} else {
  console.log("🔗 Connecting to MongoDB Atlas...");
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log("✅ MongoDB Atlas connected successfully");
      console.log("📊 Database: MedWin");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      console.error("🔍 Check your MONGO_URI and MongoDB Atlas network access");
    });
}

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const medicalReportRoutes = require('./routes/medical-report.routes');

// Mount routes with explicit paths
app.use('/api/auth', authRoutes);
app.use('/api/medical-reports', medicalReportRoutes);

// Export for Vercel serverless
module.exports = app;

// Only start server if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8002;
  const HOST = process.env.HOST || 'localhost';
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 MongoDB: ${mongoUri ? 'Atlas configured' : 'Local fallback'}`);
  });
}
