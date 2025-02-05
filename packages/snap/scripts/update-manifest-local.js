const fs = require('fs');
const path = require('path');
require('dotenv').config();

const manifestPath = path.join(__dirname, '..', 'snap.manifest.json');
const environment = process.env.ENVIRONMENT || 'local';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (environment === 'local' || environment === 'test') {
  manifest.initialConnections = {
    ...manifest.initialConnections,
    'http://localhost:3000': {},
  };

  if (manifest.initialPermissions?.['endowment:keyring']?.allowedOrigins) {
    if (
      !manifest.initialPermissions['endowment:keyring'].allowedOrigins.includes(
        'http://localhost:3000',
      )
    ) {
      manifest.initialPermissions['endowment:keyring'].allowedOrigins.push(
        'http://localhost:3000',
      );
    }
  }

  console.log('Added localhost entries to snap.manifest.json');
} else if (environment === 'production') {
  // Remove entries for production
  if (manifest.initialConnections?.['http://localhost:3000']) {
    delete manifest.initialConnections['http://localhost:3000'];
  }

  if (manifest.initialPermissions?.['endowment:keyring']?.allowedOrigins) {
    manifest.initialPermissions['endowment:keyring'].allowedOrigins =
      manifest.initialPermissions['endowment:keyring'].allowedOrigins.filter(
        (origin) => origin !== 'http://localhost:3000',
      );
  }

  console.log('Removed localhost entries from snap.manifest.json');
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log('Updated snap.manifest.json with localhost entries');
