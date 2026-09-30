import { expect, test } from 'vitest';
import { emptyFilters } from './filters';
import { createSearch } from './search';
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
