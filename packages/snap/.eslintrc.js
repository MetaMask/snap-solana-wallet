module.exports = {
  extends: ['../../.eslintrc.js'],

  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      files: ['snap.config.ts'],
      extends: ['@metamask/eslint-config-nodejs'],
    },

    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        // This allows importing the `Text` JSX component.
        '@typescript-eslint/no-shadow': [
          'error',
          {
            allow: ['Text'],
          },
        ],
      },
    },

    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
      },
    },
  ],

  ignorePatterns: [
    '**/snap.manifest.json',
    '!.eslintrc.js',
    'dist/',
    'scripts/update-manifest-local.js',
  ],
};
