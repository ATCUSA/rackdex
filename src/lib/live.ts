import { compareUrl, rawUrl } from './github';
import { imageNames, isImagePath, kindFromPath, parseRecord, resolveImages } from './parse';
import type { IndexFile, IndexRecord, Kind } from './types';

export const MAX_FILES = 300;
export const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_CONCURRENCY = 8;

export interface FileChange {
	filename: string;
	status: string;
	previous_filename?: string;
}

export interface DeltaPlan {
	upserts: string[];
	removes: string[];
	imageAdds: string[];
	imageRemoves: string[];
}

export type LiveStatus =
	| { state: 'checking' }
	| { state: 'current'; sha: string; date: string }
	| { state: 'live'; sha: string; date: string; changes: number }
	| { state: 'stale'; reason: string };

export interface LiveCache {
	baseSha: string;
	headSha: string;
	headDate: string;
	checkedAt: number;
	plan: DeltaPlan;
	texts: Record<string, string>;
}

export interface CacheStore {
	get(): Promise<LiveCache | undefined>;
	set(v: LiveCache): Promise<void>;
}

const emptyPlan = (): DeltaPlan => ({ upserts: [], removes: [], imageAdds: [], imageRemoves: [] });
const planSize = (p: DeltaPlan) => p.upserts.length + p.removes.length + p.imageAdds.length + p.imageRemoves.length;

export function planDelta(files: FileChange[]): DeltaPlan {
	const plan = emptyPlan();
	const add = (path: string, removed: boolean) => {
		if (kindFromPath(path)) (removed ? plan.removes : plan.upserts).push(path);
		else if (isImagePath(path)) (removed ? plan.imageRemoves : plan.imageAdds).push(path);
	};
	for (const f of files) {
		if (f.status === 'renamed' && f.previous_filename) add(f.previous_filename, true);
		add(f.filename, f.status === 'removed');
	}
	return plan;
}

export function applyDelta(
	index: IndexFile,
	plan: DeltaPlan,
	texts: Record<string, string>
): { index: IndexFile; errors: string[] } {
	const images = new Set(index.imagePaths);
	for (const p of plan.imageRemoves) images.delete(p);
	for (const p of plan.imageAdds) images.add(p);

	const byId = new Map(index.records.map((r) => [r.id, r]));
	for (const id of plan.removes) byId.delete(id);

	const errors: string[] = [];
	for (const id of plan.upserts) {
		const text = texts[id];
		if (text === undefined) {
			errors.push(`${id}: not fetched`);
			continue;
		}
		try {
			byId.set(id, parseRecord(id, text, images));
		} catch (e) {
			errors.push((e as Error).message);
		}
	}

	let records: IndexRecord[] = [...byId.values()];
	if (plan.imageAdds.length || plan.imageRemoves.length) {
		records = records.map((r) => ({
			...r,
			images: resolveImages(r.kind, r.vendorDir, imageNames(r.slug, r.id), images)
		}));
	}
	const counts: Record<Kind, number> = { device: 0, module: 0, rack: 0 };
	for (const r of records) counts[r.kind]++;

	return {
		index: { meta: { ...index.meta, counts }, records, imagePaths: [...images].sort() },
		errors
	};
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
	let next = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) await fn(items[next++]);
	});
	await Promise.all(workers);
}

interface CompareBody {
	status: string;
	total_commits: number;
	commits?: { sha: string; commit: { committer: { date: string } } }[];
	files?: FileChange[];
}

export async function fetchLive(
	index: IndexFile,
	opts: { fetchFn?: typeof fetch; cache?: CacheStore; now?: () => number } = {}
): Promise<{ index: IndexFile; status: LiveStatus }> {
	const fetchFn = opts.fetchFn ?? fetch;
	const now = opts.now ?? Date.now;
	const base = index.meta.sha;

	const stale = (reason: string) => ({ index, status: { state: 'stale', reason } as LiveStatus });
	const finish = (plan: DeltaPlan, texts: Record<string, string>, sha: string, date: string) => {
		const changes = planSize(plan);
		if (changes === 0) return { index, status: { state: 'current', sha, date } as LiveStatus };
		const out = applyDelta(index, plan, texts);
		for (const e of out.errors) console.warn('[live]', e);
		return { index: out.index, status: { state: 'live', sha, date, changes } as LiveStatus };
	};

	const cached = await opts.cache?.get().catch(() => undefined);
	const usable = cached && cached.baseSha === base ? cached : undefined;
	if (usable && now() - usable.checkedAt < CACHE_TTL_MS) {
		return finish(usable.plan, usable.texts, usable.headSha, usable.headDate);
	}

	let res: Response;
	try {
		res = await fetchFn(compareUrl(base), { headers: { Accept: 'application/vnd.github+json' } });
	} catch {
		return stale('network error');
	}
	if (res.status === 403 || res.status === 429) return stale('GitHub rate limit reached');
	if (!res.ok) return stale(`GitHub responded ${res.status}`);
	const body = (await res.json().catch(() => null)) as CompareBody | null;
	if (!body) return stale('invalid response from GitHub');

	if (body.status === 'identical') {
		await opts.cache
			?.set({ baseSha: base, headSha: base, headDate: index.meta.date, checkedAt: now(), plan: emptyPlan(), texts: {} })
			.catch(() => {});
		return finish(emptyPlan(), {}, base, index.meta.date);
	}

	const commits = body.commits ?? [];
	if (body.status !== 'ahead' || commits.length === 0 || commits.length < body.total_commits) {
		return stale('too far behind upstream');
	}
	const files = body.files ?? [];
	if (files.length >= MAX_FILES) return stale('too many upstream changes');

	const head = commits[commits.length - 1];
	const headSha = head.sha;
	const headDate = head.commit.committer.date;
	const plan = planDelta(files);
	const texts: Record<string, string> = usable && usable.headSha === headSha ? { ...usable.texts } : {};

	try {
		await mapLimit(
			plan.upserts.filter((p) => texts[p] === undefined),
			FETCH_CONCURRENCY,
			async (p) => {
				const r = await fetchFn(rawUrl(headSha, p));
				if (!r.ok) throw new Error(`${p}: ${r.status}`);
				texts[p] = await r.text();
			}
		);
	} catch {
		return stale('could not fetch changed files');
	}

	await opts.cache?.set({ baseSha: base, headSha, headDate, checkedAt: now(), plan, texts }).catch(() => {});
	return finish(plan, texts, headSha, headDate);
}
