import { expect, test } from 'vitest';
import { emptyFilters } from './filters';
import { fromParams, toParams } from './urlState';

test('round-trips full state', () => {
	const state = {
		q: 'c9300 48p',
		filters: {
			...emptyFilters(),
			kinds: ['device'],
			vendors: ['Cisco', 'Hewlett Packard Enterprise'],
			categories: ['switch'],
			airflows: ['front-to-rear'],
			speeds: ['10G'],
			uMin: 1,
			uMax: 2,
			ifMin: 24,
			poe: true,
			fullDepth: false
		},
		open: 'device-types/Cisco/C9300-48P.yaml'
	};
	expect(fromParams(toParams(state))).toEqual(state);
});

test('empty state produces empty query string', () => {
	expect(toParams({ q: '', filters: emptyFilters() }).toString()).toBe('');
	expect(fromParams(new URLSearchParams())).toEqual({ q: '', filters: emptyFilters() });
});

test('drops invalid kinds, categories and numbers', () => {
	const s = fromParams(new URLSearchParams('kind=device&kind=bogus&cat=nope&cat=pdu&umin=abc&ifmax=8'));
	expect(s.filters.kinds).toEqual(['device']);
	expect(s.filters.categories).toEqual(['pdu']);
	expect(s.filters.uMin).toBeUndefined();
	expect(s.filters.ifMax).toBe(8);
});
