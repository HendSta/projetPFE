const MedicalReport = require('../models/medical-report.model');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { translatePredictionMessage, translateRiskStatus } = require('../utils/translation-utils');

// Créer un nouveau rapport médical
const createReport = async (req, res) => {
  try {
    const { auth0Id, patientName, doctorName, analysisDate, results, diseasePrediction } = req.body;
    
    const reportData = {
      auth0Id,
      patientName,
      doctorName,
      analysisDate: new Date(analysisDate),
      results
    };

    // Ajouter la prédiction de maladie si elle existe
    if (diseasePrediction) {
      reportData.diseasePrediction = diseasePrediction;
    }
    
    const report = new MedicalReport(reportData);

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

// Télécharger un rapport au format PDF
const downloadReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const language = req.query.lang || 'fr'; // Récupérer la langue depuis les paramètres de requête
    const report = await MedicalReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Définir les traductions selon la langue
    const translations = {
      fr: {
        title: 'Rapport d\'Analyse Médicale',
        subtitle: 'MedWin Analyzing',
        patient: 'Patient',
        requestedBy: 'Demandé par',
        analysisDate: 'Date d\'analyse',
        parameter: 'Paramètre',
        value: 'Valeur',
        unit: 'Unité',
        usualValues: 'Valeurs usuelles',
        status: 'Statut',
        trend: 'Tendance',
        advice: 'Conseil',
        diseasePrediction: 'Prédiction de Maladie',
        predictionResult: 'Résultat de la Prédiction',
        confidenceLevel: 'Niveau de Confiance',
        explanation: 'Explication',
        recommendations: 'Recommandations',
        reportGenerated: 'Rapport généré le',
        page: 'Page',
        reportContinuation: 'Rapport d\'Analyse Médicale (suite)',
        filename: `rapport-medical-${reportId}.pdf`
      },
      en: {
        title: 'Medical Analysis Report',
        subtitle: 'MedWin Analyzing',
        patient: 'Patient',
        requestedBy: 'Requested by',
        analysisDate: 'Analysis Date',
        parameter: 'Parameter',
        value: 'Value',
        unit: 'Unit',
        usualValues: 'Usual Values',
        status: 'Status',
        trend: 'Trend',
        advice: 'Advice',
        diseasePrediction: 'Disease Prediction',
        predictionResult: 'Prediction Result',
        confidenceLevel: 'Confidence Level',
        explanation: 'Explanation',
        recommendations: 'Recommendations',
        reportGenerated: 'Report generated on',
        page: 'Page',
        reportContinuation: 'Medical Analysis Report (continued)',
        filename: `medical-report-${reportId}.pdf`
      }
    };

    const t = translations[language] || translations.fr; // Utiliser français par défaut

    // Function to translate prediction messages using translation keys
    const translatePredictionMessageLocal = (message) => {
      return translatePredictionMessage(message, language);
    };

    // Function to translate risk status
    const translateRiskStatusLocal = (status) => {
      return translateRiskStatus(status, language);
    };

    // Créer un document PDF simple
    const doc = new PDFDocument({ 
      margin: 50,  // Marge augmentée
      size: 'A4',
      info: {
        Title: language === 'en' ? `Medical Report - ${report.patientName}` : `Rapport Médical - ${report.patientName}`,
        Author: 'MedWin Analyzing',
        Subject: language === 'en' ? 'Medical analysis report' : 'Rapport d\'analyse médicale'
      }
    });

    // Définir les en-têtes pour le téléchargement du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${t.filename}"`);

    // Envoyer le PDF à la réponse
    doc.pipe(res);

    // Couleurs simples
    const colors = {
      primary: '#4338ca',    // Indigo 700
      primaryLight: '#e0e7ff', // Indigo 100
      lightGray: '#f3f4f6',  // Gray 100
      lightBlue: '#dbeafe',  // Blue 100 pour la section prédiction
      mediumGray: '#9ca3af', // Gray 400
      textColor: '#1f2937',  // Gray 800
      green: '#10b981',      // Green 500
      yellow: '#f59e0b',     // Amber 500
      red: '#ef4444',        // Red 500
      white: '#ffffff',
      borderColor: '#d1d5db' // Gray 300
    };

    // Fonction pour limiter la longueur du texte uniquement si c'est vraiment nécessaire
    const truncate = (text, maxLength = 80) => {
      if (!text) return 'N/A';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Chemin vers le logo
    const logoPath = path.join(__dirname, '../../../frontend/src/assets/images/logo.jpg');
    
    // Vérifier si le logo existe
    if (fs.existsSync(logoPath)) {
      // Ajouter le logo en haut
      doc.image(logoPath, 50, 40, { width: 60 });
      
      // Ajuster la position du titre pour qu'il soit à côté du logo
      doc.fillColor(colors.primary)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text(t.title, 120, 50, { align: 'center' });
    } else {
      // Si le logo n'existe pas, centrer le titre
      doc.fillColor(colors.primary)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text(t.title, { align: 'center' });
    }
    
    doc.fontSize(15)
       .fillColor(colors.textColor)
       .text(t.subtitle, { align: 'center' });
    
    doc.moveDown(2);

    
    // Cadre pour les informations du patient avec coins arrondis
    const patientInfoY = doc.y;
    // Dessiner un rectangle avec bordure légère et coins arrondis
    doc.roundedRect(50, patientInfoY, doc.page.width - 100, 120, 10)  // Hauteur augmentée à 120px
       .fillAndStroke(colors.primaryLight, colors.borderColor);
    
    // Table des informations de base
    const infoTable = {
      headers: [t.patient, t.requestedBy, t.analysisDate],
      rows: [[
        report.patientName,
        report.doctorName,
        new Date(report.analysisDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')
      ]]
    };
    
    doc.font('Helvetica-Bold')
       .fillColor(colors.textColor)
       .fontSize(12);
    
    // Dessiner les colonnes d'information patient avec plus d'espace
    const infoTableTop = patientInfoY + 25;  // Position ajustée
    const infoTableWidth = doc.page.width - 120;
    const infoColWidth = infoTableWidth / 3;
    
    // En-têtes des infos patient
    for (let i = 0; i < infoTable.headers.length; i++) {
      doc.text(infoTable.headers[i], 65 + (i * infoColWidth), infoTableTop, {  // Marge gauche augmentée
        width: infoColWidth,
        align: 'left'
      });
    }
    
    // Valeurs des infos patient
    doc.font('Helvetica')
       .fontSize(11);
       
    for (let i = 0; i < infoTable.rows[0].length; i++) {
      doc.text(infoTable.rows[0][i], 65 + (i * infoColWidth), infoTableTop + 40, {  // Plus d'espace entre en-tête et valeur
        width: infoColWidth,
        align: 'left'
      });
    }
    
    doc.moveDown(5); 
    
    // Tableau des résultats d'analyse
    const startY = doc.y;
    const pageWidth = doc.page.width - 100;  // Largeur ajustée
    
    // Définir les colonnes avec des largeurs proportionnelles pour une meilleure lisibilité
    // Répartition plus adaptée aux contenus longs
    const columns = [
      { title: t.parameter, width: pageWidth * 0.18, property: 'parameterName' },
      { title: t.value, width: pageWidth * 0.08, property: 'currentValue' },
      { title: t.unit, width: pageWidth * 0.08, property: 'unit' },
      { title: t.usualValues, width: pageWidth * 0.12, property: 'normalRange' },
      { title: t.status, width: pageWidth * 0.10, property: 'riskStatus' },
      { title: t.trend, width: pageWidth * 0.14, property: 'trend' },
      { title: t.advice, width: pageWidth * 0.30, property: 'advice' }
    ];
    
    // En-têtes des colonnes
    let y = startY;
    
    // Rectangle de fond pour l'en-tête du tableau de résultats
    doc.rect(50, y, pageWidth, 35)
       .fill(colors.primary);
       
    doc.fillColor(colors.white);
    
    let x = 55;
    for (const column of columns) {
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .text(column.title, x, y + 12, {
           width: column.width - 5,
           align: 'center'
         });
      x += column.width;
    }
    
    y += 35;
    
    // Calculer dynamiquement la hauteur des lignes en fonction du contenu
    for (let i = 0; i < report.results.length; i++) {
      const result = report.results[i];
      
      // Hauteur de base minimum
      let rowHeight = 55;
      
      // Estimer l'espace nécessaire pour le texte de tendance
      if (result.trend) {
        const trendLines = Math.ceil(result.trend.length / 25); // Environ 25 caractères par ligne
        const trendHeight = trendLines * 15; // 15 pixels par ligne
        rowHeight = Math.max(rowHeight, trendHeight + 20); // +20 pour les marges
      }
      
      // Estimer l'espace nécessaire pour le texte de conseil
      if (result.advice) {
        const adviceLines = Math.ceil(result.advice.length / 30); // Environ 30 caractères par ligne
        const adviceHeight = adviceLines * 15; // 15 pixels par ligne
        rowHeight = Math.max(rowHeight, adviceHeight + 20); // +20 pour les marges
      }
      
      // Vérifier si on doit aller à une nouvelle page
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        
        // Ajouter un en-tête simple sur la nouvelle page
        doc.fillColor(colors.primary)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(t.reportContinuation, {
             align: 'center'
           });
           
        doc.moveDown(1);
        
        // Redessiner les en-têtes de colonnes
        y = doc.y;
        
        // Rectangle de fond pour l'en-tête du tableau
        doc.rect(50, y, pageWidth, 35)
           .fill(colors.primary);
           
        doc.fillColor(colors.white);
        
        x = 55;
        for (const column of columns) {
          doc.font('Helvetica-Bold')
             .fontSize(11)
             .text(column.title, x, y + 12, {
               width: column.width - 5,
               align: 'center'
             });
          x += column.width;
        }
        
        y += 35;
      }
      
      // Alterner les couleurs de fond pour une meilleure lisibilité
      if (i % 2 === 0) {
        doc.rect(50, y, pageWidth, rowHeight)
           .fill(colors.lightGray);
      }
      
      // Dessiner les valeurs de chaque colonne
      x = 55;
      
      // Paramètre
      doc.fillColor(colors.textColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(result.parameterName, x, y + 13, {
           width: columns[0].width - 8,
           align: 'left'
         });
      
      x += columns[0].width;
      
      // Valeur
      doc.font('Helvetica')
         .fontSize(10)
         .text(result.currentValue.toString(), x, y + 13, {
           width: columns[1].width - 5,
           align: 'center'
         });
      
      x += columns[1].width;
      
      // Unité
      doc.text(result.unit || '-', x, y + 13, {
        width: columns[2].width - 5,
        align: 'center'
      });
      
      x += columns[2].width;
      
      // Plage normale - sans troncature
      doc.fontSize(9)
         .text(result.normalRange || `${result.normalMin || '-'} - ${result.normalMax || '-'}`, 
        x, y + 13, {
          width: columns[3].width - 5,
          align: 'left'
        });
      
      x += columns[3].width;
      
      // Statut avec couleur
      let statusColor;
      switch(result.riskStatus) {
        case 'NORMAL': statusColor = colors.green; break;
        case 'BAS': statusColor = colors.yellow; break;
        case 'ÉLEVÉ': statusColor = colors.red; break;
        default: statusColor = colors.mediumGray;
      }
      
      doc.fillColor(statusColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(translateRiskStatusLocal(result.riskStatus) || '-', x, y + 13, {
           width: columns[4].width - 5,
           align: 'center'
         });
      
      x += columns[4].width;
      
      // Tendance - avec sauts de ligne automatiques
      doc.fillColor(colors.textColor)
         .fontSize(9)
         .font('Helvetica')
         .text(translatePredictionMessageLocal(result.trend) || '-', x, y + 8, {
           width: columns[5].width - 8,
           align: 'left',
           lineGap: 2
         });
      
      x += columns[5].width;
      
      // Conseil - avec sauts de ligne automatiques et police plus visible
      doc.fontSize(10)
         .text(translatePredictionMessageLocal(result.advice) || '-', x, y + 8, {
           width: columns[6].width - 8,
           align: 'left',
           lineGap: 2
         });
      
      // Passer à la ligne suivante avec la hauteur calculée
      y += rowHeight;
    }
    
    // Ajouter une bordure au tableau complet
    doc.rect(50, startY, pageWidth, y - startY)
       .lineWidth(0.5)
       .stroke(colors.borderColor);
       
    // Ligne horizontale après l'en-tête
    doc.moveTo(50, startY + 35)
       .lineTo(50 + pageWidth, startY + 35)
       .lineWidth(0.5)
       .stroke(colors.borderColor);
    
    // Section Prédiction de Maladie
    if (report.diseasePrediction) {
      // Vérifier si on doit aller à une nouvelle page
      if (y + 200 > doc.page.height - 100) {
        doc.addPage();
        
        // Ajouter un en-tête simple sur la nouvelle page
        doc.fillColor(colors.primary)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(t.reportContinuation, {
             align: 'center'
           });
           
        doc.moveDown(1);
        y = doc.y;
      }
      
      doc.moveDown(2);
      
      // Titre de la section Prédiction
      doc.fillColor(colors.primary)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(t.diseasePrediction, 50, doc.y, {
           align: 'left'
         });
      
      doc.moveDown(1);
      
      // Encadré pour la prédiction
      const predictionY = doc.y;
      const predictionHeight = 180;
      
      // Rectangle de fond pour la section prédiction
      doc.rect(50, predictionY, pageWidth, predictionHeight)
         .fill(colors.lightBlue);
      
      // Bordure du rectangle
      doc.rect(50, predictionY, pageWidth, predictionHeight)
         .lineWidth(1)
         .stroke(colors.primary);
      
      let currentY = predictionY + 20;
      
      // Résultat de la prédiction
      doc.fillColor(colors.textColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(t.predictionResult + ':', 60, currentY);
      
      currentY += 20;
      
      // Traduire le contenu de la prédiction
      let translatedPrediction = translatePredictionMessageLocal(report.diseasePrediction.prediction);
      
      doc.fillColor(colors.textColor)
         .fontSize(11)
         .font('Helvetica')
         .text(translatedPrediction, 60, currentY, {
           width: pageWidth - 20,
           align: 'left',
           lineGap: 3
         });
      
      currentY += 40;
      
      // Niveau de confiance
      doc.fillColor(colors.textColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(t.confidenceLevel + ':', 60, currentY);
      
      currentY += 20;
      
      // Traduire le niveau de confiance
      let translatedConfidence = translatePredictionMessageLocal(report.diseasePrediction.confidence);
      
      doc.fillColor(colors.green)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(translatedConfidence, 60, currentY);
      
      currentY += 30;
      
      // Explication
      doc.fillColor(colors.textColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(t.explanation + ':', 60, currentY);
      
      currentY += 20;
      
      // Traduire l'explication
      let translatedExplanation = translatePredictionMessageLocal(report.diseasePrediction.explanation);
      
      doc.fillColor(colors.textColor)
         .fontSize(11)
         .font('Helvetica')
         .text(translatedExplanation, 60, currentY, {
           width: pageWidth - 20,
           align: 'left',
           lineGap: 3
         });
      
      currentY += 40;
      
      // Recommandations
      doc.fillColor(colors.textColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(t.recommendations + ':', 60, currentY);
      
      currentY += 20;
      
      // Traduire les recommandations
      let translatedRecommendations = translatePredictionMessageLocal(report.diseasePrediction.recommendations);
      
      doc.fillColor(colors.textColor)
         .fontSize(11)
         .font('Helvetica')
         .text(translatedRecommendations, 60, currentY, {
           width: pageWidth - 20,
           align: 'left',
           lineGap: 3
         });
      
      y = predictionY + predictionHeight + 20;
    }
    
    // Pied de page
    doc.fontSize(9)
       .fillColor(colors.mediumGray)
       .text(`${t.reportGenerated} ${new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')} | MedWin Analyzing | ${t.page} ${doc.page.pageNumber}`, 
        50, doc.page.height - 30, {
          align: 'center'
        });
    
    // Finaliser le document
    doc.end();

  } catch (err) {
    console.error('Error downloading report:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF report' });
    }
  }
};

// Mettre à jour un rapport existant
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { auth0Id, patientName, doctorName, analysisDate, results, isReanalysis, diseasePrediction } = req.body;
    
    // Vérifier si le rapport existe
    const existingReport = await MedicalReport.findById(id);
    
    if (!existingReport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du rapport
    if (existingReport.auth0Id !== auth0Id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce rapport' });
    }
    
    // Mettre à jour les champs
    existingReport.patientName = patientName;
    existingReport.doctorName = doctorName;
    existingReport.analysisDate = new Date(analysisDate);
    existingReport.results = results;
    existingReport.lastUpdated = new Date(); // Ajouter un horodatage de mise à jour
    
    // Mettre à jour la prédiction de maladie si elle existe
    if (diseasePrediction) {
      existingReport.diseasePrediction = diseasePrediction;
    }
    
    // Ajouter une information que c'est une réanalyse
    if (isReanalysis) {
      existingReport.isReanalyzed = true;
      existingReport.reanalysisDate = new Date();
    }
    
    const updatedReport = await existingReport.save();
    res.json(updatedReport);
  } catch (err) {
    console.error('Error updating medical report:', err);
    res.status(500).json({ message: 'Error updating medical report', error: err.message });
  }
};

module.exports = {
  createReport,
  getUserReports,
  getReport,
  deleteReport,
  downloadReport,
  updateReport
}; 