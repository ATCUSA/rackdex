import { expect, test } from '@playwright/test';
import { stubGitHub } from './helpers';

test.beforeEach(async ({ page }) => stubGitHub(page));

test('loads the index and shows results', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('result-count')).toContainText(/[\d,]+ of [\d,]+ types/);
	await expect(page.getByRole('listitem').first()).toBeVisible();
});

test('search narrows results and syncs to the URL', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('searchbox', { name: 'Search device types' }).fill('C9300-48P');
	await expect(page.getByRole('listitem').first()).toContainText('9300');
	await expect(page).toHaveURL(/q=C9300-48P/);
});

test('vendor filter restricts results', async ({ page }) => {
	await page.goto('/');
	await page.getByPlaceholder('Filter vendor…').fill('Juniper');
	await page.getByRole('checkbox', { name: /^Juniper/ }).check();
	await expect(page).toHaveURL(/vendor=Juniper/);
	const rows = page.getByRole('listitem');
	await expect(rows.first()).toContainText('Juniper');
	for (const text of await rows.allInnerTexts()) expect(text).toContain('Juniper');
});

test('state is restored from the URL', async ({ page }) => {
	await page.goto('/?q=EX4300&kind=device');
	await expect(page.getByRole('searchbox', { name: 'Search device types' })).toHaveValue('EX4300');
	await expect(page.getByRole('checkbox', { name: /^Device type/ })).toBeChecked();
});
