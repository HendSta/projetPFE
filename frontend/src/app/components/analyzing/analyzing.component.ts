import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '@auth0/auth0-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-analyzing',
  templateUrl: './analyzing.component.html',
  styleUrls: ['./analyzing.component.css']
})
export class AnalyzingComponent implements OnInit {
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
  isReanalyzingReport: boolean = false;
  
  // Variables pour la prédiction de maladie
  showDiseaseModal: boolean = false;
  isPredictingDisease: boolean = false;
  diseasePrediction: any = null;
  diseasePredictionError: string = '';
  hasDiseasePrediction: boolean = false; // Nouveau flag pour indiquer si une prédiction existe
  columnHeaderTranslationKeys: { [key: string]: string } = {
    CodParametre: 'TABLE_HEADER_ANALYZING_parameterCode',
    ValeurActuelle: 'TABLE_HEADER_ANALYZING_currentValue',
    Unite: 'TABLE_HEADER_ANALYZING_unit',
    ValeursUsuelles: 'TABLE_HEADER_ANALYZING_normalRange',
    ValeurUsuelleMin: 'TABLE_HEADER_ANALYZING_normalMin',
    ValeurUsuelleMax: 'TABLE_HEADER_ANALYZING_normalMax',
    ValeurAnterieure: 'TABLE_HEADER_ANALYZING_previousValue',
    DateAnterieure: 'TABLE_HEADER_ANALYZING_previousDate',
    // Ajoute d'autres colonnes si besoin
  };

  constructor(private http: HttpClient, private auth: AuthService, private translateService: TranslateService) {}

  ngOnInit(): void {
    // Check if there's a report to reanalyze in localStorage
    const reportToReanalyze = localStorage.getItem('reportToReanalyze');
    
    if (reportToReanalyze) {
      // Parse the report data
      const report = JSON.parse(reportToReanalyze);
      this.isReanalyzingReport = true;
      
      // Set patient info
      this.patientInfo = {
        NomPatient: report.patientName || 'Patient inconnu',
        Medecin: report.doctorName || 'Médecin inconnu',
        DateAnalyse: report.analysisDate || ''
      };
      
      // Transform the report results into a format the analyzing component can use
      this.analysisResult = report.results.map((result: any) => {
        return {
          CodeParametre: result.parameterCode,
          CodParametre: result.parameterCode,
          ValeurActuelle: result.currentValue,
          Unite: result.unit,
          ValeursUsuelles: result.normalRange,
          ValeurUsuelleMin: result.normalMin,
          ValeurUsuelleMax: result.normalMax,
          ValeurAnterieure: result.previousValue,
          DateAnterieure: result.previousDate,
          LIBMEDWINabrege: result.shortName,
          LibParametre: result.parameterName,
          FAMILLE: result.family
        };
      });
      
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
      
      // Pre-populate risk results if they exist
      report.results.forEach((result: any, index: number) => {
        if (result.riskStatus && result.riskDegree) {
          this.riskResults[index] = {
            statut_risque: result.riskStatus,
            degre_risque: result.riskDegree,
            tendance: result.trend || 'Indéterminée',
            conseil: result.advice || ''
          };
        }
      });
      
      // Charger la prédiction de maladie si elle existe
      if (report.diseasePrediction) {
        this.diseasePrediction = report.diseasePrediction;
        this.hasDiseasePrediction = true;
        console.log('Loaded existing disease prediction:', report.diseasePrediction);
      }
      
      // Clear the localStorage to avoid reanalyzing the same report on refresh
      localStorage.removeItem('reportToReanalyze');
    }
  }

  // Handle file selection from input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.riskResults = {};
      this.isReanalyzingReport = false;
      // Réinitialiser la prédiction de maladie pour un nouveau fichier
      this.diseasePrediction = null;
      this.hasDiseasePrediction = false;
      this.diseasePredictionError = '';
    }
  }

  // Trigger analysis for the selected file
  onAnalyzeFile(): void {
    // If we're reanalyzing a report, we already have the data loaded in ngOnInit,
    // so we can skip the file upload part
    if (this.isReanalyzingReport) {
      console.log('Reanalyzing report, data already loaded');
      
      // Analyze each row for risk assessment if not already analyzed
      this.analysisResult.forEach((row, index) => {
        if (!this.riskResults[index]) {
          this.analyzeRow(row, index);
        }
      });
      
      return;
    }

    // Normal file analysis flow
    if (!this.selectedFile) {
      console.log('No file selected');
      return;
    }

    // Réinitialiser la prédiction de maladie pour un nouveau fichier
    this.diseasePrediction = null;
    this.hasDiseasePrediction = false;
    this.diseasePredictionError = '';

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
        
        // Ensure all rows have CodParametre if CodeParametre is present
        this.analysisResult.forEach(row => {
          if (!row.CodParametre && row.CodeParametre) {
            row.CodParametre = row.CodeParametre;
          }
        });
        
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
    // Pour un rapport réanalysé, si nous avons déjà les données d'analyse, utilisons-les
    if (this.isReanalyzingReport) {
      // Check if we already loaded risk results for this parameter in ngOnInit
      if (this.riskResults[index]) {
        console.log('Using pre-loaded risk results for parameter:', row.CodParametre || row.CodeParametre);
        return;
      }
      
      // If we don't have pre-loaded results, attempt to get them from localStorage
      const reportToReanalyze = localStorage.getItem('reportToReanalyze');
      
      if (reportToReanalyze) {
        const report = JSON.parse(reportToReanalyze);
        const paramCode = row.CodParametre || row.CodeParametre;
        const matchingResult = report.results.find((r: any) => 
          r.parameterCode === paramCode && 
          r.riskStatus && 
          r.riskDegree
        );
        
        if (matchingResult) {
          // Utiliser les données existantes
          this.riskResults[index] = {
            statut_risque: matchingResult.riskStatus,
            degre_risque: matchingResult.riskDegree,
            tendance: matchingResult.trend || "Indéterminée",
            conseil: matchingResult.advice || ""
          };
          return;
        }
      }
    }

    // Ensure we have the proper parameter code regardless of field name
    const analyzeData = {...row};
    if (!analyzeData.CodeParametre && analyzeData.CodParametre) {
      analyzeData.CodeParametre = analyzeData.CodParametre;
    }

    // Try API call
    this.http.post<any>('http://127.0.0.1:8000/analyze-risk', analyzeData).subscribe({
      next: (result) => {
        this.riskResults[index] = result;
      },
      error: (error) => {
        console.error('Error with API call, using simplified risk assessment:', error);
        
        // Fallback: perform a simplified risk assessment
        this.performSimplifiedRiskAssessment(row, index);
      }
    });
  }

  // Performs a simplified risk assessment when the API call fails
  performSimplifiedRiskAssessment(row: any, index: number) {
    try {
      // Get the current value and normal range
      const currentValue = parseFloat(row.ValeurActuelle);
      const minValue = parseFloat(row.ValeurUsuelleMin);
      const maxValue = parseFloat(row.ValeurUsuelleMax);
      
      // Check if parsing was successful
      if (isNaN(currentValue) || (isNaN(minValue) && isNaN(maxValue))) {
        this.riskResults[index] = { 
          statut_risque: 'NORMAL', 
          degre_risque: 'Aucun',
          tendance: 'Indéterminée',
          conseil: 'Aucune évaluation de risque disponible pour ce paramètre.' 
        };
        return;
      }
      
      // Perform simplified risk assessment
      let riskStatus = 'NORMAL';
      let riskDegree = 'Aucun';
      let trend = 'Stable';
      let advice = 'Surveillance recommandée';
      
      // Check if value is out of range
      if (!isNaN(minValue) && currentValue < minValue) {
        riskStatus = 'BAS';
        
        // Determine risk degree
        const percentBelowMin = ((minValue - currentValue) / minValue) * 100;
        if (percentBelowMin > 30) {
          riskDegree = 'Élevé';
          advice = 'Consultez votre médecin rapidement.';
        } else if (percentBelowMin > 15) {
          riskDegree = 'Modéré';
          advice = 'Surveillez ce paramètre et discutez-en lors de votre prochaine visite médicale.';
        } else {
          riskDegree = 'Faible';
          advice = 'Valeur légèrement inférieure à la normale, sans danger immédiat.';
        }
      } else if (!isNaN(maxValue) && currentValue > maxValue) {
        riskStatus = 'ÉLEVÉ';
        
        // Determine risk degree
        const percentAboveMax = ((currentValue - maxValue) / maxValue) * 100;
        if (percentAboveMax > 30) {
          riskDegree = 'Élevé';
          advice = 'Consultez votre médecin rapidement.';
        } else if (percentAboveMax > 15) {
          riskDegree = 'Modéré';
          advice = 'Surveillez ce paramètre et discutez-en lors de votre prochaine visite médicale.';
        } else {
          riskDegree = 'Faible';
          advice = 'Valeur légèrement supérieure à la normale, sans danger immédiat.';
        }
      }
      
      // Check previous value for trend if available
      const previousValue = parseFloat(row.ValeurAnterieure);
      if (!isNaN(previousValue)) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100;
        
        if (percentChange > 10) {
          trend = 'En hausse';
        } else if (percentChange < -10) {
          trend = 'En baisse';
        }
      }
      
      this.riskResults[index] = {
        statut_risque: riskStatus,
        degre_risque: riskDegree,
        tendance: trend,
        conseil: advice
      };
    } catch (e) {
      console.error('Error in simplified risk assessment:', e);
      this.riskResults[index] = { 
        statut_risque: 'NORMAL', 
        degre_risque: 'Aucun',
        tendance: 'Indéterminée',
        conseil: 'Erreur lors de l\'analyse de risque simplifiée.' 
      };
    }
  }

  showRiskHeaders(): boolean {
    return Object.keys(this.riskResults).length > 0;
  }

  saveReport(): void {
    // Check if we have results to save
    if (!this.analysisResult || this.analysisResult.length === 0) {
      alert('Aucun résultat à sauvegarder.');
      return;
    }

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
        // If this is a reanalyzed report, add a flag to indicate it's a reanalysis
        isReanalysis: this.isReanalyzingReport,
        results: this.analysisResult.map((result, index) => {
          // Récupérer les résultats d'analyse de risque s'ils existent
          const riskResult = this.riskResults[index] || {};
          
          // Ensure we use the correct parameter code
          const parameterCode = result.CodParametre || result.CodeParametre;
          
          return {
            parameterCode: parameterCode,
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
        }),
        // Inclure la prédiction de maladie si elle existe
        diseasePrediction: this.hasDiseasePrediction && this.diseasePrediction ? {
          prediction: this.diseasePrediction.disease_prediction || this.diseasePrediction.prediction || '',
          confidence: this.diseasePrediction.confidence || '',
          explanation: this.diseasePrediction.explanation || '',
          recommendations: this.diseasePrediction.recommendations || ''
        } : undefined
      };

      // Vérifier si nous mettons à jour un rapport existant ou si nous en créons un nouveau
      const originalReportId = localStorage.getItem('originalReportId');
      
      if (this.isReanalyzingReport && originalReportId) {
        // Mettre à jour le rapport existant
        console.log('Mise à jour du rapport existant:', originalReportId);
        
        this.http.put(`http://localhost:8000/api/medical-reports/${originalReportId}`, reportData)
          .subscribe({
            next: (response) => {
              console.log('Rapport mis à jour avec succès:', response);
              // Afficher une notification de succès
              alert('Rapport mis à jour avec succès !');
              // Clear localStorage
              localStorage.removeItem('reportToReanalyze');
              localStorage.removeItem('originalReportId');
            },
            error: (error) => {
              console.error('Erreur lors de la mise à jour du rapport:', error);
              // Si erreur dans la mise à jour, essayer de créer un nouveau rapport
              this.createNewReport(reportData);
            }
          });
      } else {
        // Créer un nouveau rapport
        this.createNewReport(reportData);
      }
    });
  }

  // Helper method to create a new report
  private createNewReport(reportData: any): void {
    this.http.post(`http://localhost:8000/api/medical-reports`, reportData)
      .subscribe({
        next: (response) => {
          console.log('Rapport sauvegardé avec succès:', response);
          // Afficher une notification de succès
          alert('Rapport sauvegardé avec succès !');
          // Clear localStorage
          localStorage.removeItem('reportToReanalyze');
          localStorage.removeItem('originalReportId');
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde du rapport:', error);
          // Afficher une notification d'erreur
          alert('Erreur lors de la sauvegarde du rapport. Veuillez réessayer.');
        }
      });
  }

  // Méthode appelée lorsqu'un champ est modifié
  onValueChange(row: any, index: number, field: string) {
    console.log(`Field ${field} changed for parameter ${row.CodParametre || row.CodeParametre}`);
    
    // Si le champ modifié est ValeurActuelle ou ValeursUsuelles, réinitialiser l'analyse de risque
    if (field === 'ValeurActuelle' || field === 'ValeursUsuelles') {
      // Supprimer les résultats d'analyse de risque pour cette ligne
      if (this.riskResults[index]) {
        delete this.riskResults[index];
        console.log('Risk analysis reset due to value change');
      }
    }
    
    // Si c'est ValeursUsuelles, mettre à jour les valeurs min/max
    if (field === 'ValeursUsuelles') {
      try {
        // Vérifier si la valeur contient un tiret (format plage)
        const rangeValue = row.ValeursUsuelles;
        if (rangeValue && rangeValue.includes('-')) {
          const [min, max] = rangeValue.split('-').map((v: string) => v.trim());
          row.ValeurUsuelleMin = parseFloat(min);
          row.ValeurUsuelleMax = parseFloat(max);
          console.log(`Updated range values: min=${row.ValeurUsuelleMin}, max=${row.ValeurUsuelleMax}`);
        }
      } catch (error) {
        console.error('Error parsing range values:', error);
      }
    }
  }

  // Méthodes pour la prédiction de maladie
  predictDisease(): void {
    // Vérifier qu'on a des résultats d'analyse
    if (!this.analysisResult || this.analysisResult.length === 0) {
      alert('Aucun résultat d\'analyse disponible pour la prédiction de maladie.');
      return;
    }

    // Vérifier qu'on a des résultats de risque
    if (Object.keys(this.riskResults).length === 0) {
      alert('Veuillez d\'abord analyser les risques des paramètres avant de prédire les maladies.');
      return;
    }

    this.showDiseaseModal = true;
    this.isPredictingDisease = true;
    this.diseasePrediction = null;
    this.diseasePredictionError = '';

    // Préparer les données pour l'API
    const requestData = {
      analysis_result: this.analysisResult,
      risk_results: Object.values(this.riskResults)
    };

    // Appeler l'API de prédiction de maladie
    this.http.post<any>('http://127.0.0.1:8000/predict-disease', requestData).subscribe({
      next: (response) => {
        this.isPredictingDisease = false;
        this.diseasePrediction = response;
        this.hasDiseasePrediction = true; // Marquer qu'une prédiction existe
        console.log('Disease prediction result:', response);
      },
      error: (error) => {
        this.isPredictingDisease = false;
        this.diseasePredictionError = 'Erreur lors de la prédiction de maladie. Veuillez réessayer.';
        console.error('Error predicting disease:', error);
      }
    });
  }

  closeDiseaseModal(): void {
    this.showDiseaseModal = false;
    this.diseasePredictionError = '';
    // Ne pas réinitialiser diseasePrediction pour qu'il soit sauvegardé avec le rapport
  }

  // Méthode pour effacer la prédiction de maladie
  clearDiseasePrediction(): void {
    this.diseasePrediction = null;
    this.hasDiseasePrediction = false;
    this.diseasePredictionError = '';
    console.log('Disease prediction cleared');
  }

  // Méthode pour ouvrir la modal de prédiction existante
  openExistingPrediction(): void {
    if (this.hasDiseasePrediction && this.diseasePrediction) {
      this.showDiseaseModal = true;
      this.isPredictingDisease = false;
      this.diseasePredictionError = '';
      console.log('Opening existing disease prediction modal');
    }
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
