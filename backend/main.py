from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import pdfplumber
import re
import numpy as np
import io
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import os
import json
from rapidfuzz import process
from sklearn.impute import SimpleImputer
import random

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

class PredictionResult(BaseModel):
    # Champs d'entrée
    CodeParametre: str
    ValeurActuelle: float
    Unite: str
    ValeursUsuelles: str
    ValeurUsuelleMin: float
    ValeurUsuelleMax: float
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

# Regex patterns
REGEX_DATE = r"\b(\d{2}/\d{2}/\d{4})\b"
REGEX_PATIENT = r"(?i)nom\s*:\s*(.*)"
REGEX_MEDECIN = r"(?i)demandé par\s*:\s*(.*)"
REGEX_PARAMETRE = r"([\w\s]+)\s+(\d+[.,]?\d*)\s*([a-zA-Z/%³]*)\s*(\d+[.,]?\d*)?\s*(\d{2}/\d{2}/\d{2})?\s*\(([^)]*)\)?"

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

    range_pattern = r'(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)'
    lt_pattern = r'<\s*(\d+(?:[.,]\d+)?)'
    gt_pattern = r'>\s*(\d+(?:[.,]\d+)?)'

    range_match = re.search(range_pattern, valeur_usuelles)
    if range_match:
        return float(range_match.group(1).replace(',', '.')), float(range_match.group(2).replace(',', '.'))

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
        patient_info["NomPatient"] = patient_match.group(1).strip()
    
    medecin_match = re.search(REGEX_MEDECIN, text)
    if medecin_match:
        patient_info["Medecin"] = medecin_match.group(1).strip()
    
    return patient_info

def extract_all_fields_from_text(text: str) -> List[dict]:
    """Extrait tous les paramètres et valeurs du texte nettoyé."""
    results = []
    type_analyse = None
    examen = None
    
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
            
        # Détection des types d'analyses
        for type_normalise, variantes in TYPE_ANALYSES.items():
            for variante in variantes:
                if variante.lower() in line.lower():
                    type_analyse = type_normalise
                    break
            if type_analyse:
                break
                
        # Détection des examens
        if line and not line.isupper() and len(line.split()) <= 3:
            examen = line.lower()
            continue
            
        # Extraction des paramètres et valeurs
        param_match = re.search(REGEX_PARAMETRE, line)
        if param_match:
            parametre = param_match.group(1).strip().lower()
            valeur_actuelle = param_match.group(2).strip()
            unite = param_match.group(3).strip()
            valeur_anterieure = param_match.group(4).strip() if param_match.group(4) else ""
            date_anterieure = param_match.group(5).strip() if param_match.group(5) else ""
            valeur_usuelles = param_match.group(6).strip()
            
            # Normalisation des unités
            unite = UNIT_MAPPING.get(unite.lower(), unite)
            
            # Normalisation des valeurs numériques
            try:
                valeur_actuelle = normalize_numeric_values(valeur_actuelle)
            except ValueError:
                continue
                
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
                "ValeurUsuelleMax": max_val
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
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Le fichier doit être au format PDF")
    
    content = await file.read()
    
    # Extraire le texte du PDF
    extracted_text = extract_text_from_pdf_bytes(content)
    
    # Nettoyer le texte
    cleaned_text = nettoyer_text(extracted_text)
    
    # Extraire les informations du patient
    patient_info = extract_patient_info(cleaned_text)
    
    # Extraire les paramètres et valeurs
    data_fields_list = extract_all_fields_from_text(cleaned_text)
    
    # Ajouter les informations du patient à chaque résultat
    for item in data_fields_list:
        item.update(patient_info)
    
    # Créer le DataFrame
    df = pd.DataFrame(data_fields_list)
    
    # Gérer les valeurs manquantes
    df = handle_missing_values(df)
    
    # Faire la prédiction
    preds = pipeline.predict(df)

    # Créer les résultats avec les prédictions
    results = []
    for input_data, p in zip(df.to_dict('records'), preds):
        # S'assurer que toutes les valeurs numériques sont des float
        input_data['ValeurActuelle'] = float(input_data['ValeurActuelle'])
        input_data['ValeurUsuelleMin'] = float(input_data['ValeurUsuelleMin'])
        input_data['ValeurUsuelleMax'] = float(input_data['ValeurUsuelleMax'])
        
        result = PredictionResult(
            **input_data,
            CodParametre=p[0],
            LIBMEDWINabrege=p[1],
            LibParametre=p[2],
            FAMILLE=p[3]
        )
        results.append(result)

    return results
