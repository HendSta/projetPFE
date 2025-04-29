import { Component, OnInit } from '@angular/core';
import { MedicalReportService } from '../../services/medical-report.service';
import { AuthService } from '@auth0/auth0-angular';
import { Loader, FileText, Eye, Trash2, X, Stethoscope } from 'lucide-angular';

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
  }>;
}

@Component({
  selector: 'app-historics',
  templateUrl: './historics.component.html',
  styleUrls: ['./historics.component.css']
})
export class HistoricsComponent implements OnInit {
  reports: MedicalReport[] = [];
  isLoading = false;
  errorMessage = '';
  selectedReport: MedicalReport | null = null;
  showReportDetails = false;

  constructor(
    private medicalReportService: MedicalReportService,
    private auth: AuthService
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
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load reports. Please try again later.';
        this.isLoading = false;
        console.error('Error loading reports:', error);
      }
    });
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
