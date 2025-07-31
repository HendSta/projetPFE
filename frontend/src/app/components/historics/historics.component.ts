import { Component, OnInit } from '@angular/core';
import { MedicalReportService } from '../../services/medical-report.service';
import { AuthService } from '@auth0/auth0-angular';
import { Loader, FileText, Eye, Trash2, X, Stethoscope, Download, Search, RefreshCw, User, Calendar } from 'lucide-angular';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

interface MedicalReport {
  _id: string;
  auth0Id: string;
  patientName: string;
  doctorName: string;
  analysisDate: string;
  results: Array<{
    parameterName: string;
    parameterCode: string;
    currentValue: string | number;
    unit: string;
    normalRange?: string;
    normalMin?: string | number;
    normalMax?: string | number;
    riskStatus?: 'NORMAL' | 'BAS' | 'ÉLEVÉ';
    riskDegree?: 'Aucun' | 'Faible' | 'Modéré' | 'Élevé';
    trend?: string;
    advice?: string;
  }>;
  diseasePrediction?: {
    prediction: string;
    confidence: string;
    explanation: string;
    recommendations: string;
  };
  isReanalyzed?: boolean;
  reanalysisDate?: string;
  reanalysisCount?: number;
  lastUpdated?: string;
}

@Component({
  selector: 'app-historics',
  templateUrl: './historics.component.html',
  styleUrls: ['./historics.component.css']
})
export class HistoricsComponent implements OnInit {
  reports: MedicalReport[] = [];
  filteredReports: MedicalReport[] = [];
  isLoading = false;
  errorMessage = '';
  selectedReport: MedicalReport | null = null;
  showReportDetails = false;
  
  // Propriété pour la recherche unifiée
  searchQuery: string = '';

  analyzedPercentage: number = 0;
  notFullyAnalyzedCount: number = 0;

  constructor(
    private medicalReportService: MedicalReportService,
    private auth: AuthService,
    private router: Router,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.medicalReportService.getUserReports().subscribe({
      next: (reports) => {
        console.log('📊 Loaded reports from API:', reports);
        reports.forEach((report, index) => {
          console.log(`📋 Report ${index + 1}:`, {
            id: report._id,
            patientName: report.patientName,
            hasDiseasePrediction: !!report.diseasePrediction,
            diseasePrediction: report.diseasePrediction
          });
        });
        
        this.reports = reports;
        this.filteredReports = [...reports];
        this.isLoading = false;
        this.updateAnalysisStats();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load reports. Please try again later.';
        this.isLoading = false;
        console.error('Error loading reports:', error);
      }
    });
  }

  // Méthode utilitaire pour convertir la date en format local
  private convertToLocalDate(dateString: string): Date {
    const date = new Date(dateString);
    // Ajuster pour le décalage horaire local
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate;
  }

  // Méthode pour formater la date en format lisible
  formatDate(dateString: string): string {
    const date = this.convertToLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  applyFilters() {
    if (!this.searchQuery.trim()) {
      this.filteredReports = [...this.reports];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    
    this.filteredReports = this.reports.filter(report => {
      // Formatage de la date du rapport en anglais (ex: August 4, 2024)
      const reportDateStr = this.convertToLocalDate(report.analysisDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).toLowerCase();
      
      // Recherche par date (partielle) ou par nom de patient
      return report.patientName.toLowerCase().includes(query) || reportDateStr.includes(query);
    });

    this.updateAnalysisStats();
  }

  resetFilters() {
    this.searchQuery = '';
    this.filteredReports = [...this.reports];
    this.updateAnalysisStats();
  }

  viewReportDetails(report: MedicalReport) {
    console.log('🔍 Viewing report details:', report);
    console.log('🔍 Disease prediction exists:', !!report.diseasePrediction);
    if (report.diseasePrediction) {
      console.log('🔍 Disease prediction details:', report.diseasePrediction);
    }
    this.selectedReport = report;
    this.showReportDetails = true;
  }

  closeReportDetails() {
    this.selectedReport = null;
    this.showReportDetails = false;
  }

  deleteReport(id: string) {
    if (confirm('Are you sure you want to delete this report?')) {
      this.medicalReportService.deleteReport(id).subscribe({
        next: () => {
          this.reports = this.reports.filter(report => report._id !== id);
          this.applyFilters();
          if (this.selectedReport?._id === id) {
            this.closeReportDetails();
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete report. Please try again later.';
          console.error('Error deleting report:', error);
        }
      });
    }
  }

  downloadReport(id: string) {
    this.isLoading = true;
    
    // Détecter la langue actuelle
    const currentLang = this.translateService.currentLang || 'fr';
    
    this.medicalReportService.downloadReport(id, currentLang).subscribe({
      next: (blob) => {
        this.isLoading = false;
        // Créer une URL pour le blob
        const url = window.URL.createObjectURL(blob);
        
        // Créer un élément de lien
        const a = document.createElement('a');
        a.href = url;
        a.download = currentLang === 'en' ? `medical-report-${id}.pdf` : `rapport-medical-${id}.pdf`;
        
        // Ajouter au document et déclencher le téléchargement
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Échec du téléchargement du rapport. Veuillez réessayer plus tard.';
        console.error('Error downloading report:', error);
      }
    });
  }

  reanalyzeReport(report: MedicalReport) {
    // Store report data in localStorage to pass it to analyzing component
    localStorage.setItem('reportToReanalyze', JSON.stringify(report));
    
    // Store the original report ID for reference
    localStorage.setItem('originalReportId', report._id);
    
    // Navigate to analyzing component inside the doctor dashboard
    this.router.navigate(['analyzing']);
    
    // Close the modal
    this.closeReportDetails();
  }

  // Méthode de test pour créer un rapport avec prédiction
  createTestReport() {
    const testReportData = {
      auth0Id: 'test-user',
      patientName: 'Patient Test',
      doctorName: 'Dr. Test',
      analysisDate: new Date().toISOString(),
      results: [
        {
          parameterCode: 'TEST001',
          currentValue: '120',
          unit: 'mg/dL',
          normalRange: '70-100',
          normalMin: '70',
          normalMax: '100',
          parameterName: 'Glucose',
          riskStatus: 'ÉLEVÉ',
          riskDegree: 'Modéré',
          trend: 'Augmentation',
          advice: 'Surveillance recommandée'
        }
      ],
      diseasePrediction: {
        prediction: 'Possibilité de diabète de type 2\nRisque de syndrome métabolique',
        confidence: 'Modérée',
        explanation: 'Analyse basée sur les paramètres anormaux détectés.',
        recommendations: 'Consultez un endocrinologue pour confirmation et suivi.'
      }
    };

    console.log('🧪 Creating test report with prediction:', testReportData);
    
    this.medicalReportService.createReport(testReportData).subscribe({
      next: (response) => {
        console.log('✅ Test report created successfully:', response);
        this.loadReports(); // Recharger les rapports
      },
      error: (error) => {
        console.error('❌ Error creating test report:', error);
      }
    });
  }

  private updateAnalysisStats() {
    const total = this.filteredReports.length;
    if (total === 0) {
      this.analyzedPercentage = 0;
      this.notFullyAnalyzedCount = 0;
      return;
    }
    let fullyAnalyzed = 0;
    let notFullyAnalyzed = 0;

    this.filteredReports.forEach(report => {
      // Un rapport est "totalement analysé" si tous ses résultats ont un riskStatus défini
      const allAnalyzed = report.results.every(r => !!r.riskStatus);
      if (allAnalyzed) {
        fullyAnalyzed++;
      } else {
        notFullyAnalyzed++;
      }
    });

    this.analyzedPercentage = Math.round((fullyAnalyzed / total) * 100);
    this.notFullyAnalyzedCount = notFullyAnalyzed;
  }

    // Méthode pour traduire les messages de prédiction
  getTranslatedPrediction(message: string): string {
    if (!message) return '-';
    
    // Vérifier d'abord les phrases avec des codes de paramètres spécifiques
    const medicalConsultationPattern = /^Consultation médicale recommandée\. Le ([A-Z0-9]+) présente un risque élevé\.$/;
    const monitorNextControlPattern = /^À surveiller lors du prochain contrôle\. Le ([A-Z0-9]+) est légèrement bas\.$/;
    const surveillanceRecommendedPattern = /^Surveillance recommandée\. Le ([A-Z0-9]+) est bas avec un risque modéré\.$/;
    
    const currentLang = this.translateService.currentLang || 'fr';
    
    // Vérifier le pattern "Consultation médicale recommandée"
    const medicalMatch = message.match(medicalConsultationPattern);
    if (medicalMatch) {
      const parameterCode = medicalMatch[1];
      if (currentLang === 'en') {
        return `Medical consultation recommended. The ${parameterCode} presents a high risk.`;
      } else {
        return message; // Garder en français
      }
    }
    
    // Vérifier le pattern "À surveiller lors du prochain contrôle"
    const monitorMatch = message.match(monitorNextControlPattern);
    if (monitorMatch) {
      const parameterCode = monitorMatch[1];
      if (currentLang === 'en') {
        return `To monitor during the next control. The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }
    
    // Vérifier le pattern "Surveillance recommandée"
    const surveillanceMatch = message.match(surveillanceRecommendedPattern);
    if (surveillanceMatch) {
      const parameterCode = surveillanceMatch[1];
      if (currentLang === 'en') {
        return `Surveillance recommended. The ${parameterCode} is low with moderate risk.`;
      } else {
        return message; // Garder en français
      }
    }
    
    // Mapper les messages français vers les clés de traduction
    const messageKeyMap: { [key: string]: string } = {
      'Anomalies biologiques détectées nécessitant une évaluation médicale': 'BIOLOGICAL_ANOMALIES_DETECTED',
      'Analyse basée sur les paramètres anormaux détectés.': 'ANALYSIS_BASED_ON_ABNORMAL_PARAMETERS',
      'Consultez un professionnel de santé pour confirmation et suivi.': 'CONSULT_HEALTHCARE_PROFESSIONAL',
      'Aucune maladie détectée': 'NO_DISEASE_DETECTED',
      'Tous les paramètres biologiques sont dans les plages normales.': 'ALL_PARAMETERS_NORMAL',
      'Continuez à maintenir un mode de vie sain.': 'MAINTAIN_HEALTHY_LIFESTYLE',
      'Possibilité de insuffisance rénale': 'RENAL_INSUFFICIENCY_POSSIBILITY',
      'Modérée': 'CONFIDENCE_MODERATE',
      'Élevée': 'CONFIDENCE_HIGH',
      'Faible': 'CONFIDENCE_LOW',
      'Stable': 'TREND_STABLE',
      'En hausse': 'TREND_EN_HAUSSE',
      'En baisse': 'TREND_EN_BAISSE',
      'Augmentation': 'TREND_AUGMENTATION',
      'Consultez votre médecin rapidement.': 'ADVICE_CONSULT_DOCTOR_QUICKLY',
      'Surveillez ce paramètre et discutez-en lors de votre prochaine visite médicale.': 'ADVICE_MONITOR_PARAMETER',
      'Valeur légèrement inférieure à la normale, sans danger immédiat.': 'ADVICE_SLIGHTLY_BELOW_NORMAL',
      'Valeur légèrement supérieure à la normale, sans danger immédiat.': 'ADVICE_SLIGHTLY_ABOVE_NORMAL',
      'Surveillance recommandée': 'ADVICE_SURVEILLANCE_RECOMMENDED',
      'Indéterminée': 'TREND_UNDETERMINED',
      'Indéterminée (pas de valeur antérieure)': 'TREND_UNDETERMINED_NO_PREVIOUS_VALUE',
      'Aucune évaluation de risque disponible pour ce paramètre.': 'ADVICE_NO_RISK_ASSESSMENT',
      'Erreur lors de l\'analyse de risque simplifiée.': 'ADVICE_SIMPLIFIED_ANALYSIS_ERROR',
              'Aucune action particulière requise. Les valeurs sont dans la plage normale.': 'ADVICE_NO_ACTION_REQUIRED',
      'À surveiller lors du prochain contrôle. Le {parameterCode} est légèrement bas.': 'ADVICE_MONITOR_NEXT_CONTROL_BAS',
      'Consultation médicale recommandée. Le {parameterCode} présente un risque élevé.': 'ADVICE_MEDICAL_CONSULTATION_RECOMMENDED_PARAM',
        'Possibilité de hypercholestérolémie': 'POSSIBILITY_HYPERCHOLESTEROLEMIA',
        'Possibilité de diabète': 'POSSIBILITY_DIABETES',
        'Possibilité de anémie': 'POSSIBILITY_ANEMIA'
      };
      
      // Obtenir la clé de traduction
      const translationKey = messageKeyMap[message];
      if (!translationKey) return message;
      
      // Retourner la traduction selon la langue actuelle
      if (currentLang === 'en') {
        const englishTranslations: { [key: string]: string } = {
          'BIOLOGICAL_ANOMALIES_DETECTED': 'Biological anomalies detected requiring medical evaluation',
          'ANALYSIS_BASED_ON_ABNORMAL_PARAMETERS': 'Analysis based on detected abnormal parameters.',
          'CONSULT_HEALTHCARE_PROFESSIONAL': 'Consult a healthcare professional for confirmation and follow-up.',
          'NO_DISEASE_DETECTED': 'No disease detected',
          'ALL_PARAMETERS_NORMAL': 'All biological parameters are within normal ranges.',
          'MAINTAIN_HEALTHY_LIFESTYLE': 'Continue to maintain a healthy lifestyle.',
          'RENAL_INSUFFICIENCY_POSSIBILITY': 'Possibility of renal insufficiency',
          'CONFIDENCE_MODERATE': 'Moderate',
          'CONFIDENCE_HIGH': 'High',
          'CONFIDENCE_LOW': 'Low',
          'TREND_STABLE': 'Stable',
          'TREND_EN_HAUSSE': 'Increasing',
          'TREND_EN_BAISSE': 'Decreasing',
          'TREND_AUGMENTATION': 'Increasing',
          'ADVICE_CONSULT_DOCTOR_QUICKLY': 'Consult your doctor quickly.',
          'ADVICE_MONITOR_PARAMETER': 'Monitor this parameter and discuss it during your next medical visit.',
          'ADVICE_SLIGHTLY_BELOW_NORMAL': 'Value slightly below normal, no immediate danger.',
          'ADVICE_SLIGHTLY_ABOVE_NORMAL': 'Value slightly above normal, no immediate danger.',
          'ADVICE_SURVEILLANCE_RECOMMENDED': 'Surveillance recommended',
          'TREND_UNDETERMINED': 'Undetermined',
          'TREND_UNDETERMINED_NO_PREVIOUS_VALUE': 'Undetermined (no previous value)',
          'ADVICE_NO_RISK_ASSESSMENT': 'No risk assessment available for this parameter.',
          'ADVICE_SIMPLIFIED_ANALYSIS_ERROR': 'Error during simplified risk analysis.',
          'ADVICE_NO_ACTION_REQUIRED': 'No particular action required. The values are within the normal range.',
          'ADVICE_MONITOR_NEXT_CONTROL': 'To monitor during the next control. The {parameterCode} is slightly {status}.',
          'ADVICE_MONITOR_NEXT_CONTROL_BAS': 'To monitor during the next control. The {parameterCode} is slightly low.',
          'ADVICE_SURVEILLANCE_RECOMMENDED_PARAM': 'Surveillance recommended. The {parameterCode} is {status} with moderate risk.',
          'ADVICE_MEDICAL_CONSULTATION_RECOMMENDED': 'Medical consultation recommended. The {parameterCode} presents a high risk.',
          'ADVICE_MEDICAL_CONSULTATION_RECOMMENDED_PARAM': 'Medical consultation recommended. The {parameterCode} presents a high risk.',
          'POSSIBILITY_HYPERCHOLESTEROLEMIA': 'Possibility of hypercholesterolemia',
          'POSSIBILITY_DIABETES': 'Possibility of diabetes',
          'POSSIBILITY_ANEMIA': 'Possibility of anemia',
          'POSSIBILITY_RENAL_INSUFFICIENCY': 'Possibility of renal insufficiency'
        };
        return englishTranslations[translationKey] || message;
      } else {
        // Français (par défaut)
        const frenchTranslations: { [key: string]: string } = {
          'BIOLOGICAL_ANOMALIES_DETECTED': 'Anomalies biologiques détectées nécessitant une évaluation médicale',
          'ANALYSIS_BASED_ON_ABNORMAL_PARAMETERS': 'Analyse basée sur les paramètres anormaux détectés.',
          'CONSULT_HEALTHCARE_PROFESSIONAL': 'Consultez un professionnel de santé pour confirmation et suivi.',
          'NO_DISEASE_DETECTED': 'Aucune maladie détectée',
          'ALL_PARAMETERS_NORMAL': 'Tous les paramètres biologiques sont dans les plages normales.',
          'MAINTAIN_HEALTHY_LIFESTYLE': 'Continuez à maintenir un mode de vie sain.',
          'RENAL_INSUFFICIENCY_POSSIBILITY': 'Possibilité de insuffisance rénale',
          'CONFIDENCE_MODERATE': 'Modérée',
          'CONFIDENCE_HIGH': 'Élevée',
          'CONFIDENCE_LOW': 'Faible',
          'TREND_STABLE': 'Stable',
          'TREND_EN_HAUSSE': 'En hausse',
          'TREND_EN_BAISSE': 'En baisse',
          'TREND_AUGMENTATION': 'Augmentation',
          'ADVICE_CONSULT_DOCTOR_QUICKLY': 'Consultez votre médecin rapidement.',
          'ADVICE_MONITOR_PARAMETER': 'Surveillez ce paramètre et discutez-en lors de votre prochaine visite médicale.',
          'ADVICE_SLIGHTLY_BELOW_NORMAL': 'Valeur légèrement inférieure à la normale, sans danger immédiat.',
          'ADVICE_SLIGHTLY_ABOVE_NORMAL': 'Valeur légèrement supérieure à la normale, sans danger immédiat.',
          'ADVICE_SURVEILLANCE_RECOMMENDED': 'Surveillance recommandée',
          'TREND_UNDETERMINED': 'Indéterminée',
          'TREND_UNDETERMINED_NO_PREVIOUS_VALUE': 'Indéterminée (pas de valeur antérieure)',
          'ADVICE_NO_RISK_ASSESSMENT': 'Aucune évaluation de risque disponible pour ce paramètre.',
          'ADVICE_SIMPLIFIED_ANALYSIS_ERROR': 'Erreur lors de l\'analyse de risque simplifiée.',
          'ADVICE_NO_ACTION_REQUIRED': 'Aucune action particulière requise. Les valeurs sont dans la plage normale.',
          'ADVICE_MONITOR_NEXT_CONTROL': 'À surveiller lors du prochain contrôle. Le {parameterCode} est légèrement {status}.',
          'ADVICE_MONITOR_NEXT_CONTROL_BAS': 'À surveiller lors du prochain contrôle. Le {parameterCode} est légèrement bas.',
          'ADVICE_SURVEILLANCE_RECOMMENDED_PARAM': 'Surveillance recommandée. Le {parameterCode} est {status} avec un risque modéré.',
          'ADVICE_MEDICAL_CONSULTATION_RECOMMENDED': 'Consultation médicale recommandée. Le {parameterCode} présente un risque élevé.',
          'ADVICE_MEDICAL_CONSULTATION_RECOMMENDED_PARAM': 'Consultation médicale recommandée. Le {parameterCode} présente un risque élevé.',
          'POSSIBILITY_HYPERCHOLESTEROLEMIA': 'Possibilité de hypercholestérolémie',
          'POSSIBILITY_DIABETES': 'Possibilité de diabète',
          'POSSIBILITY_ANEMIA': 'Possibilité de anémie',
          'POSSIBILITY_RENAL_INSUFFICIENCY': 'Possibilité de insuffisance rénale'
        };
        return frenchTranslations[translationKey] || message;
      }
  }
}
