import { expect, test } from 'vitest';
import { Cart } from './cart.svelte';

const memStorage = (initial?: string) => {
	const m = new Map<string, string>(initial ? [['dtf-cart', initial]] : []);
	return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), map: m };
};

test('add/remove/toggle/clear persist to storage', () => {
	const s = memStorage();
	const cart = new Cart(s);
	cart.add('a');
	cart.add('a');
	cart.toggle('b');
	expect(cart.ids).toEqual(['a', 'b']);
	expect(cart.count).toBe(2);
	expect(JSON.parse(s.map.get('dtf-cart')!)).toEqual(['a', 'b']);
	cart.toggle('a');
	expect(cart.has('a')).toBe(false);
	cart.clear();
	expect(s.map.get('dtf-cart')).toBe('[]');
});

test('loads saved ids and ignores garbage', () => {
	expect(new Cart(memStorage('["x","y"]')).ids).toEqual(['x', 'y']);
	expect(new Cart(memStorage('{not json')).ids).toEqual([]);
	expect(new Cart(memStorage('[1,"z"]')).ids).toEqual(['z']);
	expect(new Cart(null).ids).toEqual([]);
});
