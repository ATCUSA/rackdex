export type Kind = 'device' | 'module' | 'rack';

export type Category =
	| 'switch'
	| 'router-fw'
	| 'server'
	| 'pdu'
	| 'patch-panel'
	| 'chassis'
	| 'power'
	| 'other';

export const COMPONENT_KEYS = [
	'interfaces',
	'console-ports',
	'console-server-ports',
	'power-ports',
	'power-outlets',
	'front-ports',
	'rear-ports',
	'device-bays',
	'module-bays',
	'inventory-items'
] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

export interface IndexRecord {
	/** Repo-relative path, e.g. device-types/Cisco/C9300-48P.yaml */
	id: string;
	kind: Kind;
	/** `manufacturer` field (falls back to the vendor directory name). */
	vendor: string;
	/** Vendor directory name in the repo (used for image paths). */
	vendorDir: string;
	model: string;
	slug?: string;
	partNumber?: string;
	uHeight?: number;
	fullDepth?: boolean;
	airflow?: string;
	weight?: number;
	weightUnit?: string;
	subdeviceRole?: string;
	formFactor?: string;
	width?: number;
	images: { front?: string; rear?: string };
	counts: Partial<Record<ComponentKey, number>>;
	/** Speed groups present, ordered as SPEED_GROUPS. */
	speeds: string[];
	poe: boolean;
	/** Inferred; device types only. */
	category?: Category;
	comments?: string;
}

export interface IndexMeta {
	sha: string;
	date: string;
	builtAt: string;
	counts: Record<Kind, number>;
}

export interface IndexFile {
	meta: IndexMeta;
	records: IndexRecord[];
	imagePaths: string[];
}

export const KIND_LABELS: Record<Kind, string> = {
	device: 'Device type',
	module: 'Module type',
	rack: 'Rack type'
};

export const KIND_PLURAL: Record<Kind, string> = {
	device: 'Device types',
	module: 'Module types',
	rack: 'Rack types'
};

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
	interfaces: 'Interfaces',
	'console-ports': 'Console ports',
	'console-server-ports': 'Console server ports',
	'power-ports': 'Power ports',
	'power-outlets': 'Power outlets',
	'front-ports': 'Front ports',
	'rear-ports': 'Rear ports',
	'device-bays': 'Device bays',
	'module-bays': 'Module bays',
	'inventory-items': 'Inventory items'
};

export const IMPORT_HINTS: Record<Kind, string> = {
	device: 'NetBox → Devices → Device Types → Import',
	module: 'NetBox → Devices → Module Types → Import',
	rack: 'NetBox → Racks → Rack Types → Import'
};
