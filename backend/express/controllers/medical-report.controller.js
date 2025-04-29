const MedicalReport = require('../models/medical-report.model');

// Créer un nouveau rapport médical
const createReport = async (req, res) => {
  try {
    const { auth0Id, patientName, doctorName, analysisDate, results } = req.body;
    
    const report = new MedicalReport({
      auth0Id,
      patientName,
      doctorName,
      analysisDate: new Date(analysisDate),
      results
    });

    const savedReport = await report.save();
    res.status(201).json(savedReport);
  } catch (err) {
    console.error('Error creating medical report:', err);
    res.status(500).json({ message: 'Error creating medical report', error: err.message });
  }
};

// Récupérer tous les rapports d'un utilisateur
const getUserReports = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const reports = await MedicalReport.find({ auth0Id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching user reports:', err);
    res.status(500).json({ message: 'Error fetching user reports', error: err.message });
  }
};

// Récupérer un rapport spécifique
const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await MedicalReport.findById(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ message: 'Error fetching report', error: err.message });
  }
};

// Supprimer un rapport
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReport = await MedicalReport.findByIdAndDelete(id);
    
    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ message: 'Error deleting report', error: err.message });
  }
};

module.exports = {
  createReport,
  getUserReports,
  getReport,
  deleteReport
}; 