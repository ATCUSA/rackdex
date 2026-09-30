import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { buildIndex, listTypeFiles } from './indexer';

const root = mkdtempSync(join(tmpdir(), 'dtf-'));
const put = (p: string, body: string) => {
	mkdirSync(join(root, p, '..'), { recursive: true });
	writeFileSync(join(root, p), body);
};
put('device-types/Cisco/a.yaml', 'manufacturer: Cisco\nmodel: A\nslug: cisco-a\n');
put('device-types/Cisco/broken.yaml', 'model: [oops');
put('device-types/Cisco/notes.md', '# ignore me');
put('module-types/Cisco/m.yml', 'manufacturer: Cisco\nmodel: M\n');
put('rack-types/APC/r.yaml', 'manufacturer: APC\nmodel: R\nu_height: 42\n');
put('README.md', 'x');

afterAll(() => rmSync(root, { recursive: true, force: true }));

test('listTypeFiles returns sorted yaml paths in type dirs only', () => {
	expect(listTypeFiles(root)).toEqual([
		'device-types/Cisco/a.yaml',
		'device-types/Cisco/broken.yaml',
		'module-types/Cisco/m.yml',
		'rack-types/APC/r.yaml'
	]);
});

test('buildIndex parses files, collects errors and counts kinds', () => {
	const { index, errors } = buildIndex(
		root,
		listTypeFiles(root),
		['elevation-images/Cisco/cisco-a.front.png'],
		{ sha: 'abc123', date: '2026-09-29T00:00:00Z' }
	);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('broken.yaml');
	expect(index.meta).toMatchObject({ sha: 'abc123', date: '2026-09-29T00:00:00Z', counts: { device: 1, module: 1, rack: 1 } });
	expect(index.records.map((r) => r.id)).toEqual([
		'device-types/Cisco/a.yaml',
		'module-types/Cisco/m.yml',
		'rack-types/APC/r.yaml'
	]);
	expect(index.records[0].images.front).toBe('elevation-images/Cisco/cisco-a.front.png');
	expect(index.imagePaths).toEqual(['elevation-images/Cisco/cisco-a.front.png']);
});
