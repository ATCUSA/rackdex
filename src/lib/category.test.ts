import { expect, test } from 'vitest';
import { inferCategory } from './category';

test('power outlets → pdu', () => {
	expect(inferCategory({ counts: { 'power-outlets': 24, interfaces: 1 }, uHeight: 0, dataIfaces: 1 })).toBe('pdu');
});

test('only front/rear ports → patch-panel', () => {
	expect(inferCategory({ counts: { 'front-ports': 24, 'rear-ports': 24 }, uHeight: 1, dataIfaces: 0 })).toBe('patch-panel');
});

test('bays with few interfaces → chassis', () => {
	expect(inferCategory({ counts: { 'module-bays': 8, interfaces: 2 }, uHeight: 10, dataIfaces: 1 })).toBe('chassis');
});

test('power ports and nothing else → power', () => {
	expect(inferCategory({ counts: { 'power-ports': 2 }, uHeight: 2, dataIfaces: 0 })).toBe('power');
});

test('8+ data interfaces → switch', () => {
	expect(inferCategory({ counts: { interfaces: 52, 'console-ports': 1 }, uHeight: 1, dataIfaces: 52 })).toBe('switch');
});

test('few interfaces, small, console → router-fw', () => {
	expect(inferCategory({ counts: { interfaces: 5, 'console-ports': 1 }, uHeight: 1, dataIfaces: 4 })).toBe('router-fw');
});

test('interfaces in a rack unit otherwise → server', () => {
	expect(inferCategory({ counts: { interfaces: 3, 'power-ports': 2 }, uHeight: 2, dataIfaces: 2 })).toBe('server');
});

test('nothing recognisable → other', () => {
	expect(inferCategory({ counts: {}, uHeight: 0, dataIfaces: 0 })).toBe('other');
	expect(inferCategory({ counts: { interfaces: 1 }, uHeight: 0, dataIfaces: 1 })).toBe('other');
});
