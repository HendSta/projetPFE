const express = require('express');
const router = express.Router();
const { createReport, getUserReports, getReport, deleteReport } = require('../controllers/medical-report.controller');

// Créer un nouveau rapport médical
router.post('/', createReport);

// Récupérer tous les rapports d'un utilisateur
router.get('/user/:auth0Id', getUserReports);

// Récupérer un rapport spécifique
router.get('/:id', getReport);

// Supprimer un rapport
router.delete('/:id', deleteReport);

module.exports = router; 