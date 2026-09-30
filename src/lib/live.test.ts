import { describe, expect, test } from 'vitest';
import { applyDelta, CACHE_TTL_MS, fetchLive, planDelta, type CacheStore, type LiveCache } from './live';
import { parseRecord } from './parse';
import type { IndexFile } from './types';

const A = 'device-types/Cisco/a.yaml';
const B = 'device-types/Cisco/b.yaml';
const baked = (): IndexFile => {
	const images = new Set<string>();
	return {
		meta: { sha: 'base', date: '2026-09-01T00:00:00Z', builtAt: 'x', counts: { device: 2, module: 0, rack: 0 } },
		records: [
			parseRecord(A, 'manufacturer: Cisco\nmodel: A\nslug: cisco-a\n', images),
			parseRecord(B, 'manufacturer: Cisco\nmodel: B\n', images)
		],
		imagePaths: []
	};
};

describe('planDelta', () => {
	test('classifies type and image changes, including renames', () => {
		expect(
			planDelta([
				{ filename: A, status: 'modified' },
				{ filename: B, status: 'removed' },
				{ filename: 'device-types/Cisco/c.yaml', status: 'renamed', previous_filename: 'device-types/Cisco/old.yaml' },
				{ filename: 'elevation-images/Cisco/cisco-a.front.png', status: 'added' },
				{ filename: 'elevation-images/Cisco/gone.rear.png', status: 'removed' },
				{ filename: 'README.md', status: 'modified' }
			])
		).toEqual({
			upserts: [A, 'device-types/Cisco/c.yaml'],
			removes: [B, 'device-types/Cisco/old.yaml'],
			imageAdds: ['elevation-images/Cisco/cisco-a.front.png'],
			imageRemoves: ['elevation-images/Cisco/gone.rear.png']
		});
	});
});

describe('applyDelta', () => {
	test('upserts, removes and re-resolves images', () => {
		const plan = { upserts: [A, 'module-types/Cisco/m.yaml'], removes: [B], imageAdds: ['elevation-images/Cisco/cisco-a.front.png'], imageRemoves: [] };
		const { index, errors } = applyDelta(baked(), plan, {
			[A]: 'manufacturer: Cisco\nmodel: A2\nslug: cisco-a\n',
			'module-types/Cisco/m.yaml': 'manufacturer: Cisco\nmodel: M\n'
		});
		expect(errors).toEqual([]);
		expect(index.records.map((r) => [r.id, r.model])).toEqual([
			[A, 'A2'],
			['module-types/Cisco/m.yaml', 'M']
		]);
		expect(index.records[0].images.front).toBe('elevation-images/Cisco/cisco-a.front.png');
		expect(index.meta).toMatchObject({ sha: 'base', counts: { device: 1, module: 1, rack: 0 } });
		expect(index.imagePaths).toEqual(['elevation-images/Cisco/cisco-a.front.png']);
	});

	test('reports unparseable or missing texts and keeps the old record', () => {
		const { index, errors } = applyDelta(baked(), { upserts: [A, B], removes: [], imageAdds: [], imageRemoves: [] }, { [A]: 'model: [bad' });
		expect(errors).toHaveLength(2);
		expect(index.records.map((r) => r.model)).toEqual(['A', 'B']);
	});
});

type Handler = (url: string) => Response;
const fakeFetch = (handler: Handler) => {
	const calls: string[] = [];
	const fn = (async (input: RequestInfo | URL) => {
		const url = String(input);
		calls.push(url);
		return handler(url);
	}) as typeof fetch;
	return { fn, calls };
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const memCache = (initial?: LiveCache): CacheStore & { value?: LiveCache } => {
	const c: CacheStore & { value?: LiveCache } = {
		value: initial,
		get: async () => c.value,
		set: async (v) => void (c.value = v)
	};
	return c;
};

const aheadBody = {
	status: 'ahead',
	total_commits: 1,
	commits: [{ sha: 'head1', commit: { committer: { date: '2026-09-29T00:00:00Z' } } }],
	files: [{ filename: A, status: 'modified' }]
};

describe('fetchLive', () => {
	test('identical → current, cached', async () => {
		const cache = memCache();
		const { fn } = fakeFetch(() => json({ status: 'identical', total_commits: 0, commits: [], files: [] }));
		const out = await fetchLive(baked(), { fetchFn: fn, cache, now: () => 1000 });
		expect(out.status).toEqual({ state: 'current', sha: 'base', date: '2026-09-01T00:00:00Z' });
		expect(cache.value?.headSha).toBe('base');
	});

	test('ahead → fetches changed files from head sha and applies them', async () => {
		const cache = memCache();
		const { fn, calls } = fakeFetch((url) =>
			url.includes('api.github.com') ? json(aheadBody) : new Response('manufacturer: Cisco\nmodel: A-live\n')
		);
		const out = await fetchLive(baked(), { fetchFn: fn, cache, now: () => 1000 });
		expect(out.status).toEqual({ state: 'live', sha: 'head1', date: '2026-09-29T00:00:00Z', changes: 1 });
		expect(out.index.records.find((r) => r.id === A)?.model).toBe('A-live');
		expect(calls[1]).toBe('https://raw.githubusercontent.com/netbox-community/devicetype-library/head1/device-types/Cisco/a.yaml');
		expect(cache.value?.texts[A]).toContain('A-live');
	});

	test('fresh cache skips the network entirely', async () => {
		const cache = memCache({ baseSha: 'base', headSha: 'head1', headDate: 'd', checkedAt: 1000, plan: { upserts: [A], removes: [], imageAdds: [], imageRemoves: [] }, texts: { [A]: 'model: Cached\n' } });
		const { fn, calls } = fakeFetch(() => {
			throw new Error('should not fetch');
		});
		const out = await fetchLive(baked(), { fetchFn: fn, cache, now: () => 1000 + CACHE_TTL_MS - 1 });
		expect(calls).toEqual([]);
		expect(out.status).toMatchObject({ state: 'live', sha: 'head1' });
		expect(out.index.records.find((r) => r.id === A)?.model).toBe('Cached');
	});

	test('expired cache with same head reuses fetched texts', async () => {
		const cache = memCache({ baseSha: 'base', headSha: 'head1', headDate: 'd', checkedAt: 0, plan: { upserts: [A], removes: [], imageAdds: [], imageRemoves: [] }, texts: { [A]: 'model: Cached\n' } });
		const { fn, calls } = fakeFetch(() => json(aheadBody));
		await fetchLive(baked(), { fetchFn: fn, cache, now: () => CACHE_TTL_MS * 2 });
		expect(calls).toHaveLength(1);
	});

	test.each([
		['rate limited', () => json({ message: 'rate limit' }, 403), 'GitHub rate limit reached'],
		['server error', () => json({}, 500), 'GitHub responded 500'],
		['too many files', () => json({ ...aheadBody, files: Array.from({ length: 300 }, (_, i) => ({ filename: `device-types/X/${i}.yaml`, status: 'added' })) }), 'too many upstream changes'],
		['too many commits', () => json({ ...aheadBody, total_commits: 500 }), 'too far behind upstream'],
		['diverged', () => json({ ...aheadBody, status: 'diverged' }), 'too far behind upstream'],
		['network error', () => { throw new TypeError('offline'); }, 'network error']
	])('%s → stale with baked index', async (_, handler, reason) => {
		const index = baked();
		const { fn } = fakeFetch(handler as Handler);
		const out = await fetchLive(index, { fetchFn: fn, cache: memCache(), now: () => 1 });
		expect(out.status).toEqual({ state: 'stale', reason });
		expect(out.index).toBe(index);
	});

	test('raw fetch failure → stale', async () => {
		const { fn } = fakeFetch((url) => (url.includes('api.github.com') ? json(aheadBody) : new Response('x', { status: 404 })));
		const out = await fetchLive(baked(), { fetchFn: fn, cache: memCache(), now: () => 1 });
		expect(out.status).toEqual({ state: 'stale', reason: 'could not fetch changed files' });
	});
});
