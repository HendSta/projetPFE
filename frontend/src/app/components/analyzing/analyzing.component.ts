import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-analyzing',
  templateUrl: './analyzing.component.html',
  styleUrls: ['./analyzing.component.css']
})
export class AnalyzingComponent {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  analysisResult: any[] = [];
  tableColumns: string[] = [];
  patientInfo: any = {
    NomPatient: 'Patient inconnu',
    Medecin: 'Médecin inconnu',
    DateAnalyse: ''
  };
  riskResults: { [key: number]: any } = {};

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Handle file selection from input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.riskResults = {};
    }
  }

  // Trigger analysis for the selected file
  onAnalyzeFile(): void {
    if (!this.selectedFile) {
      console.log('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isLoading = true;

    this.http.post<any[]>('http://127.0.0.1:8000/upload-pdf', formData, {
      headers: {
        'Accept': 'application/json',
      },
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.analysisResult = response;
        
        // Extraire les informations du patient du premier résultat
        if (response.length > 0) {
          this.patientInfo = {
            NomPatient: response[0].NomPatient || 'Patient inconnu',
            Medecin: response[0].Medecin || 'Médecin inconnu',
            DateAnalyse: response[0].DateAnalyse || ''
          };
        }
        
        // Define table columns in fixed order
        this.tableColumns = [
          'CodParametre',
          'ValeurActuelle',
          'Unite',
          'ValeursUsuelles',
          'ValeurUsuelleMin',
          'ValeurUsuelleMax',
          'ValeurAnterieure',
          'DateAnterieure',
          'LIBMEDWINabrege',
          'LibParametre',
          'FAMILLE'
        ];
        console.log('Analysis result:', this.analysisResult);
        
        // Ne plus sauvegarder automatiquement les résultats
        // this.saveAnalysisResults();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error uploading file:', error);
      }
    });
  }

  analyzeRow(row: any, index: number) {
    this.http.post<any>('http://127.0.0.1:8000/analyze-risk', row).subscribe({
      next: (result) => {
        this.riskResults[index] = result;
      },
      error: (error) => {
        this.riskResults[index] = { erreur: 'Erreur lors de l\'analyse' };
        console.error(error);
      }
    });
  }

  showRiskHeaders(): boolean {
    return Object.keys(this.riskResults).length > 0;
  }

  saveReport(): void {
    if (!this.analysisResult || !this.analysisResult.length) {
      console.error('Aucun résultat à sauvegarder');
      return;
    }

    // Récupérer l'ID de l'utilisateur connecté via Auth0
    this.auth.user$.subscribe(user => {
      if (!user) {
        alert('Vous devez être connecté pour sauvegarder un rapport');
        return;
      }

      const auth0Id = user.sub;
      console.log('ID utilisateur connecté:', auth0Id);

      // Format the date - if empty or invalid, use current date
      let formattedDate;
      try {
        // Try to parse the provided date
        formattedDate = this.patientInfo.DateAnalyse ? new Date(this.patientInfo.DateAnalyse) : new Date();
        
        // Check if the date is valid, if not use current date
        if (isNaN(formattedDate.getTime())) {
          console.warn('Invalid date format, using current date instead');
          formattedDate = new Date();
        }
      } catch (e) {
        console.warn('Error parsing date, using current date instead:', e);
        formattedDate = new Date();
      }

      // Préparer les données du rapport avec les champs supplémentaires
      const reportData = {
        auth0Id: auth0Id,
        patientName: this.patientInfo.NomPatient,
        doctorName: this.patientInfo.Medecin,
        analysisDate: formattedDate.toISOString(), // Use ISO string format for consistent date handling
        results: this.analysisResult.map((result, index) => {
          // Récupérer les résultats d'analyse de risque s'ils existent
          const riskResult = this.riskResults[index] || {};
          
          return {
            parameterCode: result.CodeParametre,
            currentValue: result.ValeurActuelle,
            unit: result.Unite,
            normalRange: result.ValeursUsuelles,
            normalMin: result.ValeurUsuelleMin,
            normalMax: result.ValeurUsuelleMax,
            previousValue: result.ValeurAnterieure,
            previousDate: result.DateAnterieure,
            shortName: result.LIBMEDWINabrege,
            parameterName: result.LibParametre,
            family: result.FAMILLE,
            // Ajouter les champs supplémentaires
            riskStatus: riskResult.statut_risque || '',
            riskDegree: riskResult.degre_risque || '',
            trend: riskResult.tendance || '',
            advice: riskResult.conseil || ''
          };
        })
      };

      // Envoyer les données au backend
      this.http.post(`http://localhost:8000/api/medical-reports`, reportData)
        .subscribe({
          next: (response) => {
            console.log('Rapport sauvegardé avec succès:', response);
            // Afficher une notification de succès
            alert('Rapport sauvegardé avec succès !');
          },
          error: (error) => {
            console.error('Erreur lors de la sauvegarde du rapport:', error);
            // Afficher une notification d'erreur
            alert('Erreur lors de la sauvegarde du rapport. Veuillez réessayer.');
          }
        });
    });
  }
}
