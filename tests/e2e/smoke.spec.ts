import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NFT|Marketplace|W3I/i);
});

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible();
});
