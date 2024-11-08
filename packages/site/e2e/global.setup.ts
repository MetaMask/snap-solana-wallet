import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './packages/site/e2e/tests',
  // ...
  projects: [
    {
      name: 'Snap Solana Wallet',
      testMatch: /global\.setup\.ts/,
    },
  ]
});