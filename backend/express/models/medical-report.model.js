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
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalReport', medicalReportSchema); 