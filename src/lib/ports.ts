import { parse as parseYaml } from 'yaml';
import { isPse } from './parse';
import { SPEED_GROUPS, speedGroup, type SpeedGroup } from './speeds';

export interface PortGroup {
	/** NetBox interface type slug, e.g. 1000base-t. */
	type: string;
	/** Coarse speed group; null for virtual, bridge and LAG interfaces. */
	speed: SpeedGroup | null;
	count: number;
	/** How many of them are PoE sources. */
	poe: number;
	/** How many are management-only. */
	mgmt: number;
}

const rank = (g: SpeedGroup | null) => (g === null ? SPEED_GROUPS.length : SPEED_GROUPS.indexOf(g));

/**
 * Group a type's interfaces by NetBox interface type, slowest speed first and non-physical last, from
 * the YAML the detail panel already fetched. The index only stores totals and speed groups, so this
 * keeps per-port detail out of it. Returns null if the YAML can't be parsed.
 */
export function interfaceBreakdown(yaml: string): PortGroup[] | null {
	let doc: unknown;
	try {
		doc = parseYaml(yaml);
	} catch {
		return null;
	}
	if (!doc || typeof doc !== 'object') return null;
	const list = (doc as Record<string, unknown>).interfaces;
	if (!Array.isArray(list)) return [];

	const groups = new Map<string, PortGroup>();
	for (const raw of list) {
		if (!raw || typeof raw !== 'object') continue;
		const i = raw as Record<string, unknown>;
		const type = typeof i.type === 'string' && i.type.trim() ? i.type.trim() : 'unknown';
		let g = groups.get(type);
		if (!g) groups.set(type, (g = { type, speed: type === 'unknown' ? 'Other' : speedGroup(type), count: 0, poe: 0, mgmt: 0 }));
		g.count++;
		if (isPse(i)) g.poe++;
		if (i.mgmt_only === true) g.mgmt++;
	}
	return [...groups.values()].sort((a, b) => rank(a.speed) - rank(b.speed) || b.count - a.count || a.type.localeCompare(b.type));
}
