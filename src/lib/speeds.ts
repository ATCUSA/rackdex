export const SPEED_GROUPS = [
	'100M',
	'1G',
	'2.5G',
	'5G',
	'10G',
	'25G',
	'40G',
	'50G',
	'100G',
	'200G',
	'400G',
	'800G',
	'Wireless',
	'Other'
] as const;
export type SpeedGroup = (typeof SPEED_GROUPS)[number];

const NON_PHYSICAL = new Set(['virtual', 'bridge', 'lag']);
const CELLULAR = new Set(['gsm', 'cdma', 'lte', '4g', '5g']);

export function isPhysical(type: string): boolean {
	return !NON_PHYSICAL.has(type);
}

/** Map a NetBox interface type slug to a coarse speed group. */
export function speedGroup(type: string): SpeedGroup | null {
	if (!isPhysical(type)) return null;
	if (type.startsWith('ieee802.11') || type.startsWith('ieee802.15') || CELLULAR.has(type)) {
		return 'Wireless';
	}
	const m = /^(\d+(?:\.\d+)?)(g?)base/.exec(type);
	if (!m) return 'Other';
	const n = parseFloat(m[1]);
	const mbps = m[2] === 'g' ? n * 1000 : n;
	const label = mbps < 1000 ? `${mbps}M` : `${mbps / 1000}G`;
	return (SPEED_GROUPS as readonly string[]).includes(label) ? (label as SpeedGroup) : 'Other';
}
