export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// fall back to a hidden textarea below
	}
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.style.position = 'fixed';
	ta.style.opacity = '0';
	document.body.appendChild(ta);
	ta.select();
	try {
		return document.execCommand('copy');
	} catch {
		return false;
	} finally {
		ta.remove();
	}
}

/**
 * Copy text that is still being fetched. Passing a promise to ClipboardItem keeps
 * the user-activation from the click alive (Safari/Chrome) while we fetch.
 */
export async function copyLater(text: Promise<string>): Promise<boolean> {
	if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
		try {
			const blob = text.then((t) => new Blob([t], { type: 'text/plain' }));
			await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
			return true;
		} catch {
			// fall through
		}
	}
	return copyText(await text);
}

export function downloadText(filename: string, text: string, type = 'application/yaml') {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
