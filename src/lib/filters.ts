import type { IndexRecord } from './types';

export interface Filters {
	kinds: string[];
	vendors: string[];
	categories: string[];
	airflows: string[];
	speeds: string[];
	uMin?: number;
	uMax?: number;
	ifMin?: number;
	ifMax?: number;
	fullDepth?: boolean;
	hasImage?: boolean;
	poe?: boolean;
	console?: boolean;
	power?: boolean;
	bays?: boolean;
}

export const FACET_KEYS = ['kinds', 'vendors', 'categories', 'airflows', 'speeds'] as const;
export type FacetKey = (typeof FACET_KEYS)[number];
export type Facets = Record<FacetKey, Record<string, number>>;

const SCALAR_KEYS = ['uMin', 'uMax', 'ifMin', 'ifMax', 'fullDepth', 'hasImage', 'poe', 'console', 'power', 'bays'] as const;

export const emptyFilters = (): Filters => ({ kinds: [], vendors: [], categories: [], airflows: [], speeds: [] });
export const emptyFacets = (): Facets => ({ kinds: {}, vendors: {}, categories: {}, airflows: {}, speeds: {} });

const inList = (list: string[], v: string | undefined) => list.length === 0 || (v !== undefined && list.includes(v));
const tri = (want: boolean | undefined, have: boolean) => want === undefined || want === have;

const facetValues: Record<FacetKey, (r: IndexRecord) => string[]> = {
	kinds: (r) => [r.kind],
	vendors: (r) => [r.vendor],
	categories: (r) => (r.category ? [r.category] : []),
	airflows: (r) => (r.airflow ? [r.airflow] : []),
	speeds: (r) => r.speeds
};

const facetMatch: Record<FacetKey, (r: IndexRecord, f: Filters) => boolean> = {
	kinds: (r, f) => inList(f.kinds, r.kind),
	vendors: (r, f) => inList(f.vendors, r.vendor),
	categories: (r, f) => inList(f.categories, r.category),
	airflows: (r, f) => inList(f.airflows, r.airflow),
	speeds: (r, f) => f.speeds.length === 0 || f.speeds.some((s) => r.speeds.includes(s))
};

function scalarMatch(r: IndexRecord, f: Filters): boolean {
	const c = r.counts;
	const u = r.uHeight;
	const ifs = c.interfaces ?? 0;
	if (f.uMin !== undefined && (u === undefined || u < f.uMin)) return false;
	if (f.uMax !== undefined && (u === undefined || u > f.uMax)) return false;
	if (f.ifMin !== undefined && ifs < f.ifMin) return false;
	if (f.ifMax !== undefined && ifs > f.ifMax) return false;
	return (
		tri(f.fullDepth, r.fullDepth === true) &&
		tri(f.hasImage, !!(r.images.front || r.images.rear)) &&
		tri(f.poe, r.poe) &&
		tri(f.console, (c['console-ports'] ?? 0) > 0) &&
		tri(f.power, (c['power-ports'] ?? 0) > 0) &&
		tri(f.bays, (c['device-bays'] ?? 0) + (c['module-bays'] ?? 0) > 0)
	);
}

export function matches(r: IndexRecord, f: Filters, skip?: FacetKey): boolean {
	if (!scalarMatch(r, f)) return false;
	for (const k of FACET_KEYS) if (k !== skip && !facetMatch[k](r, f)) return false;
	return true;
}

export const applyFilters = (records: IndexRecord[], f: Filters) => records.filter((r) => matches(r, f));

/** Counts per facet value, applying every filter except the facet itself. */
export function facetCounts(records: IndexRecord[], f: Filters): Facets {
	const out = emptyFacets();
	for (const k of FACET_KEYS) {
		const bucket = out[k];
		for (const r of records) {
			if (!matches(r, f, k)) continue;
			for (const v of facetValues[k](r)) bucket[v] = (bucket[v] ?? 0) + 1;
		}
	}
	return out;
}

export function activeFilterCount(f: Filters): number {
	let n = 0;
	for (const k of FACET_KEYS) n += f[k].length;
	for (const k of SCALAR_KEYS) if (f[k] !== undefined) n++;
	return n;
}
