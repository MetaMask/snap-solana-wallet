import base, { createConfig } from '@metamask/eslint-config';
import browser from '@metamask/eslint-config-browser';
import jest from '@metamask/eslint-config-jest';
import nodejs from '@metamask/eslint-config-nodejs';
import typescript from '@metamask/eslint-config-typescript';

/**
 * Shared overrides for pre-existing Solana snap patterns that became noisy
 * under ESLint 9 / @metamask/eslint-config v15. Kept off for migration PR#2;
 * can be re-enabled gradually after landing in internal-snaps.
 */
const preexistingPatternRules = {
  // Match internal-snaps noise controls / oxfmt ownership.
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-unnecessary-type-arguments': 'off',
  '@typescript-eslint/promise-function-async': 'off',
  'import-x/order': 'off',
  'import-x/no-duplicates': 'off',
  'import-x/no-named-as-default': 'off',
  'import-x/no-named-as-default-member': 'off',
  'jsdoc/check-tag-names': 'off',
  'jsdoc/require-jsdoc': 'off',
  // Prettier conflicts with oxfmt; formatting is enforced via lint:misc.
  'prettier/prettier': 'off',
  // Pre-existing promise / throw / stringification patterns.
  'promise/always-return': 'off',
  'promise/catch-or-return': 'off',
  'promise/no-callback-in-promise': 'off',
  'promise/param-names': 'off',
  '@typescript-eslint/no-base-to-string': 'off',
  '@typescript-eslint/only-throw-error': 'off',
  '@typescript-eslint/no-throw-literal': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/unbound-method': 'off',
  'no-empty-function': 'off',
  'no-unused-private-class-members': 'off',
  'n/no-sync': 'off',
};

export default createConfig([
  {
    ignores: [
      '**/coverage/**',
      '**/dist/**',
      '**/docs/**',
      '.yarn/**',
      'packages/site/.cache/',
      'packages/site/public/',
      'packages/snap/scripts/update-manifest-local.js',
      'packages/snap/svg-transformer.js',
      // Ambient declaration files trip import/unambiguous rules.
      '**/*.d.ts',
    ],
  },
  {
    files: ['**/*.{js,cjs}'],
    extends: [base, nodejs],
    rules: {
      ...preexistingPatternRules,
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [base, nodejs],
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      ...preexistingPatternRules,
    },
  },
  {
    files: ['packages/snap/**/*.{ts,tsx}'],
    extends: [base, typescript],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...preexistingPatternRules,
      // Allows importing the `Text` JSX component from @metamask/snaps-sdk.
      '@typescript-eslint/no-shadow': [
        'error',
        {
          allow: ['Text'],
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
  {
    files: ['packages/site/**/*.{ts,tsx}'],
    extends: [base, typescript, browser],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...preexistingPatternRules,
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,ts,tsx}', '**/tests/**/*.{js,ts,tsx}'],
    extends: [jest],
    rules: {
      ...preexistingPatternRules,
      '@typescript-eslint/no-shadow': [
        'error',
        { allow: ['describe', 'expect', 'it', 'Text'] },
      ],
      'jest/unbound-method': 'off',
      // Intentionally skipped tests existed before the tooling upgrade.
      'jest/no-disabled-tests': 'off',
      'jest/no-restricted-matchers': 'off',
    },
  },
  {
    files: ['eslint.config.mjs'],
    rules: {
      // Node 22+; repo .nvmrc is already on v22.
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['**/snap.config.ts'],
    extends: [nodejs],
    rules: {
      'import-x/no-nodejs-modules': 'off',
      'no-restricted-globals': 'off',
    },
  },
]);
