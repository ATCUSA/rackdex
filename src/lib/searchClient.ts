import type { Filters } from './filters';
import type { SearchResult, WorkerRequest, WorkerResponse } from './search';
import type { IndexRecord } from './types';

export class SearchClient {
	#worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
	#seq = 0;
	#pending = new Map<number, (r: SearchResult | null) => void>();
	#ready: Promise<void> = new Promise(() => {});
	#resolveReady: () => void = () => {};

	constructor() {
		this.#worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
			const msg = e.data;
			if (msg.type === 'ready') return this.#resolveReady();
			const resolve = this.#pending.get(msg.id);
			this.#pending.delete(msg.id);
			resolve?.(msg.id === this.#seq ? { ids: msg.ids, facets: msg.facets } : null);
		};
	}

	init(records: IndexRecord[]): Promise<void> {
		this.#ready = new Promise((res) => (this.#resolveReady = res));
		this.#send({ type: 'init', records });
		return this.#ready;
	}

	async query(q: string, filters: Filters): Promise<SearchResult | null> {
		await this.#ready;
		const id = ++this.#seq;
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
