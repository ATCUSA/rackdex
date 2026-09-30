import type { Filters } from './filters';
import type { SearchResult, WorkerRequest, WorkerResponse } from './search';
import type { IndexRecord } from './types';

export class SearchClient {
	#worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
	#querySeq = 0;
	#pending = new Map<number, (r: SearchResult | null) => void>();
	#initSeq = 0;
	#initResolvers = new Map<number, () => void>();
	// null until init() is first called, so query() can tell "never initialised" apart from
	// "still initialising" without hanging on a promise that will never resolve.
	#ready: Promise<void> | null = null;
	#failed = false;

	/** Called once if the worker crashes (e.g. fails to start). */
	onerror: (() => void) | null = null;

	constructor() {
		this.#worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
			const msg = e.data;
			if (msg.type === 'ready') {
				// Resolve only the init() call this ready message belongs to, so an older init's
				// promise isn't left orphaned if a newer init() superseded it in the meantime.
				const resolve = this.#initResolvers.get(msg.id);
				this.#initResolvers.delete(msg.id);
				resolve?.();
				return;
			}
			const resolve = this.#pending.get(msg.id);
			this.#pending.delete(msg.id);
			resolve?.(msg.id === this.#querySeq ? { ids: msg.ids, facets: msg.facets } : null);
		};
		this.#worker.onerror = () => {
			this.#failed = true;
			this.onerror?.();
			for (const resolve of this.#pending.values()) resolve(null);
			this.#pending.clear();
		};
	}

	init(records: IndexRecord[]): Promise<void> {
		const id = ++this.#initSeq;
		const ready = new Promise<void>((res) => this.#initResolvers.set(id, res));
		this.#ready = ready;
		this.#send({ type: 'init', id, records });
		return ready;
	}

	async query(q: string, filters: Filters): Promise<SearchResult | null> {
		if (this.#failed) return null;
		if (!this.#ready) return null; // never initialised — nothing to query yet
		await this.#ready;
		if (this.#failed) return null;
		const id = ++this.#querySeq;
		// Filters may be a Svelte $state proxy, which cannot be structured-cloned.
		const plain = JSON.parse(JSON.stringify(filters)) as Filters;
		return new Promise((resolve) => {
			this.#pending.set(id, resolve);
			this.#send({ type: 'query', id, q, filters: plain });
		});
	}

	destroy() {
		this.#worker.terminate();
		for (const resolve of this.#pending.values()) resolve(null);
		this.#pending.clear();
	}

	#send(m: WorkerRequest) {
		this.#worker.postMessage(m);
	}
}
