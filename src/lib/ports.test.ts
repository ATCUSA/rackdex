import { describe, expect, test } from 'vitest';
import { interfaceBreakdown } from './ports';

describe('interfaceBreakdown', () => {
	test('groups by type, counts PoE sources and mgmt ports, orders slow to fast with virtual last', () => {
		const yaml = `
manufacturer: Cisco
model: X
interfaces:
  - { name: Vlan1, type: virtual }
  - { name: Te1/1/1, type: 10gbase-x-sfpp }
  - { name: Gi1/0/1, type: 1000base-t, poe_mode: pse, poe_type: type2-ieee802.3at }
  - { name: Gi1/0/2, type: 1000base-t, poe_type: type2-ieee802.3at }
  - { name: Gi1/0/3, type: 1000base-t, poe_mode: pd, poe_type: type1-ieee802.3af }
  - { name: Gi0/0, type: 1000base-t, mgmt_only: true }
  - { name: Te1/1/2, type: 10gbase-x-sfpp }
  - { name: odd }
`;
		expect(interfaceBreakdown(yaml)).toEqual([
			{ type: '1000base-t', speed: '1G', count: 4, poe: 2, mgmt: 1 },
			{ type: '10gbase-x-sfpp', speed: '10G', count: 2, poe: 0, mgmt: 0 },
			{ type: 'unknown', speed: 'Other', count: 1, poe: 0, mgmt: 0 },
			{ type: 'virtual', speed: null, count: 1, poe: 0, mgmt: 0 }
		]);
	});

	test('no interfaces → empty; unparseable → null', () => {
		expect(interfaceBreakdown('manufacturer: A\nmodel: B\n')).toEqual([]);
		expect(interfaceBreakdown('model: [bad')).toBeNull();
		expect(interfaceBreakdown('just a string')).toBeNull();
	});
});
