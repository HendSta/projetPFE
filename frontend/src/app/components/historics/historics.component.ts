import { Component, OnInit } from '@angular/core';
import { MedicalReportService } from '../../services/medical-report.service';
import { AuthService } from '@auth0/auth0-angular';
import { Loader, FileText, Eye, Trash2, X, Stethoscope, Download, Search, RefreshCw, User, Calendar } from 'lucide-angular';
import { Router } from '@angular/router';

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

  constructor(
    private medicalReportService: MedicalReportService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.medicalReportService.getUserReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.filteredReports = [...reports];
        this.isLoading = false;
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
  }

  resetFilters() {
    this.searchQuery = '';
    this.filteredReports = [...this.reports];
  }

  viewReportDetails(report: MedicalReport) {
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
    this.medicalReportService.downloadReport(id).subscribe({
      next: (blob) => {
        this.isLoading = false;
        // Créer une URL pour le blob
        const url = window.URL.createObjectURL(blob);
        
        // Créer un élément de lien
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-medical-${id}.pdf`;
        
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
}
