import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationUtilsService {

  constructor(private translateService: TranslateService) {}

  /**
   * Traduit un message de prédiction dynamique
   * @param message Le message à traduire
   * @returns Le message traduit
   */
  translatePredictionMessage(message: string): string {
    if (!message) return '';

    const currentLang = this.translateService.currentLang || 'fr';

    // Patterns pour les messages dynamiques avec codes de paramètres
    const hemPattern = /^Le ([A-Z0-9]+) présente un risque élevé\.$/;
    const hemBasPattern = /^Le ([A-Z0-9]+) est légèrement bas\.$/;
    const surveillanceRecommendedPattern = /^Surveillance recommandée\. Le ([A-Z0-9]+) est légèrement bas\.$/;
    const surveillanceRecommendedElevePattern = /^Surveillance recommandée\. Le ([A-Z0-9]+) est élevé avec un risque modéré\.$/;
    const aSurveillerPattern = /^À surveiller lors du prochain contrôle\. Le ([A-Z0-9]+) est légèrement bas\.$/;
    const consultationMedicalePattern = /^Consultation médicale recommandée\. Le ([A-Z0-9]+) présente un risque élevé\.$/;

    // Vérifier le pattern "Le HEM1 présente un risque élevé."
    const hemMatch = message.match(hemPattern);
    if (hemMatch) {
      const parameterCode = hemMatch[1];
      if (currentLang === 'en') {
        return `The ${parameterCode} presents a high risk.`;
      } else {
        return message; // Garder en français
      }
    }

    // Vérifier le pattern "Le HEM1 est légèrement bas."
    const hemBasMatch = message.match(hemBasPattern);
    if (hemBasMatch) {
      const parameterCode = hemBasMatch[1];
      if (currentLang === 'en') {
        return `The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }

    // Vérifier le pattern "Surveillance recommandée. Le HEM1 est légèrement bas."
    const surveillanceMatch = message.match(surveillanceRecommendedPattern);
    if (surveillanceMatch) {
      const parameterCode = surveillanceMatch[1];
      if (currentLang === 'en') {
        return `Surveillance recommended. The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }

    // Vérifier le pattern "Surveillance recommandée. Le IONO3 est élevé avec un risque modéré."
    const surveillanceEleveMatch = message.match(surveillanceRecommendedElevePattern);
    if (surveillanceEleveMatch) {
      const parameterCode = surveillanceEleveMatch[1];
      if (currentLang === 'en') {
        return `Surveillance recommended. The ${parameterCode} is elevated with moderate risk.`;
      } else {
        return message; // Garder en français
      }
    }

    // Vérifier le pattern "À surveiller lors du prochain contrôle. Le NFS2 est légèrement bas."
    const aSurveillerMatch = message.match(aSurveillerPattern);
    if (aSurveillerMatch) {
      const parameterCode = aSurveillerMatch[1];
      if (currentLang === 'en') {
        return `To monitor during the next check. The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }

    // Vérifier le pattern "Consultation médicale recommandée. Le LDL présente un risque élevé."
    const consultationMatch = message.match(consultationMedicalePattern);
    if (consultationMatch) {
      const parameterCode = consultationMatch[1];
      if (currentLang === 'en') {
        return `Medical consultation recommended. The ${parameterCode} presents a high risk.`;
      } else {
        return message; // Garder en français
      }
    }

    // Mapper les messages français vers les clés de traduction
    const messageKeyMap: { [key: string]: string } = {
      'Indéterminée': 'UNDETERMINED',
      'Indéterminée (pas de valeur antérieure)': 'TREND_UNDETERMINED_NO_PREVIOUS_VALUE',
      'Erreur lors de l\'analyse de risque simplifiée.': 'ERROR_SIMPLIFIED_RISK_ANALYSIS',
      'Aucune action particulière requise. Les valeurs sont dans la plage normale.': 'ADVICE_NO_ACTION_REQUIRED',
      'Aucune évaluation de risque disponible pour ce paramètre.': 'ADVICE_NO_RISK_ASSESSMENT',
      'Consultez votre médecin rapidement.': 'ADVICE_CONSULT_DOCTOR_QUICKLY',
      'Surveillez ce paramètre et discutez-en lors de votre prochaine visite médicale.': 'ADVICE_MONITOR_PARAMETER',
      'Valeur légèrement inférieure à la normale, sans danger immédiat.': 'ADVICE_SLIGHTLY_BELOW_NORMAL',
      'Valeur légèrement supérieure à la normale, sans danger immédiat.': 'ADVICE_SLIGHTLY_ABOVE_NORMAL',
      'Surveillance recommandée': 'ADVICE_SURVEILLANCE_RECOMMENDED',
      'Stable': 'TREND_STABLE',
      'En hausse': 'TREND_EN_HAUSSE',
      'En baisse': 'TREND_EN_BAISSE',
      'Augmentation': 'TREND_AUGMENTATION',
      'Modérée': 'CONFIDENCE_MODERATE',
      'Élevée': 'CONFIDENCE_HIGH',
      'Faible': 'CONFIDENCE_LOW',
      'Aucune maladie détectée': 'NO_DISEASE_DETECTED',
      'Tous les paramètres biologiques sont dans les plages normales.': 'ALL_PARAMETERS_NORMAL',
      'Continuez à maintenir un mode de vie sain.': 'MAINTAIN_HEALTHY_LIFESTYLE',
      'Anomalies biologiques détectées nécessitant une évaluation médicale': 'BIOLOGICAL_ANOMALIES_DETECTED',
      'Analyse basée sur les paramètres anormaux détectés.': 'ANALYSIS_BASED_ON_ABNORMAL_PARAMETERS',
      'Consultez un professionnel de santé pour confirmation et suivi.': 'CONSULT_HEALTHCARE_PROFESSIONAL',
      'Possibilité de insuffisance rénale': 'RENAL_INSUFFICIENCY_POSSIBILITY',
      'Possibilité de hypercholestérolémie': 'POSSIBILITY_HYPERCHOLESTEROLEMIA',
      'Possibilité de diabète': 'POSSIBILITY_DIABETES',
      'Possibilité de anémie': 'POSSIBILITY_ANEMIA'
    };

    // Vérifier si le message est dans la map
    if (messageKeyMap[message]) {
      return this.translateService.instant(messageKeyMap[message]);
    }

    // Si aucune correspondance n'est trouvée, retourner le message original
    return message;
  }

  /**
   * Traduit un statut de risque
   * @param status Le statut à traduire
   * @returns Le statut traduit
   */
  translateRiskStatus(status: string): string {
    if (!status) return '-';

    const currentLang = this.translateService.currentLang || 'fr';

    if (currentLang === 'en') {
      switch(status) {
        case 'NORMAL': return 'NORMAL';
        case 'BAS': return 'LOW';
        case 'ÉLEVÉ': return 'HIGH';
        default: return status;
      }
    } else {
      // Français (par défaut)
      switch(status) {
        case 'NORMAL': return 'NORMAL';
        case 'BAS': return 'BAS';
        case 'ÉLEVÉ': return 'ÉLEVÉ';
        default: return status;
      }
    }
  }
}