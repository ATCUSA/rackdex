import { expect, test } from '@playwright/test';

// What a crawler that doesn't run JavaScript gets: the prerendered HTML, fetched without a browser.
for (const [path, h1, canonical] of [
	['/', 'Search the NetBox Device Type Library', 'https://rackdex.acole.dev/'],
	['/about', 'About', 'https://rackdex.acole.dev/about']
] as const) {
	test(`${path} is prerendered with content and SEO tags`, async ({ request }) => {
		const html = await (await request.get(path)).text();
		expect(html).toContain(`<link rel="canonical" href="${canonical}"`);
		expect(html).toMatch(/<meta name="description" content="[^"]{50,}"/);
		expect(html).toMatch(/<title>[^<]*RackDex[^<]*<\/title>/);
		expect(html).toMatch(new RegExp(`<h1[^>]*>\\s*${h1}\\s*</h1>`));
		expect(html).not.toContain('Could not load the device type index');
	});
}

test('the header has a main nav with the current page marked', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/about');
	const nav = page.getByRole('navigation', { name: 'Main' });
	await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
	await nav.getByRole('link', { name: 'Search' }).click();
	await expect(page.getByRole('searchbox', { name: 'Search device types' })).toBeVisible();
});
