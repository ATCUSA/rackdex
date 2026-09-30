import { describe, expect, test } from 'vitest';
import { isPhysical, speedGroup } from './speeds';

describe('speedGroup', () => {
	test.each([
		['100base-tx', '100M'],
		['1000base-t', '1G'],
		['1000base-x-sfp', '1G'],
		['2.5gbase-t', '2.5G'],
		['5gbase-t', '5G'],
		['10gbase-x-sfpp', '10G'],
		['25gbase-x-sfp28', '25G'],
		['40gbase-x-qsfpp', '40G'],
		['100gbase-x-qsfp28', '100G'],
		['400gbase-x-qsfpdd', '400G'],
		['ieee802.11ax', 'Wireless'],
		['5g', 'Wireless'],
		['lte', 'Wireless'],
		['10base-t', 'Other'],
		['other', 'Other']
	])('%s → %s', (type, group) => {
		expect(speedGroup(type)).toBe(group);
	});

	test('non-physical types have no group', () => {
		expect(speedGroup('virtual')).toBeNull();
		expect(speedGroup('lag')).toBeNull();
		expect(speedGroup('bridge')).toBeNull();
	});
});

test('isPhysical', () => {
	expect(isPhysical('1000base-t')).toBe(true);
	expect(isPhysical('virtual')).toBe(false);
});
