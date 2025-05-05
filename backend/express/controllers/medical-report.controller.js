const MedicalReport = require('../models/medical-report.model');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

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

// Télécharger un rapport au format PDF
const downloadReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await MedicalReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Créer un document PDF simple
    const doc = new PDFDocument({ 
      margin: 50,  // Marge augmentée
      size: 'A4',
      info: {
        Title: `Rapport Médical - ${report.patientName}`,
        Author: 'MedWin Analyzing',
        Subject: 'Rapport d\'analyse médicale'
      }
    });

    // Définir les en-têtes pour le téléchargement du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-medical-${reportId}.pdf"`);

    // Envoyer le PDF à la réponse
    doc.pipe(res);

    // Couleurs simples
    const colors = {
      primary: '#4338ca',    // Indigo 700
      primaryLight: '#e0e7ff', // Indigo 100
      lightGray: '#f3f4f6',  // Gray 100
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
         .text('Rapport d\'Analyse Médicale', 120, 50, { align: 'center' });
    } else {
      // Si le logo n'existe pas, centrer le titre
      doc.fillColor(colors.primary)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('Rapport d\'Analyse Médicale', { align: 'center' });
    }
    
    doc.fontSize(15)
       .fillColor(colors.textColor)
       .text('MedWin Analyzing', { align: 'center' });
    
    doc.moveDown(2);

    
    // Cadre pour les informations du patient avec coins arrondis
    const patientInfoY = doc.y;
    // Dessiner un rectangle avec bordure légère et coins arrondis
    doc.roundedRect(50, patientInfoY, doc.page.width - 100, 120, 10)  // Hauteur augmentée à 120px
       .fillAndStroke(colors.primaryLight, colors.borderColor);
    
    // Table des informations de base
    const infoTable = {
      headers: ['Patient', 'Demandé par', 'Date d\'analyse'],
      rows: [[
        report.patientName,
        report.doctorName,
        new Date(report.analysisDate).toLocaleDateString('fr-FR')
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
      { title: 'Paramètre', width: pageWidth * 0.18, property: 'parameterName' },
      { title: 'Valeur', width: pageWidth * 0.08, property: 'currentValue' },
      { title: 'Unité', width: pageWidth * 0.08, property: 'unit' },
      { title: 'Valeurs usuelles', width: pageWidth * 0.12, property: 'normalRange' },
      { title: 'Statut', width: pageWidth * 0.10, property: 'riskStatus' },
      { title: 'Tendance', width: pageWidth * 0.14, property: 'trend' },
      { title: 'Conseil', width: pageWidth * 0.30, property: 'advice' }
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
           .text('Rapport d\'Analyse Médicale (suite)', {
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
         .text(result.riskStatus || '-', x, y + 13, {
           width: columns[4].width - 5,
           align: 'center'
         });
      
      x += columns[4].width;
      
      // Tendance - avec sauts de ligne automatiques
      doc.fillColor(colors.textColor)
         .fontSize(9)
         .font('Helvetica')
         .text(result.trend || '-', x, y + 8, {
           width: columns[5].width - 8,
           align: 'left',
           lineGap: 2
         });
      
      x += columns[5].width;
      
      // Conseil - avec sauts de ligne automatiques et police plus visible
      doc.fontSize(10)
         .text(result.advice || '-', x, y + 8, {
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
    
    // Pied de page
    doc.fontSize(9)
       .fillColor(colors.mediumGray)
       .text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')} | MedWin Analyzing | Page ${doc.page.pageNumber}`, 
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

module.exports = {
  createReport,
  getUserReports,
  getReport,
  deleteReport,
  downloadReport
}; 