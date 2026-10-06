import { CATEGORIES } from './category';
import { emptyFilters, type Filters } from './filters';

export interface UrlState {
	q: string;
	filters: Filters;
	open?: string;
}

const LISTS = { kinds: 'kind', vendors: 'vendor', categories: 'cat', airflows: 'airflow', speeds: 'speed' } as const;
const NUMS = { uMin: 'umin', uMax: 'umax', ifMin: 'ifmin', ifMax: 'ifmax' } as const;
const BOOLS = { fullDepth: 'fulldepth', hasImage: 'image', poe: 'poe', console: 'console', power: 'power', bays: 'bays' } as const;

const VALID: Partial<Record<keyof typeof LISTS, readonly string[]>> = {
	kinds: ['device', 'module', 'rack'],
	categories: CATEGORIES
};

export function toParams(s: UrlState): URLSearchParams {
	const p = new URLSearchParams();
	if (s.q.trim()) p.set('q', s.q);
	for (const [key, param] of Object.entries(LISTS) as [keyof typeof LISTS, string][]) {
		for (const v of s.filters[key]) p.append(param, v);
	}
	for (const [key, param] of Object.entries(NUMS) as [keyof typeof NUMS, string][]) {
		const v = s.filters[key];
		if (v !== undefined) p.set(param, String(v));
	}
	for (const [key, param] of Object.entries(BOOLS) as [keyof typeof BOOLS, string][]) {
		const v = s.filters[key];
		if (v !== undefined) p.set(param, v ? '1' : '0');
	}
	if (s.open) p.set('open', s.open);
	return p;
}

export function fromParams(p: Pick<URLSearchParams, 'get' | 'getAll'>): UrlState {
	const filters = emptyFilters();
	for (const [key, param] of Object.entries(LISTS) as [keyof typeof LISTS, string][]) {
		const valid = VALID[key];
		filters[key] = p.getAll(param).filter((v) => v && (!valid || valid.includes(v)));
	}
	for (const [key, param] of Object.entries(NUMS) as [keyof typeof NUMS, string][]) {
		const raw = p.get(param);
		const n = raw === null || raw.trim() === '' ? NaN : Number(raw);
		if (Number.isFinite(n)) filters[key] = n;
	}
	for (const [key, param] of Object.entries(BOOLS) as [keyof typeof BOOLS, string][]) {
		const raw = p.get(param);
		if (raw === '1') filters[key] = true;
		else if (raw === '0') filters[key] = false;
	}
	const state: UrlState = { q: p.get('q') ?? '', filters };
	const open = p.get('open');
	if (open) state.open = open;
	return state;
}
