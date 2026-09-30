import { createSearch, type WorkerRequest, type WorkerResponse } from './search';

// Typed locally instead of `/// <reference lib="webworker" />`, which clashes with the DOM lib.
const ctx = self as unknown as {
	postMessage(m: WorkerResponse): void;
	onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
};
let engine: ReturnType<typeof createSearch> | null = null;
const post = (m: WorkerResponse) => ctx.postMessage(m);

ctx.onmessage = (e) => {
	const msg = e.data;
	if (msg.type === 'init') {
		engine = createSearch(msg.records);
		post({ type: 'ready', id: msg.id });
	} else if (msg.type === 'query' && engine) {
		post({ type: 'result', id: msg.id, ...engine.run(msg.q, msg.filters) });
	}
};
