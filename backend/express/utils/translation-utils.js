/**
 * Utilitaires de traduction pour le backend
 */

/**
 * Traduit un message de prédiction dynamique
 * @param {string} message - Le message à traduire
 * @param {string} language - La langue cible ('en' ou 'fr')
 * @returns {string} Le message traduit
 */
const translatePredictionMessage = (message, language) => {
    if (!message) return '';
  
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
      if (language === 'en') {
        return `The ${parameterCode} presents a high risk.`;
      } else {
        return message; // Garder en français
      }
    }
  
    // Vérifier le pattern "Le HEM1 est légèrement bas."
    const hemBasMatch = message.match(hemBasPattern);
    if (hemBasMatch) {
      const parameterCode = hemBasMatch[1];
      if (language === 'en') {
        return `The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }
  
    // Vérifier le pattern "Surveillance recommandée. Le HEM1 est légèrement bas."
    const surveillanceMatch = message.match(surveillanceRecommendedPattern);
    if (surveillanceMatch) {
      const parameterCode = surveillanceMatch[1];
      if (language === 'en') {
        return `Surveillance recommended. The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }
  
    // Vérifier le pattern "Surveillance recommandée. Le IONO3 est élevé avec un risque modéré."
    const surveillanceRecommendedEleveMatch = message.match(surveillanceRecommendedElevePattern);
    if (surveillanceRecommendedEleveMatch) {
      const parameterCode = surveillanceRecommendedEleveMatch[1];
      if (language === 'en') {
        return `Surveillance recommended. The ${parameterCode} is elevated with moderate risk.`;
      } else {
        return message; // Garder en français
      }
    }
  
    // Vérifier le pattern "À surveiller lors du prochain contrôle. Le NFS2 est légèrement bas."
    const aSurveillerMatch = message.match(aSurveillerPattern);
    if (aSurveillerMatch) {
      const parameterCode = aSurveillerMatch[1];
      if (language === 'en') {
        return `To monitor during the next check. The ${parameterCode} is slightly low.`;
      } else {
        return message; // Garder en français
      }
    }

    // Vérifier le pattern "Consultation médicale recommandée. Le LDL présente un risque élevé."
    const consultationMatch = message.match(consultationMedicalePattern);
    if (consultationMatch) {
      const parameterCode = consultationMatch[1];
      if (language === 'en') {
        return `Medical consultation recommended. The ${parameterCode} presents a high risk.`;
      } else {
        return message; // Garder en français
      }
    }
  
    // Mapper les messages français vers les clés de traduction
    const messageKeyMap = {
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
  
    // Traductions statiques
    const translations = {
      en: {
        'UNDETERMINED': 'Undetermined',
        'TREND_UNDETERMINED_NO_PREVIOUS_VALUE': 'Undetermined (no previous value)',
        'ERROR_SIMPLIFIED_RISK_ANALYSIS': 'Error during simplified risk analysis.',
        'ADVICE_NO_ACTION_REQUIRED': 'No particular action required. Values are within normal range.',
        'ADVICE_NO_RISK_ASSESSMENT': 'No risk assessment available for this parameter.',
        'ADVICE_CONSULT_DOCTOR_QUICKLY': 'Consult your doctor quickly.',
        'ADVICE_MONITOR_PARAMETER': 'Monitor this parameter and discuss it during your next medical visit.',
        'ADVICE_SLIGHTLY_BELOW_NORMAL': 'Value slightly below normal, no immediate danger.',
        'ADVICE_SLIGHTLY_ABOVE_NORMAL': 'Value slightly above normal, no immediate danger.',
        'ADVICE_SURVEILLANCE_RECOMMENDED': 'Surveillance recommended',
        'TREND_STABLE': 'Stable',
        'TREND_EN_HAUSSE': 'Increasing',
        'TREND_EN_BAISSE': 'Decreasing',
        'TREND_AUGMENTATION': 'Increasing',
        'CONFIDENCE_MODERATE': 'Moderate',
        'CONFIDENCE_HIGH': 'High',
        'CONFIDENCE_LOW': 'Low',
        'NO_DISEASE_DETECTED': 'No disease detected',
        'ALL_PARAMETERS_NORMAL': 'All biological parameters are within normal ranges.',
        'MAINTAIN_HEALTHY_LIFESTYLE': 'Continue to maintain a healthy lifestyle.',
        'BIOLOGICAL_ANOMALIES_DETECTED': 'Biological anomalies detected requiring medical evaluation',
        'ANALYSIS_BASED_ON_ABNORMAL_PARAMETERS': 'Analysis based on detected abnormal parameters.',
        'CONSULT_HEALTHCARE_PROFESSIONAL': 'Consult a healthcare professional for confirmation and follow-up.',
        'RENAL_INSUFFICIENCY_POSSIBILITY': 'Possibility of renal insufficiency',
        'POSSIBILITY_HYPERCHOLESTEROLEMIA': 'Possibility of hypercholesterolemia',
        'POSSIBILITY_DIABETES': 'Possibility of diabetes',
        'POSSIBILITY_ANEMIA': 'Possibility of anemia'
      },
      fr: {
        'UNDETERMINED': 'Indéterminée',
        'TREND_UNDETERMINED_NO_PREVIOUS_VALUE': 'Indéterminée (pas de valeur antérieure)',
        'ERROR_SIMPLIFIED_RISK_ANALYSIS': 'Erreur lors de l\'analyse de risque simplifiée.',
        'ADVICE_NO_ACTION_REQUIRED': 'Aucune action particulière requise. Les valeurs sont dans la plage normale.',
        'ADVICE_NO_RISK_ASSESSMENT': 'Aucune évaluation de risque disponible pour ce paramètre.',
        'ADVICE_CONSULT_DOCTOR_QUICKLY': 'Consultez votre médecin rapidement.',
        'ADVICE_MONITOR_PARAMETER': 'Surveillez ce paramètre et discutez-en lors de votre prochaine visite médicale.',
        'ADVICE_SLIGHTLY_BELOW_NORMAL': 'Valeur légèrement inférieure à la normale, sans danger immédiat.',
        'ADVICE_SLIGHTLY_ABOVE_NORMAL': 'Valeur légèrement supérieure à la normale, sans danger immédiat.',
        'ADVICE_SURVEILLANCE_RECOMMENDED': 'Surveillance recommandée',
        'TREND_STABLE': 'Stable',
        'TREND_EN_HAUSSE': 'En hausse',
        'TREND_EN_BAISSE': 'En baisse',
        'TREND_AUGMENTATION': 'Augmentation',
        'CONFIDENCE_MODERATE': 'Modérée',
        'CONFIDENCE_HIGH': 'Élevée',
        'CONFIDENCE_LOW': 'Faible',
        'NO_DISEASE_DETECTED': 'Aucune maladie détectée',
        'ALL_PARAMETERS_NORMAL': 'Tous les paramètres biologiques sont dans les plages normales.',
        'MAINTAIN_HEALTHY_LIFESTYLE': 'Continuez à maintenir un mode de vie sain.',
        'BIOLOGICAL_ANOMALIES_DETECTED': 'Anomalies biologiques détectées nécessitant une évaluation médicale',
        'ANALYSIS_BASED_ON_ABNORMAL_PARAMETERS': 'Analyse basée sur les paramètres anormaux détectés.',
        'CONSULT_HEALTHCARE_PROFESSIONAL': 'Consultez un professionnel de santé pour confirmation et suivi.',
        'RENAL_INSUFFICIENCY_POSSIBILITY': 'Possibilité de insuffisance rénale',
        'POSSIBILITY_HYPERCHOLESTEROLEMIA': 'Possibilité de hypercholestérolémie',
        'POSSIBILITY_DIABETES': 'Possibilité de diabète',
        'POSSIBILITY_ANEMIA': 'Possibilité de anémie'
      }
    };
  
    // Vérifier si le message est dans la map
    if (messageKeyMap[message]) {
      const key = messageKeyMap[message];
      return translations[language]?.[key] || message;
    }
  
    // Si aucune correspondance n'est trouvée, retourner le message original
    return message;
  };
  
  /**
   * Traduit un statut de risque
   * @param {string} status - Le statut à traduire
   * @param {string} language - La langue cible ('en' ou 'fr')
   * @returns {string} Le statut traduit
   */
  const translateRiskStatus = (status, language) => {
    if (!status) return '-';
  
    if (language === 'en') {
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
  };
  
  module.exports = {
    translatePredictionMessage,
    translateRiskStatus
  };