const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true }, // ID de l'utilisateur qui a créé le rapport
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  analysisDate: { type: Date, required: true },
  results: [{
    parameterCode: String,
    currentValue: String,
    unit: String,
    normalRange: String,
    normalMin: String,
    normalMax: String,
    previousValue: String,
    previousDate: String,
    shortName: String,
    parameterName: String,
    family: String,
    // Champs de risque
    riskStatus: String,
    riskDegree: String,
    trend: String,
    advice: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Champs pour le suivi des réanalyses
  isReanalyzed: { type: Boolean, default: false },
  reanalysisDate: { type: Date },
  reanalysisCount: { type: Number, default: 0 },
  lastUpdated: { type: Date }
});

// Middleware pre-save pour mettre à jour les timestamps
medicalReportSchema.pre('save', function(next) {
  // Mettre à jour updatedAt à chaque save
  this.updatedAt = new Date();
  
  // Si c'est une réanalyse, incrémenter le compteur
  if (this.isReanalyzed && this.isModified('results')) {
    this.reanalysisCount += 1;
    this.lastUpdated = new Date();
  }
  
  next();
});

module.exports = mongoose.model('MedicalReport', medicalReportSchema); 