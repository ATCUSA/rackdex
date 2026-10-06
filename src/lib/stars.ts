import { SITE_REPO_API_URL } from './github';

const KEY = 'rackdex-stars';
export const STARS_TTL_MS = 60 * 60 * 1000;

type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };
interface Cached {
	count: number;
	checkedAt: number;
}

export function defaultStorage(): Storage | undefined {
	try {
		return typeof localStorage === 'undefined' ? undefined : localStorage;
	} catch {
		return undefined;
	}
}

function readCache(storage: Storage | undefined): Cached | undefined {
	try {
		const c = JSON.parse(storage?.getItem(KEY) ?? 'null') as Cached | null;
		return c && typeof c.count === 'number' && typeof c.checkedAt === 'number' ? c : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Star count for the RackDex repo, cached for an hour. Falls back to an older cached value if GitHub
 * can't be reached, and returns null if there is nothing to show.
 */
export async function fetchStars(
	opts: { fetchFn?: typeof fetch; storage?: Storage; now?: () => number } = {}
): Promise<number | null> {
	const { fetchFn = fetch, storage, now = Date.now } = opts;
	const cached = readCache(storage);
	if (cached && now() - cached.checkedAt < STARS_TTL_MS) return cached.count;

	try {
		const res = await fetchFn(SITE_REPO_API_URL, { headers: { Accept: 'application/vnd.github+json' } });
		if (!res.ok) return cached?.count ?? null;
		const body = (await res.json()) as { stargazers_count?: unknown };
		if (typeof body.stargazers_count !== 'number') return cached?.count ?? null;
		try {
			storage?.setItem(KEY, JSON.stringify({ count: body.stargazers_count, checkedAt: now() }));
		} catch {
			// storage full or blocked; the count still shows for this visit
		}
		return body.stargazers_count;
	} catch {
		return cached?.count ?? null;
	}
}
