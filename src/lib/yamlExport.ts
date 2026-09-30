import { rawUrl } from './github';

export function stripDocMarkers(text: string): string {
	return text
		.replace(/^﻿/, '')
		.replace(/^(---[ \t]*\r?\n)+/, '')
		.replace(/\r?\n\.\.\.\s*$/, '')
		.trimEnd();
}

/** Join YAML documents into one multi-document stream NetBox's bulk import accepts. */
export function combineYaml(docs: string[]): string {
	return docs.map((d) => `---\n${stripDocMarkers(d)}\n`).join('');
}

/** Port of Django's slugify(), which NetBox uses for manufacturer slugs. */
export function manufacturerSlug(name: string): string {
	return name
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/[-\s]+/g, '-')
		.replace(/^[-_]+|[-_]+$/g, '');
}

const csvCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function manufacturerCsv(names: string[]): string {
	const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b));
	return ['name,slug', ...unique.map((n) => `${csvCell(n)},${manufacturerSlug(n)}`)].join('\n') + '\n';
}

export const yamlFilename = (id: string) => id.split('/').pop()!;

export async function fetchYaml(sha: string, id: string, fetchFn: typeof fetch = fetch): Promise<string> {
	const res = await fetchFn(rawUrl(sha, id));
	if (!res.ok) throw new Error(`GitHub responded ${res.status} for ${id}`);
	return res.text();
}
