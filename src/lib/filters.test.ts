import { expect, test } from 'vitest';
import { activeFilterCount, applyFilters, emptyFilters, facetCounts, matches } from './filters';
import type { IndexRecord } from './types';

const rec = (over: Partial<IndexRecord>): IndexRecord => ({
	id: over.id ?? 'device-types/X/x.yaml',
	kind: 'device',
	vendor: 'X',
	vendorDir: 'X',
	model: 'x',
	images: {},
	counts: {},
	speeds: [],
	poe: false,
	...over
});

const sw = rec({ id: 'a', vendor: 'Cisco', category: 'switch', uHeight: 1, fullDepth: true, airflow: 'front-to-rear', speeds: ['1G', '10G'], poe: true, counts: { interfaces: 52, 'console-ports': 1, 'power-ports': 2 }, images: { front: 'f' } });
const pdu = rec({ id: 'b', vendor: 'APC', category: 'pdu', uHeight: 0, counts: { 'power-outlets': 24, interfaces: 1 }, speeds: ['100M'] });
const mod = rec({ id: 'c', kind: 'module', vendor: 'Cisco', counts: { interfaces: 16 }, speeds: ['100G'] });
const all = [sw, pdu, mod];

test('empty filters match everything', () => {
	expect(applyFilters(all, emptyFilters())).toEqual(all);
	expect(activeFilterCount(emptyFilters())).toBe(0);
});

test('list facets are OR within, AND across', () => {
	const f = { ...emptyFilters(), vendors: ['Cisco', 'APC'], kinds: ['device'] };
	expect(applyFilters(all, f).map((r) => r.id)).toEqual(['a', 'b']);
	expect(applyFilters(all, { ...emptyFilters(), speeds: ['10G', '100G'] }).map((r) => r.id)).toEqual(['a', 'c']);
});

test('ranges exclude records without a value', () => {
	expect(applyFilters(all, { ...emptyFilters(), uMin: 1 }).map((r) => r.id)).toEqual(['a']);
	expect(applyFilters(all, { ...emptyFilters(), uMax: 0 }).map((r) => r.id)).toEqual(['b']);
	expect(applyFilters(all, { ...emptyFilters(), ifMin: 10, ifMax: 20 }).map((r) => r.id)).toEqual(['c']);
});

test('tri-state booleans', () => {
	expect(applyFilters(all, { ...emptyFilters(), poe: true }).map((r) => r.id)).toEqual(['a']);
	expect(applyFilters(all, { ...emptyFilters(), poe: false }).map((r) => r.id)).toEqual(['b', 'c']);
	expect(applyFilters(all, { ...emptyFilters(), hasImage: true }).map((r) => r.id)).toEqual(['a']);
	expect(applyFilters(all, { ...emptyFilters(), console: true, power: true, fullDepth: true }).map((r) => r.id)).toEqual(['a']);
});

test('matches can skip one facet', () => {
	const f = { ...emptyFilters(), vendors: ['APC'] };
	expect(matches(sw, f)).toBe(false);
	expect(matches(sw, f, 'vendors')).toBe(true);
});

test('facetCounts ignore their own facet but apply the others', () => {
	const f = { ...emptyFilters(), vendors: ['Cisco'] };
	const facets = facetCounts(all, f);
	expect(facets.vendors).toEqual({ Cisco: 2, APC: 1 });
	expect(facets.kinds).toEqual({ device: 1, module: 1 });
	expect(facets.speeds).toEqual({ '1G': 1, '10G': 1, '100G': 1 });
	expect(facets.categories).toEqual({ switch: 1 });
});

test('activeFilterCount counts each selected value and each set scalar', () => {
	expect(activeFilterCount({ ...emptyFilters(), vendors: ['a', 'b'], uMin: 1, poe: false })).toBe(4);
});
