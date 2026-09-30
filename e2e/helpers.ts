import type { Page } from '@playwright/test';

/** Make GitHub deterministic: no live delta, and stub YAML bodies. */
export async function stubGitHub(page: Page) {
	await page.route('https://api.github.com/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ status: 'identical', total_commits: 0, commits: [], files: [] })
		})
	);
	await page.route(/raw\.githubusercontent\.com\/.*\.ya?ml$/, (route) => {
		const file = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop()!);
		return route.fulfill({
			status: 200,
			contentType: 'text/plain',
			body: `---\nmanufacturer: Test\nmodel: ${file}\n`
		});
	});
}
