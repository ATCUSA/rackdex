import { expect, test } from '@playwright/test';
import { stubGitHub } from './helpers';

test.beforeEach(async ({ page }) => stubGitHub(page));

test('main page credits the library', async ({ page }) => {
	await page.goto('/');
	const footer = page.getByTestId('credits');
	await expect(footer.getByRole('link', { name: 'netbox-community/devicetype-library' })).toHaveAttribute(
		'href',
		'https://github.com/netbox-community/devicetype-library'
	);
	await expect(footer).toContainText('Unofficial');
	await expect(footer.getByRole('link', { name: 'source on GitHub' })).toHaveAttribute('href', 'https://github.com/ATCUSA/rackdex');
});

test('header links to the RackDex repo with its star count', async ({ page }) => {
	await page.goto('/');
	const link = page.getByTestId('repo-link');
	await expect(link).toHaveAttribute('href', 'https://github.com/ATCUSA/rackdex');
	await expect(link.getByTestId('star-count')).toHaveText('42');
});

test('about page explains the app and credits contributors', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
	await expect(page.getByRole('link', { name: /contributors/ }).first()).toHaveAttribute('href', /graphs\/contributors/);
	await expect(page.getByRole('link', { name: 'CC0-1.0' })).toBeVisible();
});
