const FOCUSABLE = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Svelte action for a modal panel: moves focus into it on mount, keeps Tab and Shift+Tab inside it,
 * and returns focus to whatever had it before when the panel is removed. Pair it with
 * role="dialog", aria-modal="true" and tabindex="-1" on the same element.
 */
export function modal(node: HTMLElement) {
	const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const focusables = () =>
		[...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);

	// Focus the panel itself rather than its first control, so screen readers announce the dialog
	// and a stray Enter doesn't trigger a button.
	node.focus({ preventScroll: true });

	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const list = focusables();
		if (list.length === 0) {
			e.preventDefault();
			return;
		}
		const first = list[0];
		const last = list[list.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && (active === first || active === node)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && (active === last || active === node)) {
			e.preventDefault();
			first.focus();
		}
	}

	// If focus leaves the panel some other way (e.g. a click on the page behind it), pull it back.
	function onfocusin(e: FocusEvent) {
		if (e.target instanceof Node && !node.contains(e.target)) node.focus({ preventScroll: true });
	}

	node.addEventListener('keydown', onkeydown);
	document.addEventListener('focusin', onfocusin);
	return {
		destroy() {
			node.removeEventListener('keydown', onkeydown);
			document.removeEventListener('focusin', onfocusin);
			if (previous?.isConnected) previous.focus({ preventScroll: true });
		}
	};
}
