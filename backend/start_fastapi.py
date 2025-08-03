#!/usr/bin/env python3
"""
Script de démarrage pour FastAPI avec variables d'environnement
"""

import os
import uvicorn
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

if __name__ == "__main__":
    # Configuration depuis les variables d'environnement
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    print(f"Démarrage du serveur FastAPI...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Reload: {reload}")
    print(f"Debug: {debug}")
    print(f"Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:4200')}")
    
    # Démarrer le serveur
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        debug=debug
    ) 