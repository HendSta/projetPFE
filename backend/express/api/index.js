const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configure CORS for Vercel deployment
app.use(cors({
  origin: [
    'http://localhost:4200', // Angular dev server
    'https://your-frontend-domain.vercel.app', // Replace with your actual frontend domain
    process.env.FRONTEND_URL // Environment variable for frontend URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

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
