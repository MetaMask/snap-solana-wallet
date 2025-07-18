// @ts-check
/* eslint-disable */

const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packageFile = require('../package.json');

console.log('[preinstalled-snap] - attempt to build preinstalled snap');

/**
 * Read the contents of a file and return as a string.
 * @param {string} filePath - Path to file.
 * @returns {string} File as utf-8 string.
 */
function readFileContents(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file from disk: ${filePath}`, error);
    throw error;
  }
}

// Paths to the files
const bundlePath = require.resolve('../dist/bundle.js');
const iconPath = require.resolve('../images/icon.svg');
const manifestPath = require.resolve('../snap.manifest.json');
const enLocalePath = require.resolve('../locales/en.json');

// File Contents
const bundle = readFileContents(bundlePath);
const icon = readFileContents(iconPath);
const manifest = readFileContents(manifestPath);
const enLocale = readFileContents(enLocalePath);

const snapId =
  /** @type {import('@metamask/snaps-controllers').PreinstalledSnap['snapId']} */ (
    `npm:${packageFile.name}`
  );

/**
 * @type {import('@metamask/snaps-controllers').PreinstalledSnap}
 */
const preinstalledSnap = {
  snapId,
  manifest: JSON.parse(manifest),
  files: [
    {
      path: 'images/icon.svg',
      value: icon,
    },
    {
      path: 'dist/bundle.js',
      value: bundle,
    },
    {
      path: 'locales/en.json',
      value: enLocale,
    },
  ],
  removable: false,
  hideSnapBranding: true,
};

// Write preinstalled-snap file
try {
  const outputPath = join(__dirname, '..', 'dist/preinstalled-snap.json');
  writeFileSync(outputPath, JSON.stringify(preinstalledSnap, null, 0));

  console.log(
    `[preinstalled-snap] - successfully created preinstalled snap at ${outputPath}`,
  );
} catch (error) {
  console.error('Error writing combined file to disk:', error);
  throw error;
}
