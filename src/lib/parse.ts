import { parse as parseYaml } from 'yaml';
import { inferCategory } from './category';
import { isPhysical, SPEED_GROUPS, speedGroup } from './speeds';
import { COMPONENT_KEYS, type ComponentKey, type IndexRecord, type Kind } from './types';

const KIND_DIRS: Record<string, Kind> = {
	'device-types': 'device',
	'module-types': 'module',
	'rack-types': 'rack'
};
const IMAGE_DIRS: Partial<Record<Kind, string>> = {
	device: 'elevation-images',
	module: 'module-images'
};
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
const MAX_COMMENT = 300;

export class ParseError extends Error {}

export function kindFromPath(path: string): Kind | null {
	const parts = path.split('/');
	if (parts.length !== 3 || !/\.ya?ml$/i.test(parts[2])) return null;
	return KIND_DIRS[parts[0]] ?? null;
}

export function isImagePath(path: string): boolean {
	return /^(elevation-images|module-images)\/[^/]+\/[^/]+$/.test(path);
}

function fileStem(id: string): string {
	return id.split('/').pop()!.replace(/\.ya?ml$/i, '');
}

export function imageNames(slug: string | undefined, id: string): string[] {
	const stem = fileStem(id);
	return slug && slug !== stem ? [slug, stem] : [stem];
}

export function resolveImages(
	kind: Kind,
	vendorDir: string,
	names: string[],
	images: Set<string>
): { front?: string; rear?: string } {
	const dir = IMAGE_DIRS[kind];
	const out: { front?: string; rear?: string } = {};
	if (!dir) return out;
	for (const side of ['front', 'rear'] as const) {
		search: for (const name of names) {
			for (const ext of IMAGE_EXTS) {
				const p = `${dir}/${vendorDir}/${name}.${side}.${ext}`;
				if (images.has(p)) {
					out[side] = p;
					break search;
				}
			}
		}
	}
	return out;
}

const str = (v: unknown): string | undefined =>
	typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : undefined;
const num = (v: unknown): number | undefined =>
	typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

export function parseRecord(path: string, text: string, images: Set<string>): IndexRecord {
	const kind = kindFromPath(path);
	if (!kind) throw new ParseError(`${path}: not a type file`);

	let doc: unknown;
	try {
		doc = parseYaml(text);
	} catch (e) {
		throw new ParseError(`${path}: ${(e as Error).message}`);
	}
	if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
		throw new ParseError(`${path}: not a YAML mapping`);
	}
	const d = doc as Record<string, unknown>;
	const model = str(d.model);
	if (!model) throw new ParseError(`${path}: missing model`);

	const vendorDir = path.split('/')[1];
	const counts: Partial<Record<ComponentKey, number>> = {};
	for (const key of COMPONENT_KEYS) {
		const list = d[key];
		if (Array.isArray(list) && list.length) counts[key] = list.length;
	}

	let dataIfaces = 0;
	let poe = false;
	const speeds = new Set<string>();
	for (const raw of Array.isArray(d.interfaces) ? d.interfaces : []) {
		if (!raw || typeof raw !== 'object') continue;
		const i = raw as Record<string, unknown>;
		const type = str(i.type) ?? '';
		if (i.poe_mode || i.poe_type) poe = true;
		const g = speedGroup(type);
		if (g) speeds.add(g);
		if (isPhysical(type) && i.mgmt_only !== true) dataIfaces++;
	}

	const slug = str(d.slug);
	const uHeight = num(d.u_height);
	const comments = str(d.comments) ?? str(d.description);

	return {
		id: path,
		kind,
		vendor: str(d.manufacturer) ?? vendorDir,
		vendorDir,
		model,
		slug,
		partNumber: str(d.part_number),
		uHeight,
		fullDepth: bool(d.is_full_depth),
		airflow: str(d.airflow),
		weight: num(d.weight),
		weightUnit: str(d.weight_unit),
		subdeviceRole: str(d.subdevice_role),
		formFactor: str(d.form_factor),
		width: num(d.width),
		images: resolveImages(kind, vendorDir, imageNames(slug, path), images),
		counts,
		speeds: SPEED_GROUPS.filter((s) => speeds.has(s)),
		poe,
		category: kind === 'device' ? inferCategory({ counts, uHeight, dataIfaces }) : undefined,
		comments: comments?.slice(0, MAX_COMMENT)
	};
}
