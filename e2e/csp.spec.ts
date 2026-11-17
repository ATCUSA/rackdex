import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { stubGitHub } from './helpers';

// The CSP ships as a <meta> tag, which has no report-only mode, so a too-tight policy would break the
// live site outright. Walk every feature that loads or runs something and fail on any violation.
async function collectViolations(page: Page) {
	const violations: string[] = [];
	await page.addInitScript(() => {
		document.addEventListener('securitypolicyviolation', (e) => {
			console.error(`CSP violation: ${e.violatedDirective} blocked ${e.blockedURI || 'inline'}`);
		});
	});
	page.on('console', (m) => {
		if (m.type() === 'error' && /content security policy|CSP violation/i.test(m.text())) violations.push(m.text());
	});
	return violations;
}

test.beforeEach(async ({ page }) => stubGitHub(page));

test('prerendered pages and the 404 fallback carry the CSP meta tag', async ({ request }) => {
	const pages: [string, string][] = [];
	for (const p of ['/', '/about']) pages.push([p, await (await request.get(p)).text()]);
	// Cloudflare serves build/404.html for unknown URLs, but vite preview renders its own error page with the
	// policy as a header instead, so check the deployed file directly.
	pages.push(['404.html', await readFile('build/404.html', 'utf8')]);
	for (const [p, html] of pages) {
		const csp = html.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/)?.[1];
		expect(csp, p).toContain("script-src 'self' 'sha256-");
		expect(csp, p).toContain("object-src 'none'");
		// The policy only covers what comes after the meta tag, so it must precede every script.
		expect(html.indexOf('http-equiv="content-security-policy"'), p).toBeLessThan(html.indexOf('<script'));
	}
});

test('no CSP violations across search, details, export, theme and navigation', async ({ page }) => {
	const violations = await collectViolations(page);

	await page.goto('/?q=C9300-48P&kind=device');
	await page.getByRole('listitem').first().getByRole('button', { name: /9300/ }).click();
	const panel = page.getByRole('dialog', { name: 'Device type details' });
	await expect(panel.getByText('manufacturer: Test')).toBeVisible();
	await panel.getByRole('button', { name: 'Copy YAML' }).click();
	await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Download YAML' }).click()]);
	await panel.getByRole('button', { name: 'Add to selection' }).click();
	await page.keyboard.press('Escape');

	await page.getByRole('button', { name: 'Open selection' }).click();
	const drawer = page.getByRole('dialog', { name: 'Selection' });
	await Promise.all([page.waitForEvent('download'), drawer.getByRole('button', { name: 'Download combined device types' }).click()]);
	await page.keyboard.press('Escape');

	// The theme script in app.html runs on load; flip to light and reload so its branch actually executes.
	await page.getByRole('button', { name: 'Toggle theme' }).click();
	await page.reload();
	// Soft, so a blocked theme script still reaches the violations check below and reports why.
	await expect.soft(page.locator('html')).not.toHaveClass(/dark/);

	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Search' }).click();
	await expect(page.getByTestId('result-count')).toBeVisible();

	await page.goto('/about');
	await page.goto('/no-such-page');

	expect(violations).toEqual([]);
});
