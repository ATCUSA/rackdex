import { expect, test } from 'vitest';
import { rawUrl } from './github';
import { combineYaml, fetchYaml, manufacturerCsv, manufacturerSlug, stripDocMarkers, yamlFilename } from './yamlExport';

test('stripDocMarkers removes leading --- and trailing ...', () => {
	expect(stripDocMarkers('---\nmodel: a\n')).toBe('model: a');
	expect(stripDocMarkers('﻿---\r\nmodel: a\n...\n')).toBe('model: a');
	expect(stripDocMarkers('model: a')).toBe('model: a');
});

test('combineYaml joins documents with --- separators', () => {
	expect(combineYaml(['---\nmodel: a\n', 'model: b'])).toBe('---\nmodel: a\n---\nmodel: b\n');
	expect(combineYaml([])).toBe('');
});

test('manufacturerSlug mirrors Django slugify', () => {
	expect(manufacturerSlug('Cisco')).toBe('cisco');
	expect(manufacturerSlug('Hewlett Packard Enterprise')).toBe('hewlett-packard-enterprise');
	expect(manufacturerSlug('Rohde & Schwarz')).toBe('rohde-schwarz');
	expect(manufacturerSlug('Ubiquiti Networks, Inc.')).toBe('ubiquiti-networks-inc');
	expect(manufacturerSlug('Gigabyte Technology Co. Ltd.')).toBe('gigabyte-technology-co-ltd');
	expect(manufacturerSlug('Télécom')).toBe('telecom');
});

test('manufacturerCsv dedupes, sorts and quotes', () => {
	expect(manufacturerCsv(['Cisco', 'APC', 'Cisco', 'Acme, Inc.'])).toBe(
		'name,slug\n"Acme, Inc.",acme-inc\nAPC,apc\nCisco,cisco\n'
	);
});

test('manufacturerCsv quotes a bare carriage return too, not just \\n', () => {
	expect(manufacturerCsv(['Acme\rCorp'])).toBe('name,slug\n"Acme\rCorp",acme-corp\n');
});

test('yamlFilename', () => {
	expect(yamlFilename('device-types/Cisco/C9300-48P.yaml')).toBe('C9300-48P.yaml');
});

test('rawUrl encodes path segments', () => {
	expect(rawUrl('abc', 'device-types/Check Point/x.yaml')).toBe(
		'https://raw.githubusercontent.com/netbox-community/devicetype-library/abc/device-types/Check%20Point/x.yaml'
	);
});

test('fetchYaml returns text or throws', async () => {
	const ok = (async () => new Response('model: a')) as unknown as typeof fetch;
	const bad = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch;
	await expect(fetchYaml('abc', 'device-types/A/a.yaml', ok)).resolves.toBe('model: a');
	await expect(fetchYaml('abc', 'device-types/A/a.yaml', bad)).rejects.toThrow('404');
});
