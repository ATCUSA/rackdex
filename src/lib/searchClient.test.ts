import { expect, test, vi } from 'vitest';
import type { Filters } from './filters';

// SearchClient constructs a real Worker at instantiation time; stub the global so it can be
// unit-tested without spinning up an actual worker thread. Each instance is recorded so tests
// can drive its onmessage/onerror handlers directly.
class FakeWorker {
	static instances: FakeWorker[] = [];
	onmessage: ((e: MessageEvent) => void) | null = null;
	onerror: ((e: unknown) => void) | null = null;
	sent: { type: string; id?: number }[] = [];
	constructor() {
		FakeWorker.instances.push(this);
	}
	postMessage(m: { type: string; id?: number }) {
		this.sent.push(m);
	}
	terminate() {}
}

vi.stubGlobal('Worker', FakeWorker);

const { SearchClient } = await import('./searchClient');

const filters = {} as Filters;

test('query() before any init() resolves null instead of hanging', async () => {
	const client = new SearchClient();
	await expect(client.query('x', filters)).resolves.toBeNull();
});

test('worker.onerror resolves pending queries with null and fires the onerror callback', async () => {
	const client = new SearchClient();
	const fw = FakeWorker.instances.at(-1)!;
	const errored = vi.fn();
	client.onerror = errored;

	const initP = client.init([]);
	const initMsg = fw.sent.find((m) => m.type === 'init')!;
	fw.onmessage?.({ data: { type: 'ready', id: initMsg.id } } as MessageEvent);
	await initP;

	const queryP = client.query('x', filters);
	fw.onerror?.(new Event('error'));

	await expect(queryP).resolves.toBeNull();
	expect(errored).toHaveBeenCalledOnce();

	// Errors are sticky: further queries also resolve null instead of hanging.
	await expect(client.query('y', filters)).resolves.toBeNull();
});

test("an older init()'s ready message resolves its own promise without hanging or throwing", async () => {
	const client = new SearchClient();
	const fw = FakeWorker.instances.at(-1)!;

	const first = client.init([]);
	const second = client.init([]);

	const [firstInit, secondInit] = fw.sent.filter((m) => m.type === 'init');
	expect(firstInit.id).not.toBe(secondInit.id);

	// The newer init's ready arrives first; querying should now work.
	fw.onmessage?.({ data: { type: 'ready', id: secondInit.id } } as MessageEvent);
	await expect(second).resolves.toBeUndefined();

	// The stale first init's ready arrives later — it must resolve its own promise, not hang.
	fw.onmessage?.({ data: { type: 'ready', id: firstInit.id } } as MessageEvent);
	await expect(first).resolves.toBeUndefined();
});
