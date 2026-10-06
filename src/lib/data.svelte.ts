import { asset } from '$app/paths';
import { get, set } from 'idb-keyval';
import { fetchLive, type CacheStore, type LiveCache, type LiveStatus } from './live';
import type { IndexFile, IndexRecord } from './types';

const CACHE_KEY = 'dtf-live-v1';
const idbCache: CacheStore = {
	get: async () => get<LiveCache>(CACHE_KEY),
	set: async (v) => set(CACHE_KEY, v)
};

class DataStore {
	index = $state.raw<IndexFile | null>(null);
	error = $state<string | null>(null);
	live = $state<LiveStatus>({ state: 'checking' });
	byId = $derived(new Map<string, IndexRecord>((this.index?.records ?? []).map((r) => [r.id, r])));

	/** Commit SHA the displayed data corresponds to; used for raw YAML/image URLs. */
	get sha(): string {
		if (this.live.state === 'live' || this.live.state === 'current') return this.live.sha;
		return this.index?.meta.sha ?? 'master';
	}

	#loading: Promise<void> | null = null;

	load(): Promise<void> {
		return (this.#loading ??= this.#load());
	}

	async #load() {
		this.error = null;
		let baked: IndexFile;
		try {
			const res = await fetch(asset('data/index.json'));
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			baked = await res.json();
		} catch (e) {
			this.error = `Could not load the device type index (${(e as Error).message}).`;
			this.#loading = null;
			return;
		}
		this.index = baked;
		try {
			const { index, status } = await fetchLive(baked, { cache: idbCache });
			if (index !== baked) this.index = index;
			this.live = status;
		} catch (e) {
			console.warn('[live]', e);
			this.live = { state: 'stale', reason: 'unexpected error while checking for updates' };
		}
	}
}

export const data = new DataStore();
