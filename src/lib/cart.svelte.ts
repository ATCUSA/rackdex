const KEY = 'dtf-cart';
type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function defaultStorage(): Storage | undefined {
	try {
		return typeof localStorage === 'undefined' ? undefined : localStorage;
	} catch {
		return undefined;
	}
}

export class Cart {
	ids = $state<string[]>([]);
	#storage: Storage | null | undefined;

	constructor(storage: Storage | null | undefined = defaultStorage()) {
		this.#storage = storage;
		try {
			const parsed: unknown = JSON.parse(storage?.getItem(KEY) ?? '[]');
			if (Array.isArray(parsed)) this.ids = parsed.filter((x): x is string => typeof x === 'string');
		} catch {
			this.ids = [];
		}
	}

	get count() {
		return this.ids.length;
	}

	has(id: string) {
		return this.ids.includes(id);
	}

	add(id: string) {
		if (this.has(id)) return;
		this.ids = [...this.ids, id];
		this.#save();
	}

	remove(id: string) {
		this.ids = this.ids.filter((x) => x !== id);
		this.#save();
	}

	toggle(id: string) {
		if (this.has(id)) this.remove(id);
		else this.add(id);
	}

	clear() {
		this.ids = [];
		this.#save();
	}

	#save() {
		try {
			this.#storage?.setItem(KEY, JSON.stringify(this.ids));
		} catch {
			// storage full or blocked — selection still works for this session
		}
	}
}

export const cart = new Cart();
