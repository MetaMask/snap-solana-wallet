/**
 * Populates the English locale file with messages from a JSON source.
 *
 * This script reads messages from a JSON file, transforms them into a specific format,
 * and writes them to an English locale file (`en.json`).
 *
 * @example
 * node populate-locale.js
 * @throws Will throw an error if writing to the locale file fails.
 */
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const messages = require('../messages.json');

console.log('🌍 Populating EN locale');

const englishLocale = Object.assign(
  { locale: 'en' },
  Object.entries(messages).reduce(
    (list, [key, value]) => {
      list.messages[key] = { message: value };
      return list;
    },
    { messages: {} },
  ),
);

// Write en locale file
try {
  writeFileSync(
    join(__dirname, '../locales/en.json'),
    JSON.stringify(englishLocale, null, 2),
  );
  console.log('🌍 EN locale populated ✅');
} catch (error) {
  console.error('❌ Error writing en locale file', error);
  throw error;
}
