import { expect, test } from '@playwright/test';

test('home page loads and displays the card', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Gymmie')).toBeVisible();
  await expect(page.getByText('Beta')).toBeVisible();
});

test('home page displays action buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Learn More' })).toBeVisible();
});
