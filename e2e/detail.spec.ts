import { expect, test } from '@playwright/test';
import { stubGitHub } from './helpers';

test.beforeEach(async ({ page }) => stubGitHub(page));

test('open a type, copy its YAML, see manufacturer helper, close with Escape', async ({ page }) => {
	await page.goto('/?q=C9300-48P&kind=device');
	await page.getByRole('listitem').first().getByRole('button', { name: /9300/ }).click();

	const panel = page.getByRole('complementary', { name: 'Device type details' });
	await expect(panel).toBeVisible();
	await expect(page).toHaveURL(/open=device-types/);
	await expect(panel.getByText('manufacturer: Test')).toBeVisible();

	await panel.getByRole('button', { name: 'Copy YAML' }).click();
	expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('manufacturer: Test');
	await expect(page.getByRole('status').filter({ hasText: 'YAML copied' })).toBeVisible();

	await expect(panel.getByText('name,slug')).toBeVisible();
	await expect(panel.getByText('Devices → Device Types → Import')).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await expect(page).not.toHaveURL(/open=/);
});

test('deep link opens the panel directly', async ({ page }) => {
	await page.goto('/?open=device-types%2FCisco%2FC9300-48P.yaml');
	await expect(page.getByRole('complementary', { name: 'Device type details' })).toContainText('Catalyst 9300-48P');
});
