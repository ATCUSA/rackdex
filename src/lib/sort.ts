// Kept apart from search.ts so the main bundle can use these without pulling in Fuse.
export const SORTS = ['best', 'name', 'u-asc', 'u-desc', 'if-desc', 'if-asc'] as const;
export type Sort = (typeof SORTS)[number];
/** 'best' is relevance with a query; with no query it is the same as name order. */
export const SORT_LABELS: Record<Sort, string> = {
	best: 'Best match',
	name: 'Name (A–Z)',
	'u-asc': 'Height (low–high)',
	'u-desc': 'Height (high–low)',
	'if-desc': 'Most interfaces',
	'if-asc': 'Fewest interfaces'
};
