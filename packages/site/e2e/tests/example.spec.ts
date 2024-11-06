import { test, expect } from '@playwright/test';
import HomePage  from '../pom/homePage'

test('create solana account', async ({ page }) => {
  const homePage = new HomePage(page)
  await homePage.visit()
  const accountList = await homePage.getAccounts()
  await expect(accountList).toHaveLength(1)
});
