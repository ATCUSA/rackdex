export interface Toast {
	id: number;
	message: string;
	kind: 'success' | 'error';
}

let nextId = 0;
export const toasts = $state<Toast[]>([]);

export function toast(message: string, kind: Toast['kind'] = 'success') {
	const id = ++nextId;
	toasts.push({ id, message, kind });
	setTimeout(() => {
		const i = toasts.findIndex((t) => t.id === id);
		if (i >= 0) toasts.splice(i, 1);
	}, kind === 'error' ? 5000 : 2500);
}
