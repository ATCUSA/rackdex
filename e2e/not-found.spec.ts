import { expect, test } from '@playwright/test';
import { stubGitHub } from './helpers';

test.beforeEach(async ({ page }) => stubGitHub(page));

test('unknown URLs show a friendly not-found page with a way home', async ({ page }) => {
	await page.goto('/no-such-page');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
	await page.getByRole('link', { name: 'Back to search' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('searchbox', { name: 'Search device types' })).toBeVisible();
});
