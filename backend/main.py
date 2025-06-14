from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
import joblib
import pandas as pd
import pdfplumber
import re
import numpy as np
import io
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import os
import json
from rapidfuzz import process
from sklearn.impute import SimpleImputer
import random
import math
import xml.etree.ElementTree as ET
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # URL de votre frontend Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger le modèle ML
pipeline = joblib.load("MLmodels/pipeline.joblib")

# Créer un imputer pour gérer les valeurs NaN
imputer = SimpleImputer(strategy='constant', fill_value=0)

# ==== Pydantic Models ====
class InputData(BaseModel):
    CodeParametre: str
    ValeurActuelle: float
    Unite: str
    ValeursUsuelles: str
    ValeurUsuelleMin: float
    ValeurUsuelleMax: float
    ValeurAnterieure: Optional[float] = None
    DateAnterieure: str = ''

class PredictionResult(BaseModel):
    # Champs d'entrée
    CodeParametre: str
    ValeurActuelle: float
    Unite: str
    ValeursUsuelles: str
    ValeurUsuelleMin: float
    ValeurUsuelleMax: float
    ValeurAnterieure: Optional[float] = None
    DateAnterieure: str = ''
    # Champs prédits
    CodParametre: str
    LIBMEDWINabrege: str
    LibParametre: str
    FAMILLE: str
    # Informations du patient
    NomPatient: str = "Patient inconnu"
    Medecin: str = "Médecin inconnu"
    DateAnalyse: str = ""

# ==== Constants ====
TYPE_ANALYSES = {
    "hématologie": ["hematologie", "hématologie", "CYTO-HEMATOLOGIE", "HEMATOLOGIE"],
    "biochimie": ["biochimie", "BIO-CHIMIE", "BIOCHIMIE"],
    "enzymologie": ["enzymologie", "ENZYMOLOGIE"],
    "hormonologie": ["hormonologie", "HORMONOLOGIE"],
    "marqueurs biochimiques": ["marqueurs biochimiques"],
    "biochimie des urines": ["biochimie des urines", "CHIMIE URINE"],
    "immunologie": ["immunologie"],
    "microbiologie": ["MICROBIOLOGIE"],
    "coagulation": ["COAGULATION"],
    "hémostase-coagulation": ["hemostase-coagulation"],
    "hémostase": ["hemostase"],
    "bactériologie": ["bacteriologie"],
    "antibiogramme": ["antibiogramme"],
    "biochimie clinique": ["biochimie clinique", "biochimie clinique (sang)"],
    "vitamines": ["vitamines"],
    "marqueurs tumoraux": ["marqueurs tumoraux"],
    "marqueurs cardiaques": ["marqueurs cardiaques"],
    "immuno-hématologie": ["immuno-hematologie"],
    "hormones": ["hormones"],
    "dosage des vitamines": ["dosage des vitamines"]
}

# Regex patterns - Amélioré pour capturer les nombres avec beaucoup de séparateurs
REGEX_DATE = r"\b(\d{2}/\d{2}/\d{4})\b"
REGEX_PATIENT = r"(?i)nom\s*:\s*(.*)"
REGEX_MEDECIN = r"(?i)demandé par\s*:\s*(.*)"
REGEX_PARAMETRE = r"([\w\s]+?)[\s\.]+(\d+(?:[ \.,]\d+)*)\s*([a-zA-Z/%³]*)\s*(\d+(?:[ \.,]\d+)*)?\s*(\d{2}/\d{2}/\d{2,4})?\s*\(([^)]*)\)?"

# Unit mapping
UNIT_MAPPING = {
    'millions/mm³': '10^6/mm³',
    'millions/mm3': '10^6/mm³',
    'µ3': 'fl',
    'µl': 'fl',
    'ui/l': 'UI/L',
    'g/dl': 'g/dL',
    'mmol/l': 'mmol/L',
    'pmol/l': 'pmol/L'
}

# ==== Helper Functions ====
def normaliser_type_analyse(texte):
    """Associe un type d'analyse à partir du dictionnaire."""
    texte = texte.lower()
    for type_normalise, variantes in TYPE_ANALYSES.items():
        if texte in [var.lower() for var in variantes]:
            return type_normalise
    return texte

def normalize_numeric_values(val):
    """Normalise les valeurs numériques."""
    if not isinstance(val, str):
        return val
    
    # Supprimer les espaces à l'intérieur des nombres (ex: 4 290 -> 4290)
    val = re.sub(r'(?<=\d)\s+(?=\d)', '', val)
    
    # Remplacer les virgules par des points pour la conversion
    val = val.replace(',', '.')
    
    if val.isdigit() and val.startswith('0') and len(val) > 1:
        return int(val)
    try:
        return float(val)
    except ValueError:
        return val

def extract_min_max(valeur_usuelles):
    """Extrait les bornes min/max des valeurs usuelles."""
    if not isinstance(valeur_usuelles, str):
        return None, None
    valeur_usuelles = valeur_usuelles.strip()

    # Nettoyer les espaces à l'intérieur des nombres dans la chaîne 
    # avant de faire l'extraction
    valeur_usuelles = re.sub(r'(?<=\d)\s+(?=\d)', '', valeur_usuelles)

    range_pattern = r'(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)'
    lt_pattern = r'<\s*(\d+(?:[.,]\d+)?)'
    gt_pattern = r'>\s*(\d+(?:[.,]\d+)?)'

    range_match = re.search(range_pattern, valeur_usuelles)
    if range_match:
        min_val = range_match.group(1).replace(',', '.')
        max_val = range_match.group(2).replace(',', '.')
        return float(min_val), float(max_val)

    lt_match = re.search(lt_pattern, valeur_usuelles)
    if lt_match:
        return None, float(lt_match.group(1).replace(',', '.'))

    gt_match = re.search(gt_pattern, valeur_usuelles)
    if gt_match:
        return float(gt_match.group(1).replace(',', '.')), None

    return None, None

def nettoyer_code_parametre(code_param):
    """Nettoie le code paramètre."""
    if pd.isna(code_param):
        return code_param
    code_param = str(code_param)
    code_param = re.sub(r'\s+\d+[.,]?\d*\s*\S*$', '', code_param)
    return code_param.strip().lower()

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extrait le texte d'un PDF à partir de son contenu en bytes."""
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
    return extracted_text

def nettoyer_text(contenu: str) -> str:
    """Nettoyage avancé du texte."""
    contenu = re.sub(r'(\b[A-ZÀ-ÖØ-öø-ÿ])(?:\.+[A-ZÀ-ÖØ-öø-ÿ])+\b', lambda m: m.group(0).replace('.', ''), contenu)
    contenu = re.sub(r'\.(?!\d)', '', contenu)
    return contenu

def nettoyer_nom_patient(nom):
    """Supprime les caractères non nécessaires comme les astérisques du nom du patient."""
    if not nom or not isinstance(nom, str):
        return "Patient inconnu"
    # Supprimer les astérisques
    nom = re.sub(r'[*]+', '', nom)
    # Supprimer les espaces multiples et les espaces au début/fin
    nom = re.sub(r'\s+', ' ', nom).strip()
    return nom if nom else "Patient inconnu"

def extract_patient_info(text: str) -> Dict[str, str]:
    """Extrait les informations du patient."""
    patient_info = {
        "NomPatient": "Patient inconnu",
        "Medecin": "Médecin inconnu",
        "DateAnalyse": ""
    }
    
    date_match = re.search(REGEX_DATE, text)
    if date_match:
        patient_info["DateAnalyse"] = date_match.group(1)
    
    patient_match = re.search(REGEX_PATIENT, text)
    if patient_match:
        patient_info["NomPatient"] = nettoyer_nom_patient(patient_match.group(1).strip())
    
    medecin_match = re.search(REGEX_MEDECIN, text)
    if medecin_match:
        patient_info["Medecin"] = medecin_match.group(1).strip()
    
    return patient_info

def extract_all_fields_from_text(text: str) -> list:
    """Extrait tous les paramètres et valeurs du texte nettoyé, y compris valeur antérieure et date antérieure si présentes sur la même ligne."""
    results = []
    lines = text.splitlines()
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Nettoyer les motifs "X % Soit :"
        # On conserve uniquement le nom du paramètre au début et ce qui suit "Soit :" s'il est présent
        soit_match = re.search(r'^([\w\s\.]+)\s+(\d+)\s*%\s*Soit\s*:\s*(.+)$', line, re.IGNORECASE)
        if soit_match:
            param_name = soit_match.group(1).strip()
            values_part = soit_match.group(3).strip()
            line = f"{param_name} {values_part}"
            
        param_match = re.search(REGEX_PARAMETRE, line)
        valeur_anterieure = None
        date_anterieure = ''
        if param_match:
            parametre = param_match.group(1).replace('.', '').strip().lower()
            valeur_actuelle = param_match.group(2).strip()
            unite = param_match.group(3).strip()
            valeur_usuelles = param_match.group(6).strip() if param_match.group(6) else ""
            valeur_anterieure = param_match.group(4).strip() if param_match.group(4) else None
            date_anterieure = param_match.group(5).strip() if param_match.group(5) else ''
            # Normalisation des unités
            unite = UNIT_MAPPING.get(unite.lower(), unite)
            # Normalisation des valeurs numériques
            try:
                valeur_actuelle = normalize_numeric_values(valeur_actuelle)
            except ValueError:
                valeur_actuelle = ''
            try:
                valeur_anterieure = normalize_numeric_values(valeur_anterieure) if valeur_anterieure not in [None, ''] else None
            except ValueError:
                valeur_anterieure = None
            # Extraction des bornes min/max
            min_val, max_val = extract_min_max(valeur_usuelles)
            # Nettoyage du code paramètre
            parametre = nettoyer_code_parametre(parametre)
            results.append({
                "CodeParametre": parametre,
                "ValeurActuelle": valeur_actuelle,
                "Unite": unite,
                "ValeursUsuelles": valeur_usuelles,
                "ValeurUsuelleMin": min_val,
                "ValeurUsuelleMax": max_val,
                "ValeurAnterieure": valeur_anterieure,
                "DateAnterieure": date_anterieure
            })
    if not results:
        raise HTTPException(status_code=400, detail="Aucun paramètre reconnu dans le PDF")
    return results

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Gère les valeurs manquantes dans le DataFrame."""
    # Remplir les valeurs manquantes pour les informations du patient
    df['NomPatient'] = df['NomPatient'].fillna('patient')
    df['Medecin'] = df['Medecin'].fillna('médecin')
    df['DateAnalyse'] = df['DateAnalyse'].fillna('')

    # Remplir les valeurs manquantes pour les paramètres
    df['Unite'] = df['Unite'].fillna('-')
    df['ValeursUsuelles'] = df['ValeursUsuelles'].fillna('')
    
    # Remplir les valeurs manquantes pour les valeurs numériques
    df['ValeurUsuelleMin'] = df['ValeurUsuelleMin'].fillna(-1e6)
    df['ValeurUsuelleMax'] = df['ValeurUsuelleMax'].fillna(1e6)
    df['ValeurActuelle'] = df['ValeurActuelle'].fillna(0)

    # Pour les codes paramètres manquants, utiliser une valeur par défaut
    df['CodeParametre'] = df['CodeParametre'].fillna('parametre_inconnu')

    # Convertir explicitement les colonnes numériques en float
    numeric_columns = ['ValeurActuelle', 'ValeurUsuelleMin', 'ValeurUsuelleMax']
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)

    return df

def postprocess_valeurs_usuelles(df):
    def format_valeurs(row):
        val_usuelle = str(row['ValeursUsuelles'])
        # nombre - 1,000,000
        match_min = re.match(r'^\s*(\d+(?:[.,]?\d+)?)\s*-\s*1[,.]?0{6,}', val_usuelle)
        if match_min:
            min_val = match_min.group(1).replace(',', '.')
            row['ValeursUsuelles'] = f"{min_val}<"
            row['ValeurUsuelleMin'] = float(min_val)
            row['ValeurUsuelleMax'] = ''
            return row
        # 1,000,000 - nombre
        match_max = re.match(r'^1[,.]?0{6,}\s*-\s*(\d+(?:[.,]?\d+)?)', val_usuelle)
        if match_max:
            max_val = match_max.group(1).replace(',', '.')
            row['ValeursUsuelles'] = f"{max_val}>"
            row['ValeurUsuelleMin'] = ''
            row['ValeurUsuelleMax'] = float(max_val)
            return row
        # -1,000,000
        match_neg = re.match(r'^-1[,.]?0{6,}\s*-\s*(\d+(?:[.,]?\d+)?)', val_usuelle)
        if match_neg:
            nombre = match_neg.group(1).replace(',', '.')
            row['ValeurUsuelleMin'] = ''
            row['ValeursUsuelles'] = f"{nombre}>"
            row['ValeurUsuelleMax'] = float(nombre)
            return row
        return row
    df = df.apply(format_valeurs, axis=1)
    return df

def clean_json_value(val, field_type):
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        if field_type == float or field_type == Optional[float]:
            return None
        else:
            return "n'existe pas"
    return val

def to_native(val):
    if isinstance(val, (np.generic,)):
        return val.item()
    return val

# ==== API Endpoints ====
@app.post("/predict", response_model=PredictionResult)
def predict(data: InputData):
    df = pd.DataFrame([data.dict()])
    preds = pipeline.predict(df)[0]
    return PredictionResult(
        **data.dict(),
        CodParametre=preds[0],
        LIBMEDWINabrege=preds[1],
        LibParametre=preds[2],
        FAMILLE=preds[3]
    )

@app.post("/upload-pdf", response_model=List[PredictionResult])
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    file_extension = file.filename.split('.')[-1].lower()
    
    try:
        if file_extension == "pdf":
            if file.content_type != "application/pdf":
                raise HTTPException(status_code=400, detail="Le fichier doit être au format PDF")
            
            # Traitement PDF existant
            extracted_text = extract_text_from_pdf_bytes(content)
            cleaned_text = nettoyer_text(extracted_text)
            patient_info = extract_patient_info(cleaned_text)
            data_fields_list = extract_all_fields_from_text(cleaned_text)
            
            for item in data_fields_list:
                item.update(patient_info)
                
            # Créer le DataFrame
            df = pd.DataFrame(data_fields_list)
            
        elif file_extension == "xml":
            # Traitement XML
            results = parse_xml_file(content)
            # Convertir la liste de résultats en DataFrame
            df = pd.DataFrame(results)
            
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non pris en charge. Utilisez PDF ou XML.")
    
        # Traitement commun pour PDF et XML
        df = handle_missing_values(df)
        df = postprocess_valeurs_usuelles(df)
        
        # Si on a du PDF et qu'on a besoin de prédire les paramètres
        if file_extension == "pdf":
            # Faire la prédiction
            preds = pipeline.predict(df)
            
            # Créer les résultats avec les prédictions
            results = []
            for input_data, p in zip(df.to_dict('records'), preds):
                # Nettoyer les valeurs NaN/inf selon le type attendu
                for k, v in input_data.items():
                    field_type = PredictionResult.model_fields[k].annotation if k in PredictionResult.model_fields else str
                    input_data[k] = clean_json_value(v, field_type)
                result = PredictionResult(
                    **input_data,
                    CodParametre=p[0],
                    LIBMEDWINabrege=p[1],
                    LibParametre=p[2],
                    FAMILLE=p[3]
                )
                results.append(result)
        else:
            # Pour XML, nous avons déjà les informations complètes
            results = []
            for input_data in df.to_dict('records'):
                # Nettoyer les valeurs NaN/inf selon le type attendu
                for k, v in input_data.items():
                    field_type = PredictionResult.model_fields[k].annotation if k in PredictionResult.model_fields else str
                    input_data[k] = clean_json_value(v, field_type)
                result = PredictionResult(**input_data)
                results.append(result)

        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement: {str(e)}")

@app.post("/analyze-risk")
def analyze_risk(param: dict = Body(...)):
    import joblib
    import pandas as pd
    import numpy as np
    model_path = "MLmodels/model2.joblib"
    # Charger le modèle
    model = joblib.load(model_path)

    # Préparer le DataFrame à partir du paramètre reçu
    df_test = pd.DataFrame([param])

    # Préparation des features dérivées (copie de preparer_features)
    df_result = df_test.copy()
    try:
        df_result['ValeurAnterieure'] = pd.to_numeric(df_result['ValeurAnterieure'], errors='coerce')
        for i, row in df_result.iterrows():
            if not pd.isna(row['ValeurAnterieure']) and row['ValeurAnterieure'] != 0:
                df_result.loc[i, 'DeltaValeurPrecedente'] = row['ValeurActuelle'] - row['ValeurAnterieure']
                df_result.loc[i, 'RatioValeurPrecedente'] = row['ValeurActuelle'] / row['ValeurAnterieure']
            else:
                df_result.loc[i, 'DeltaValeurPrecedente'] = 0
                df_result.loc[i, 'RatioValeurPrecedente'] = 1
    except:
        df_result['DeltaValeurPrecedente'] = 0
        df_result['RatioValeurPrecedente'] = 1
    df_result['PourcentageValeurMin'] = (df_result['ValeurActuelle'] / df_result['ValeurUsuelleMin']) * 100
    df_result['PourcentageValeurMax'] = (df_result['ValeurActuelle'] / df_result['ValeurUsuelleMax']) * 100
    df_result['EcartNormalise'] = 0.0
    mask = (df_result['ValeurUsuelleMax'] - df_result['ValeurUsuelleMin']) > 0
    df_result.loc[mask, 'EcartNormalise'] = (
        (df_result.loc[mask, 'ValeurActuelle'] - df_result.loc[mask, 'ValeurUsuelleMin']) /
        (df_result.loc[mask, 'ValeurUsuelleMax'] - df_result.loc[mask, 'ValeurUsuelleMin'])
    )
    for col in ['DeltaValeurPrecedente', 'RatioValeurPrecedente', 'PourcentageValeurMin', 
                'PourcentageValeurMax', 'EcartNormalise']:
        df_result[col] = df_result[col].replace([np.inf, -np.inf], np.nan)
        df_result[col] = df_result[col].fillna(0)

    # Statut
    valeur_actuelle = df_result['ValeurActuelle'].values[0]
    min_usuel = df_result['ValeurUsuelleMin'].values[0]
    max_usuel = df_result['ValeurUsuelleMax'].values[0]
    if valeur_actuelle < min_usuel:
        statut = "BAS"
    elif valeur_actuelle > max_usuel:
        statut = "ÉLEVÉ"
    else:
        statut = "NORMAL"

    # Features pour le ML
    features_for_ml = df_result[['DeltaValeurPrecedente', 'RatioValeurPrecedente', 
                                 'PourcentageValeurMin', 'PourcentageValeurMax', 
                                 'EcartNormalise', 'ValeurActuelle', 'CodeParametre']]
    predicted_risk_num = model.predict(features_for_ml)[0]
    risk_map = {0: 'Aucun', 1: 'Faible', 2: 'Modéré', 3: 'Élevé'}
    degre_risque = risk_map.get(int(predicted_risk_num), 'Inconnu')

    # Détermination de la tendance
    valeur_anterieure = df_result['ValeurAnterieure'].values[0]
    tendance = "Indéterminée (pas de valeur antérieure)"
    if not pd.isna(valeur_anterieure) and valeur_anterieure != 0:
        delta = df_result['DeltaValeurPrecedente'].values[0]
        if abs(delta) < 0.05 * (max_usuel - min_usuel):
            tendance = "Stable"
        elif delta > 0:
            tendance = "En hausse"
        else:
            tendance = "En baisse"

    # Conseil simple
    if degre_risque == "Aucun":
        conseil = "Aucune action particulière requise. Les valeurs sont dans la plage normale."
    elif degre_risque == "Faible":
        conseil = f"À surveiller lors du prochain contrôle. Le {param['CodParametre']} est légèrement {statut.lower()}."
    elif degre_risque == "Modéré":
        conseil = f"Surveillance recommandée. Le {param['CodParametre']} est {statut.lower()} avec un risque modéré."
    else:  # Élevé
        conseil = f"Consultation médicale recommandée. Le {param['CodParametre']} présente un risque élevé."

    # Conversion explicite des types pour la réponse JSON
    return {
        "parametre": to_native(param['CodeParametre']),
        "valeur_actuelle": to_native(valeur_actuelle),
        "unite": to_native(param.get('Unite', '')),
        "valeur_anterieure": to_native(valeur_anterieure) if not pd.isna(valeur_anterieure) else "n'existe pas",
        "valeurs_usuelles": to_native(param.get('ValeursUsuelles', '')),
        "statut_risque": to_native(statut),
        "degre_risque": to_native(degre_risque),
        "tendance": to_native(tendance),
        "conseil": to_native(conseil)
    }

# Fonction de debug temporaire pour tester l'extraction
def debug_extraction(line):
    """Teste l'extraction d'une ligne et affiche les résultats"""
    match = re.search(REGEX_PARAMETRE, line)
    if match:
        return {
            "param": match.group(1).strip(),
            "valeur": match.group(2).strip(),
            "unite": match.group(3).strip() if match.group(3) else "",
            "valeur_ant": match.group(4).strip() if match.group(4) else None,
            "date": match.group(5).strip() if match.group(5) else "",
            "usuelles": match.group(6).strip() if match.group(6) else ""
        }
    return None

# Ajouter les fonctions de traitement XML
def extract_valeurs_usuelles_xml(val):
    """Extrait les bornes min/max des valeurs usuelles depuis un format XML."""
    if not isinstance(val, str) or val.strip() == "":
        return None, None
    val = val.lower().replace(',', '.').strip()

    try:
        if '-' in val:
            parts = val.split('-')
            return float(parts[0].strip()), float(parts[1].strip())
        elif 'inf à' in val:
            return None, float(re.sub(r"[^\d.]", "", val))
        elif 'sup à' in val or '>' in val:
            return float(re.sub(r"[^\d.]", "", val)), None
    except:
        return None, None

    return None, None

def parse_xml_file(xml_bytes: bytes) -> list:
    """Parse un fichier XML et retourne les résultats au format attendu par l'API."""
    try:
        # Utiliser BytesIO pour lire les bytes comme un fichier
        tree = ET.parse(io.BytesIO(xml_bytes))
        root = tree.getroot()
        
        results = []

        demande = root.find(".//Demande")
        if demande is None:
            raise HTTPException(status_code=400, detail="Format XML non reconnu: élément 'Demande' introuvable")
            
        nom_patient = demande.findtext("NomPatient", "").strip()
        prenom_patient = demande.findtext("PrenomPatient", "").strip()
        patient_name = f"{nom_patient} {prenom_patient}".strip()
        patient_name = nettoyer_nom_patient(patient_name)
        medecin = demande.findtext("MedecinPrescripteur", "").strip()
        date_analyse = demande.findtext("DateSaisie", "").strip()

        # Convertir la date si nécessaire
        if re.match(r'^\d{4}-\d{2}-\d{2}$', date_analyse):
            parts = date_analyse.split('-')
            date_analyse = f"{parts[2]}/{parts[1]}/{parts[0]}"

        for examen in demande.findall(".//Examen"):
            famille = examen.findtext("Famille", "").strip()
            code_analyse = examen.findtext("CodeAnalyse", "").strip()
            lib_analyse = examen.findtext("LibAnalyse", "").strip()

            for res in examen.findall("Resultat"):
                cod_param = res.findtext("CodParametre", "").strip()
                lib_param = res.findtext("LibParametre", "").strip()
                valeur = res.findtext("Valeur", "").replace(",", ".").strip()
                unite = res.findtext("Unite", "").strip()
                val_usuelle = res.findtext("ValeurUsuelles", "").strip()

                val_min, val_max = extract_valeurs_usuelles_xml(val_usuelle)

                # Normalisation des valeurs
                try:
                    valeur_actuelle = normalize_numeric_values(valeur)
                except ValueError:
                    valeur_actuelle = ''

                results.append({
                    "CodeParametre": cod_param.lower(),
                    "ValeurActuelle": valeur_actuelle,
                    "Unite": unite,
                    "ValeursUsuelles": val_usuelle,
                    "ValeurUsuelleMin": val_min,
                    "ValeurUsuelleMax": val_max,
                    "ValeurAnterieure": None,
                    "DateAnterieure": '',
                    "NomPatient": patient_name,
                    "Medecin": medecin,
                    "DateAnalyse": date_analyse,
                    "CodParametre": cod_param,  # Champ prédit (copie du code paramètre)
                    "LIBMEDWINabrege": cod_param,  # Pourrait être différent, dépend du modèle
                    "LibParametre": lib_param,
                    "FAMILLE": famille
                })

        if not results:
            raise HTTPException(status_code=400, detail="Aucun paramètre reconnu dans le XML")
            
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors du traitement du XML: {str(e)}")
