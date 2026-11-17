import { describe, expect, test } from 'vitest';
import { emptyFilters } from './filters';
import { createSearch } from './search';
import type { Sort } from './sort';
import type { IndexRecord } from './types';

const rec = (id: string, vendor: string, model: string, partNumber?: string, kind: IndexRecord['kind'] = 'device'): IndexRecord => ({
	id, kind, vendor, vendorDir: vendor, model, partNumber, images: {}, counts: {}, speeds: [], poe: false
});

const records = [
	rec('3', 'Juniper', 'EX4300-48P', 'EX4300-48P'),
	rec('1', 'Cisco', 'Catalyst 9300-48P', 'C9300-48P'),
	rec('2', 'Cisco', 'Catalyst 9200-24T', 'C9200-24T'),
	rec('4', 'Arista', 'DCS-7050SX3-48YC8', 'DCS-7050SX3-48YC8'),
	rec('5', 'Cisco', 'C9300-NM-8X', 'C9300-NM-8X', 'module')
];
const engine = createSearch(records);

test('empty query returns all sorted by vendor then model', () => {
	expect(engine.run('', emptyFilters()).ids).toEqual(['4', '5', '2', '1', '3']);
});

test('exact part number ranks first', () => {
	expect(engine.run('C9300-48P', emptyFilters()).ids[0]).toBe('1');
});

test('fuzzy tolerates typos', () => {
	expect(engine.run('catalist 9300', emptyFilters()).ids).toContain('1');
});

test('multi-word queries AND tokens across fields', () => {
	const ids = engine.run('cisco 9300', emptyFilters()).ids;
	expect(ids).toContain('1');
	expect(ids).not.toContain('3');
	expect(ids).not.toContain('4');
});

test('filters apply to query results and facets reflect the query', () => {
	const res = engine.run('9300', { ...emptyFilters(), kinds: ['module'] });
	expect(res.ids).toEqual(['5']);
	// kinds facet ignores the kind filter, so devices matching '9300' are still counted
	expect(res.facets.kinds.module).toBe(1);
	expect(res.facets.kinds.device).toBeGreaterThanOrEqual(1);
});

describe('sorting', () => {
	const sized = [
		{ ...rec('a', 'Cisco', 'A'), uHeight: 2, counts: { interfaces: 10 } },
		{ ...rec('b', 'Arista', 'B'), uHeight: 1, counts: { interfaces: 52 } },
		{ ...rec('c', 'Dell', 'C') },
		{ ...rec('d', 'Cisco', 'D'), uHeight: 1, counts: { interfaces: 4 } }
	];
	const e = createSearch(sized);
	const ids = (sort: Sort) => e.run('', emptyFilters(), sort).ids;

	test('best and name keep vendor/model order with no query', () => {
		expect(ids('best')).toEqual(['b', 'a', 'd', 'c']);
		expect(ids('name')).toEqual(['b', 'a', 'd', 'c']);
	});

	test('numeric sorts put missing values last in both directions, ties keep name order', () => {
		expect(ids('u-asc')).toEqual(['b', 'd', 'a', 'c']);
		expect(ids('u-desc')).toEqual(['a', 'b', 'd', 'c']);
		expect(ids('if-desc')).toEqual(['b', 'a', 'd', 'c']);
		expect(ids('if-asc')).toEqual(['d', 'a', 'b', 'c']);
	});

	test('with a query, literal matches stay above fuzzy-only ones', () => {
		const e2 = createSearch([
			{ ...rec('big', 'Juniper', 'EX2300-48MP'), counts: { interfaces: 60 } },
			{ ...rec('hit', 'Cisco', 'Catalyst 9300-48P', 'C9300-48P'), counts: { interfaces: 52 } },
			{ ...rec('hit2', 'Cisco', 'Catalyst 9300-48P-E', 'C9300-48P-E'), counts: { interfaces: 54 } }
		]);
		const res = e2.run('C9300-48P', emptyFilters(), 'if-desc').ids;
		expect(res.slice(0, 2)).toEqual(['hit2', 'hit']);
	});

	test('sorting a query result reorders only the matches', () => {
		expect(e.run('cisco', emptyFilters(), 'if-asc').ids).toEqual(['d', 'a']);
	});
});
