import Fuse, { type Expression, type IFuseOptions } from 'fuse.js';
import { facetCounts, matches, type Facets, type Filters } from './filters';
import type { Sort } from './sort';
import type { IndexRecord } from './types';

export interface SearchResult {
	ids: string[];
	/** When a sort split the results into close and loose matches: how many close ones lead the list. */
	split?: number;
	facets: Facets;
}

export type WorkerRequest =
	| { type: 'init'; id: number; records: IndexRecord[] }
	| { type: 'query'; id: number; q: string; filters: Filters; sort?: Sort };

export type WorkerResponse = { type: 'ready'; id: number } | ({ type: 'result'; id: number } & SearchResult);

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
	ignoreLocation: true,
	includeScore: true
};

/** Fuse scores at or below this are near-exact (the part number typed in full, for instance). */
const STRONG_SCORE = 0.1;

const byName = (a: IndexRecord, b: IndexRecord) =>
	a.vendor.localeCompare(b.vendor) || a.model.localeCompare(b.model);

/** Compare by a numeric field; records without it go last in both directions. */
const byNumber = (get: (r: IndexRecord) => number | undefined, dir: 1 | -1) => (a: IndexRecord, b: IndexRecord) => {
	const x = get(a);
	const y = get(b);
	if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? 1 : -1;
	return (x - y) * dir;
};

const LITERAL_FIELDS = ['model', 'partNumber', 'slug', 'vendor'] as const;
/** Every token appears as-is (case-insensitive) in one of the main fields. */
const isLiteral = (r: IndexRecord, tokens: string[]) =>
	tokens.every((t) => LITERAL_FIELDS.some((k) => r[k]?.toLowerCase().includes(t)));

const COMPARATORS: Record<Exclude<Sort, 'best'>, (a: IndexRecord, b: IndexRecord) => number> = {
	name: byName,
	'u-asc': byNumber((r) => r.uHeight, 1),
	'u-desc': byNumber((r) => r.uHeight, -1),
	'if-desc': byNumber((r) => r.counts.interfaces, -1),
	'if-asc': byNumber((r) => r.counts.interfaces, 1)
};

export function createSearch(records: IndexRecord[]) {
	const sorted = [...records].sort(byName);
	const fuse = new Fuse(sorted, OPTIONS);

	/** Matches in relevance order, plus the ones that are strong (near-exact or literal) matches. */
	function find(query: string): { items: IndexRecord[]; strong: Set<IndexRecord> } {
		const tokens = query.split(/\s+/).filter(Boolean);
		if (tokens.length === 0) return { items: sorted, strong: new Set() };
		const expr: string | Expression =
			tokens.length === 1 ? tokens[0] : { $and: tokens.map((t) => ({ $or: KEYS.map((k) => ({ [k.name]: t })) })) };
		const results = fuse.search(expr);
		const lower = tokens.map((t) => t.toLowerCase());
		const strong = new Set(
			results.filter((r) => (r.score ?? 1) <= STRONG_SCORE || isLiteral(r.item, lower)).map((r) => r.item)
		);
		return { items: results.map((r) => r.item), strong };
	}

	return {
		/** 'best' is relevance with a query and name order without one; other sorts keep that order for ties. */
		run(q: string, f: Filters, sort: Sort = 'best'): SearchResult {
			const { items: base, strong } = find(q.trim());
			let hits = base.filter((r) => matches(r, f));
			let split: number | undefined;
			if (sort !== 'best') {
				hits.sort(COMPARATORS[sort]);
				// Fuzzy matching lets in loose hits (EX2300-48MP for "C9300-48P"), and a sort by size would put
				// them first. Keep strong matches on top, each group sorted, so the count doesn't change.
				if (strong.size) {
					const top = hits.filter((r) => strong.has(r));
					if (top.length && top.length < hits.length) {
						hits = [...top, ...hits.filter((r) => !strong.has(r))];
						split = top.length;
					}
				}
			}
			return {
				ids: hits.map((r) => r.id),
				split,
				facets: facetCounts(base, f)
			};
		}
	};
}
