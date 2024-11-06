import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './packages/site/e2e/tests',
  // ...
  projects: [
    {
      name: 'setup db',
      testMatch: /global\.setup\.ts/,
    },
    // {
    //   other project
    // }
  ]
});