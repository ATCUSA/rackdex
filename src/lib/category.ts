import type { Category, ComponentKey } from './types';

export interface CategoryInput {
	counts: Partial<Record<ComponentKey, number>>;
	uHeight?: number;
	/** Physical interfaces that are not mgmt_only. */
	dataIfaces: number;
}

export const CATEGORIES: Category[] = [
	'switch',
	'router-fw',
	'server',
	'pdu',
	'patch-panel',
	'chassis',
	'power',
	'other'
];

export const CATEGORY_LABELS: Record<Category, string> = {
	switch: 'Switch',
	'router-fw': 'Router / firewall',
	server: 'Server / appliance',
	pdu: 'PDU',
	'patch-panel': 'Patch panel',
	chassis: 'Chassis',
	power: 'Power (UPS/PSU)',
	other: 'Other'
};

/** Heuristic device category. First matching rule wins (see spec). */
export function inferCategory({ counts, uHeight, dataIfaces }: CategoryInput): Category {
	const c = (k: ComponentKey) => counts[k] ?? 0;
	const ifaces = c('interfaces');
	const u = uHeight ?? 0;
	if (c('power-outlets') > 0) return 'pdu';
	if (ifaces === 0 && c('front-ports') + c('rear-ports') > 0) return 'patch-panel';
	if (c('device-bays') + c('module-bays') > 0 && ifaces <= 4) return 'chassis';
	if (ifaces === 0 && c('power-ports') > 0) return 'power';
	if (dataIfaces >= 8) return 'switch';
	if (dataIfaces >= 2 && u <= 2 && c('console-ports') > 0) return 'router-fw';
	if (ifaces > 0 && u >= 1) return 'server';
	return 'other';
}
