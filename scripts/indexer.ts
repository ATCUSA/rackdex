import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRecord } from '../src/lib/parse';
import type { IndexFile, IndexRecord, Kind } from '../src/lib/types';

export const TYPE_DIRS = ['device-types', 'module-types', 'rack-types'];

export function listTypeFiles(root: string): string[] {
	const out: string[] = [];
	for (const top of TYPE_DIRS) {
		const topPath = join(root, top);
		if (!existsSync(topPath)) continue;
		for (const vendor of readdirSync(topPath, { withFileTypes: true })) {
			if (!vendor.isDirectory()) continue;
			for (const f of readdirSync(join(topPath, vendor.name), { withFileTypes: true })) {
				if (f.isFile() && /\.ya?ml$/i.test(f.name)) out.push(`${top}/${vendor.name}/${f.name}`);
			}
		}
	}
	return out.sort();
}

export function buildIndex(
	root: string,
	files: string[],
	imagePaths: string[],
	meta: { sha: string; date: string }
): { index: IndexFile; errors: string[] } {
	const images = new Set(imagePaths);
	const records: IndexRecord[] = [];
	const errors: string[] = [];
	for (const f of files) {
		try {
			records.push(parseRecord(f, readFileSync(join(root, f), 'utf8'), images));
		} catch (e) {
			errors.push((e as Error).message);
		}
	}
	const counts: Record<Kind, number> = { device: 0, module: 0, rack: 0 };
	for (const r of records) counts[r.kind]++;
	return {
		index: {
			meta: { sha: meta.sha, date: meta.date, builtAt: new Date().toISOString(), counts },
			records,
			imagePaths: [...imagePaths].sort()
		},
		errors
	};
}
