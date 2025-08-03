#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Génération des fichiers d\'environnement Angular...');

// Lire les variables d'environnement
const envVars = {
  API_URL: process.env.API_URL || 'http://localhost:8002/api',
  PYTHON_API_URL: process.env.PYTHON_API_URL || 'http://localhost:8000',
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'dev-3z4wx78gwy1inwps.us.auth0.com',
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '2CTMPHhvwVZ2OK8LK9mQM6GoitUSgIVe'
};

// Template pour environment.ts
const environmentTs = `export const environment = {
  production: false,
  auth0: {
    domain: '${envVars.AUTH0_DOMAIN}',
    clientId: '${envVars.AUTH0_CLIENT_ID}'
  },
  apiUrl: '${envVars.API_URL}',
  pythonApiUrl: '${envVars.PYTHON_API_URL}'
};
`;

// Template pour environment.prod.ts
const environmentProdTs = `export const environment = {
  production: true,
  auth0: {
    domain: '${envVars.AUTH0_DOMAIN}',
    clientId: '${envVars.AUTH0_CLIENT_ID}'
  },
  apiUrl: '${envVars.API_URL}',
  pythonApiUrl: '${envVars.PYTHON_API_URL}'
};
`;

// Chemins des fichiers
const envTsPath = path.join(__dirname, 'src', 'environments', 'environment.ts');
const envProdTsPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

// Créer le dossier environments s'il n'existe pas
const environmentsDir = path.dirname(envTsPath);
if (!fs.existsSync(environmentsDir)) {
  fs.mkdirSync(environmentsDir, { recursive: true });
}

// Écrire les fichiers
fs.writeFileSync(envTsPath, environmentTs);
fs.writeFileSync(envProdTsPath, environmentProdTs);

console.log('✅ Fichiers d\'environnement générés :');
console.log(`   - ${envTsPath}`);
console.log(`   - ${envProdTsPath}`);
console.log('');
console.log('📋 Configuration actuelle :');
console.log(`   - API URL: ${envVars.API_URL}`);
console.log(`   - Python API URL: ${envVars.PYTHON_API_URL}`);
console.log(`   - Auth0 Domain: ${envVars.AUTH0_DOMAIN}`);
console.log('');
console.log('🚀 Vous pouvez maintenant lancer : npm start'); 