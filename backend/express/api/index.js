const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configure CORS for Vercel deployment
app.use(cors({
  origin: [
    'http://localhost:4200', // Angular dev server
    'https://medwinanalyzing.vercel.app', // Your actual frontend domain
    process.env.FRONTEND_URL // Environment variable for frontend URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Additional CORS middleware for broader compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://medwinanalyzing.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
const authRoutes = require('../routes/auth.routes');
const medicalReportRoutes = require('../routes/medical-report.routes');
app.use('/api/auth', authRoutes);
app.use('/api/medical-reports', medicalReportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;

// For local development, also start the server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 8002;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
