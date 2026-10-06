import { describe, expect, it, vi } from 'vitest';
import { fetchStars, STARS_TTL_MS } from './stars';

function memoryStorage(init: Record<string, string> = {}) {
	const data = { ...init };
	return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v), data };
}
const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe('fetchStars', () => {
	it('fetches the count and caches it', async () => {
		const storage = memoryStorage();
		const fetchFn = vi.fn(() => ok({ stargazers_count: 12 }));
		expect(await fetchStars({ fetchFn, storage, now: () => 1000 })).toBe(12);
		expect(JSON.parse(storage.data['rackdex-stars'])).toEqual({ count: 12, checkedAt: 1000 });
	});

	it('uses a fresh cache without calling GitHub', async () => {
		const storage = memoryStorage({ 'rackdex-stars': JSON.stringify({ count: 7, checkedAt: 0 }) });
		const fetchFn = vi.fn(() => ok({ stargazers_count: 99 }));
		expect(await fetchStars({ fetchFn, storage, now: () => STARS_TTL_MS - 1 })).toBe(7);
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('refreshes an expired cache', async () => {
		const storage = memoryStorage({ 'rackdex-stars': JSON.stringify({ count: 7, checkedAt: 0 }) });
		const fetchFn = vi.fn(() => ok({ stargazers_count: 8 }));
		expect(await fetchStars({ fetchFn, storage, now: () => STARS_TTL_MS + 1 })).toBe(8);
	});

	it('falls back to an expired cache when GitHub fails', async () => {
		const storage = memoryStorage({ 'rackdex-stars': JSON.stringify({ count: 7, checkedAt: 0 }) });
		const fetchFn = vi.fn(() => Promise.resolve(new Response('', { status: 403 })));
		expect(await fetchStars({ fetchFn, storage, now: () => STARS_TTL_MS + 1 })).toBe(7);
	});

	it('returns null with no cache and no usable response', async () => {
		expect(await fetchStars({ fetchFn: () => Promise.reject(new Error('offline')) })).toBeNull();
		expect(await fetchStars({ fetchFn: () => ok({ message: 'Not Found' }) })).toBeNull();
	});
});
