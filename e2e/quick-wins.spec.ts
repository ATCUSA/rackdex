import { expect, test } from '@playwright/test';
import { stubGitHub } from './helpers';

test.beforeEach(async ({ page }) => stubGitHub(page));

const ifaces = (text: string) => Number(/(\d+) ifaces/.exec(text)?.[1] ?? -1);

test('sort by interface count reorders results and syncs to the URL', async ({ page }) => {
	await page.goto('/?q=C9300-48P&kind=device');
	await expect(page.getByRole('listitem').first()).toBeVisible();
	await page.getByRole('combobox', { name: 'Sort results' }).selectOption('if-desc');
	await expect(page).toHaveURL(/sort=if-desc/);
	// Close matches come first, then a divider, then loose fuzzy matches; each group is sorted on its own.
	const divider = page.getByTestId('results-divider');
	await expect(divider).toHaveText('Other matches');
	const sortedDesc = (xs: number[]) => expect(xs).toEqual([...xs].sort((a, b) => b - a));
	await expect(async () => {
		const above = await divider.evaluate((d) => [...d.parentElement!.children].slice(0, [...d.parentElement!.children].indexOf(d)).map((e) => (e as HTMLElement).innerText));
		const below = await divider.evaluate((d) => [...d.parentElement!.children].slice([...d.parentElement!.children].indexOf(d) + 1, [...d.parentElement!.children].indexOf(d) + 11).map((e) => (e as HTMLElement).innerText));
		expect(above.length).toBeGreaterThan(0);
		sortedDesc(above.map(ifaces));
		sortedDesc(below.map(ifaces));
	}).toPass();

	// No divider without a sort.
	await page.getByRole('combobox', { name: 'Sort results' }).selectOption('best');
	await expect(divider).toHaveCount(0);
	await page.getByRole('combobox', { name: 'Sort results' }).selectOption('if-desc');
	await expect(page).toHaveURL(/sort=if-desc/);

	await page.reload();
	await expect(page.getByRole('combobox', { name: 'Sort results' })).toHaveValue('if-desc');
});

const C9300 = 'device-types/Cisco/C9300-48P.yaml';
const LIVE_YAML = `---
manufacturer: Cisco
model: Catalyst 9300-48P
slug: cisco-c9300-48p
u_height: 1
interfaces:
  - { name: Gi1/0/1, type: 1000base-t, poe_mode: pse, poe_type: type2-ieee802.3at }
  - { name: Gi1/0/2, type: 1000base-t, poe_mode: pse, poe_type: type2-ieee802.3at }
  - { name: Te1/1/1, type: 10gbase-x-sfpp }
  - { name: Gi0/0, type: 1000base-t, mgmt_only: true }
`;

test('types changed upstream are badged, and the panel breaks interfaces down by type', async ({ page }) => {
	// Registered after stubGitHub, so these win: the library is one commit ahead with C9300-48P modified.
	await page.route('https://api.github.com/repos/netbox-community/devicetype-library/compare/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				status: 'ahead',
				total_commits: 1,
				commits: [{ sha: 'livehead', commit: { committer: { date: '2026-11-01T00:00:00Z' } } }],
				files: [{ filename: C9300, status: 'modified' }]
			})
		})
	);
	await page.route(`https://raw.githubusercontent.com/netbox-community/devicetype-library/livehead/${C9300}`, (route) =>
		route.fulfill({ status: 200, contentType: 'text/plain', body: LIVE_YAML })
	);

	await page.goto('/?q=C9300-48P&kind=device');
	// The plain 48P, not the 48P-E listed above it.
	const row = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: /^Catalyst 9300-48P Cisco/ }) });
	await expect(row.getByTestId('changed-badge')).toHaveText('Updated');

	await row.getByRole('button', { name: /9300/ }).click();
	const panel = page.getByRole('dialog', { name: 'Device type details' });
	await expect(panel.getByTestId('changed-note')).toContainText('Changed in the library');
	const table = panel.getByTestId('port-breakdown');
	await expect(table.getByRole('row')).toHaveCount(3);
	await expect(table.getByRole('row').nth(1)).toContainText(/3\s*1000base-t\s*1G/);
	await expect(table.getByRole('row').nth(1)).toContainText('2 PoE, 1 mgmt');
	await expect(table.getByRole('row').nth(2)).toContainText('10gbase-x-sfpp');
});
