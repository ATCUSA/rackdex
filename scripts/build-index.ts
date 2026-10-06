import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, listTypeFiles, TYPE_DIRS } from './indexer';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CACHE = join(ROOT, '.cache', 'devicetype-library');
const OUT = join(ROOT, 'static', 'data', 'index.json');
const REPO = 'https://github.com/netbox-community/devicetype-library.git';
const REF = process.env.DTL_REF ?? 'master';
const MAX_BYTES = 20 * 1024 * 1024;

if (process.argv.includes('--if-missing') && existsSync(OUT)) {
	console.log(`[index] ${OUT} exists, skipping (run "pnpm index" to refresh)`);
	process.exit(0);
}

const git = (args: string[], cwd = CACHE) =>
	execFileSync('git', args, {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'inherit'],
		maxBuffer: 256 * 1024 * 1024
	}).trim();

if (!existsSync(join(CACHE, '.git'))) {
	console.log('[index] cloning library (YAML only)…');
	mkdirSync(dirname(CACHE), { recursive: true });
	git(['clone', '--filter=blob:none', '--no-checkout', '--depth', '1', REPO, CACHE], ROOT);
}
// Cheap even when already set, and keeps the checkout scoped to the type dirs if TYPE_DIRS
// ever changes on an existing cache instead of only on first clone.
git(['sparse-checkout', 'set', ...TYPE_DIRS]);
console.log(`[index] fetching ${REF}…`);
git(['fetch', '--depth', '1', '--filter=blob:none', 'origin', REF]);
git(['checkout', '--force', '--detach', 'FETCH_HEAD']);

const sha = git(['rev-parse', 'HEAD']);
const date = git(['log', '-1', '--format=%cI']);
const imagePaths = git(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'elevation-images', 'module-images'])
	.split('\n')
	.filter(Boolean);

const files = listTypeFiles(CACHE);
const { index, errors } = buildIndex(CACHE, files, imagePaths, { sha, date });

for (const e of errors) console.warn(`[index] skipped ${e}`);
if (errors.length > files.length * 0.01) {
	console.error(`[index] ${errors.length}/${files.length} files failed to parse — aborting`);
	process.exit(1);
}

const json = JSON.stringify(index);
const byteLength = Buffer.byteLength(json);
if (byteLength > MAX_BYTES) {
	console.error(`[index] index.json would be ${(byteLength / 1e6).toFixed(1)} MB (> 20 MB limit) — not writing`);
	process.exit(1);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, json);
// Small summary for the README's "library synced" badge, so shields.io doesn't have to fetch the full index.
const { sha: metaSha, date: metaDate, counts } = index.meta;
writeFileSync(
	join(dirname(OUT), 'meta.json'),
	JSON.stringify({ sha: metaSha, date: metaDate, synced: metaDate.slice(0, 10), counts })
);
const size = statSync(OUT).size;
const c = index.meta.counts;
console.log(
	`[index] ${sha.slice(0, 7)} (${date}): ${c.device} device, ${c.module} module, ${c.rack} rack types, ` +
		`${imagePaths.length} images, ${(size / 1e6).toFixed(1)} MB`
);
