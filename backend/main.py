from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import pdfplumber
import re
import numpy as np
import io
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger le modèle ML
pipeline = joblib.load("MLmodels/pipeline.joblib")

# ==== Pydantic Models ====
class InputData(BaseModel):
    CodeParametre: str
    ValeurActuelle: float
    Unite: str
    ValeursUsuelles: str
    ValeurUsuelleMin: float
    ValeurUsuelleMax: float

class PredictionResult(BaseModel):
    CodParametre: str
    LIBMEDWINabrege: str
    LibParametre: str
    FAMILLE: str

# ==== API Endpoints ====
@app.post("/predict", response_model=PredictionResult)
def predict(data: InputData):
    df = pd.DataFrame([data.dict()])
    preds = pipeline.predict(df)[0]
    return PredictionResult(
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
    data_fields_list = extract_all_fields_from_pdf(content)

    df = pd.DataFrame(data_fields_list)
    preds = pipeline.predict(df)

    return [
        PredictionResult(
            CodParametre=p[0],
            LIBMEDWINabrege=p[1],
            LibParametre=p[2],
            FAMILLE=p[3]
        ) for p in preds
    ]

# ==== Extraction complète des paramètres ====
def extract_all_fields_from_pdf(pdf_bytes: bytes) -> List[dict]:
    # Extraire tout le texte du PDF
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        raw_text = "".join(page.extract_text() or "" for page in pdf.pages)

    # Nettoyage global : supprimer points orphelins et passer en minuscules
    cleaned = re.sub(r'(\b[A-Za-zÀ-ÖØ-öø-ÿ])(?:\.+[A-Za-zÀ-ÖØ-öø-ÿ])+\b', lambda m: m.group(0).replace('.', ''), raw_text)
    cleaned = re.sub(r'\.(?!\d)', '', cleaned).lower()

    # Regex général pour détecter tous les paramètres avec valeur, unité et bornes usuelles
    param_pattern = re.compile(
        r'([\w\s]+?)\s+'        # nom du paramètre
        r'(\d+[.,]?\d*)\s*'      # valeur actuelle
        r'([A-Za-z/%³]*)\s*'       # unité (optionnelle)
        r'(?:\d+[.,]?\d*)?\s*'   # valeur antérieure (optionnelle) ignore
        r'(?:\d{2}/\d{2}/\d{2})?\s*'  # date antérieure (optionnelle) ignore
        r'\(([^)]*)\)'            # bornes usuelles entre parenthèses
    )

    results = []
    for line in cleaned.splitlines():
        match = param_pattern.search(line)
        if not match:
            continue
        name = match.group(1).strip().lower()
        try:
            value = float(match.group(2).replace(',', '.'))
        except ValueError:
            continue
        unit = match.group(3).strip()
        bounds = match.group(4).strip()
        min_val, max_val = extract_min_max(bounds)
        results.append({
            "CodeParametre": name,
            "ValeurActuelle": value,
            "Unite": unit,
            "ValeursUsuelles": bounds,
            "ValeurUsuelleMin": min_val,
            "ValeurUsuelleMax": max_val
        })

    if not results:
        raise HTTPException(status_code=400, detail="Aucun paramètre reconnu dans le PDF")
    return results

# ==== Extraction min/max ====
def extract_min_max(val: str):
    val = val.replace(',', '.')
    try:
        if '-' in val:
            parts = val.split('-')
            return float(parts[0]), float(parts[1])
        elif '>' in val:
            return float(val.replace('>', '').strip()), 1e6
        elif '<' in val:
            return -1e6, float(val.replace('<', '').strip())
    except ValueError:
        pass
    return -1e6, 1e6
