import { Component, OnInit } from '@angular/core';
import { MedicalReportService } from '../../services/medical-report.service';
import { AuthService } from '@auth0/auth0-angular';
import { Loader, FileText, Eye, Trash2, X, Stethoscope, Download, Search, RefreshCw, User, Calendar } from 'lucide-angular';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslationUtilsService } from '../../services/translation-utils.service';

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
    private translateService: TranslateService,
    private translationUtils: TranslationUtilsService
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
    return this.translationUtils.translatePredictionMessage(message);
  }
}
