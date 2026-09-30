import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { stubGitHub } from './helpers';

test.beforeEach(async ({ page }) => stubGitHub(page));

test('select two device types and export them combined', async ({ page }) => {
	await page.goto('/?q=C9300&kind=device');
	const rows = page.getByRole('listitem');
	await rows.nth(0).getByRole('button', { name: 'Add to selection' }).click();
	await rows.nth(1).getByRole('button', { name: 'Add to selection' }).click();

	await page.getByRole('button', { name: 'Open selection' }).click();
	const drawer = page.getByRole('complementary', { name: 'Selection' });
	await expect(drawer.getByRole('heading', { name: 'Device types (2)' })).toBeVisible();

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		drawer.getByRole('button', { name: 'Download combined device types' }).click()
	]);
	expect(download.suggestedFilename()).toBe('netbox-device-types.yaml');
	const text = await readFile((await download.path())!, 'utf8');
	expect(text.match(/^---$/gm)).toHaveLength(2);

	await drawer.getByRole('button', { name: 'Copy combined device types' }).click();
	const clip = await page.evaluate(() => navigator.clipboard.readText());
	expect(clip.match(/^---$/gm)).toHaveLength(2);

	await expect(drawer.getByText('name,slug')).toBeVisible();
});

test('selection persists across reloads and can be cleared', async ({ page }) => {
	await page.goto('/?q=C9300&kind=device');
	await page.getByRole('listitem').first().getByRole('button', { name: 'Add to selection' }).click();
	await page.reload();
	await page.getByRole('button', { name: 'Open selection' }).click();
	const drawer = page.getByRole('complementary', { name: 'Selection' });
	await expect(drawer.getByRole('heading', { name: 'Device types (1)' })).toBeVisible();
	await drawer.getByRole('button', { name: 'Clear all' }).click();
	await expect(drawer.getByText('Nothing selected yet')).toBeVisible();
});
