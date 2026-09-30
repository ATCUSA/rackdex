import Fuse, { type Expression, type IFuseOptions } from 'fuse.js';
import { facetCounts, matches, type Facets, type Filters } from './filters';
import type { IndexRecord } from './types';

export interface SearchResult {
	ids: string[];
	facets: Facets;
}

export type WorkerRequest =
	| { type: 'init'; records: IndexRecord[] }
	| { type: 'query'; id: number; q: string; filters: Filters };

export type WorkerResponse = { type: 'ready' } | ({ type: 'result'; id: number } & SearchResult);

const KEYS = [
	{ name: 'model', weight: 3 },
	{ name: 'partNumber', weight: 3 },
	{ name: 'slug', weight: 2 },
	{ name: 'vendor', weight: 2 },
	{ name: 'comments', weight: 0.5 }
];

const OPTIONS: IFuseOptions<IndexRecord> = {
	keys: KEYS,
	threshold: 0.35,
	ignoreLocation: true
};

const byName = (a: IndexRecord, b: IndexRecord) =>
	a.vendor.localeCompare(b.vendor) || a.model.localeCompare(b.model);

export function createSearch(records: IndexRecord[]) {
	const sorted = [...records].sort(byName);
	const fuse = new Fuse(sorted, OPTIONS);

	function find(query: string): IndexRecord[] {
		const tokens = query.split(/\s+/).filter(Boolean);
		if (tokens.length === 0) return sorted;
		if (tokens.length === 1) return fuse.search(tokens[0]).map((r) => r.item);
		const expr: Expression = {
			$and: tokens.map((t) => ({ $or: KEYS.map((k) => ({ [k.name]: t })) }))
		};
		return fuse.search(expr).map((r) => r.item);
	}

	return {
		run(q: string, f: Filters): SearchResult {
			const base = find(q.trim());
			return {
				ids: base.filter((r) => matches(r, f)).map((r) => r.id),
				facets: facetCounts(base, f)
			};
		}
	};
}
