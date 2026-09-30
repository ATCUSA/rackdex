import { describe, expect, test } from 'vitest';
import { imageNames, isImagePath, kindFromPath, ParseError, parseRecord, resolveImages } from './parse';

const SWITCH = `---
manufacturer: Cisco
model: Catalyst 9300-48P
part_number: C9300-48P
slug: cisco-c9300-48p
u_height: 1
is_full_depth: true
airflow: front-to-rear
weight: 7.59
weight_unit: kg
front_image: true
comments: Data sheet
console-ports:
  - name: con 0
    type: rj-45
power-ports:
  - name: PS1
    type: iec-60320-c16
interfaces:
${Array.from({ length: 48 }, (_, i) => `  - name: Gi1/0/${i + 1}\n    type: 1000base-t\n    poe_mode: pse`).join('\n')}
  - name: Te1/1/1
    type: 10gbase-x-sfpp
  - name: Mgmt0
    type: 1000base-t
    mgmt_only: true
  - name: Vlan1
    type: virtual
`;

const MODULE = `manufacturer: Cisco
model: 16x100GE line card
part_number: A9K-16X100GE-TR
interfaces:
  - name: '{module}/0'
    type: 100gbase-x-qsfp28
`;

const RACK = `manufacturer: APC
model: AR1300
slug: apc-ar1300
form_factor: 4-post-cabinet
width: 19
u_height: 42
description: NetShelter SX 42U
`;

const images = new Set([
	'elevation-images/Cisco/cisco-c9300-48p.front.png',
	'module-images/Cisco/A9K-16X100GE-TR.front.jpeg'
]);

describe('kindFromPath', () => {
	test('recognises the three type dirs', () => {
		expect(kindFromPath('device-types/Cisco/C9300-48P.yaml')).toBe('device');
		expect(kindFromPath('module-types/Cisco/X.yml')).toBe('module');
		expect(kindFromPath('rack-types/APC/AR1300.yaml')).toBe('rack');
	});
	test('rejects other paths', () => {
		expect(kindFromPath('device-types/Cisco/README.md')).toBeNull();
		expect(kindFromPath('schema/devicetype.json')).toBeNull();
		expect(kindFromPath('device-types/Cisco/sub/x.yaml')).toBeNull();
	});
});

test('isImagePath', () => {
	expect(isImagePath('elevation-images/Cisco/a.front.png')).toBe(true);
	expect(isImagePath('module-images/Cisco/a.rear.jpg')).toBe(true);
	expect(isImagePath('device-types/Cisco/a.yaml')).toBe(false);
});

test('imageNames prefers slug then file stem', () => {
	expect(imageNames('cisco-x', 'device-types/Cisco/X.yaml')).toEqual(['cisco-x', 'X']);
	expect(imageNames(undefined, 'module-types/Cisco/X.yml')).toEqual(['X']);
});

test('resolveImages finds any supported extension', () => {
	expect(resolveImages('device', 'Cisco', ['cisco-c9300-48p'], images)).toEqual({
		front: 'elevation-images/Cisco/cisco-c9300-48p.front.png'
	});
	expect(resolveImages('rack', 'APC', ['apc-ar1300'], images)).toEqual({});
});

describe('parseRecord', () => {
	test('device type', () => {
		const r = parseRecord('device-types/Cisco/C9300-48P.yaml', SWITCH, images);
		expect(r).toMatchObject({
			id: 'device-types/Cisco/C9300-48P.yaml',
			kind: 'device',
			vendor: 'Cisco',
			vendorDir: 'Cisco',
			model: 'Catalyst 9300-48P',
			partNumber: 'C9300-48P',
			slug: 'cisco-c9300-48p',
			uHeight: 1,
			fullDepth: true,
			airflow: 'front-to-rear',
			weight: 7.59,
			weightUnit: 'kg',
			images: { front: 'elevation-images/Cisco/cisco-c9300-48p.front.png' },
			counts: { interfaces: 51, 'console-ports': 1, 'power-ports': 1 },
			speeds: ['1G', '10G'],
			poe: true,
			category: 'switch',
			comments: 'Data sheet'
		});
	});

	test('poe is true only for a PoE source (PSE), not a powered device (PD)', () => {
		const pd = parseRecord(
			'device-types/Acme/ap.yaml',
			'model: AP\ninterfaces:\n  - name: eth0\n    type: 1000base-t\n    poe_mode: pd\n    poe_type: type2-ieee802.3at\n',
			new Set()
		);
		expect(pd.poe).toBe(false);

		const pse = parseRecord(
			'device-types/Acme/switch.yaml',
			'model: SW\ninterfaces:\n  - name: eth0\n    type: 1000base-t\n    poe_mode: pse\n',
			new Set()
		);
		expect(pse.poe).toBe(true);

		const typeOnly = parseRecord(
			'device-types/Acme/injector.yaml',
			'model: Injector\ninterfaces:\n  - name: eth0\n    type: 1000base-t\n    poe_type: type1-ieee802.3af\n',
			new Set()
		);
		expect(typeOnly.poe).toBe(true);
	});

	test('module type uses file stem for images and has no category', () => {
		const r = parseRecord('module-types/Cisco/A9K-16X100GE-TR.yaml', MODULE, images);
		expect(r.kind).toBe('module');
		expect(r.category).toBeUndefined();
		expect(r.speeds).toEqual(['100G']);
		expect(r.images).toEqual({ front: 'module-images/Cisco/A9K-16X100GE-TR.front.jpeg' });
	});

	test('rack type', () => {
		const r = parseRecord('rack-types/APC/AR1300.yaml', RACK, images);
		expect(r).toMatchObject({ kind: 'rack', uHeight: 42, formFactor: '4-post-cabinet', width: 19, comments: 'NetShelter SX 42U' });
	});

	test('falls back to vendor dir when manufacturer missing', () => {
		const r = parseRecord('device-types/Acme/x.yaml', 'model: X\n', new Set());
		expect(r.vendor).toBe('Acme');
	});

	test('truncates long comments to 300 chars', () => {
		const r = parseRecord('device-types/Acme/x.yaml', `model: X\ncomments: ${'a'.repeat(500)}\n`, new Set());
		expect(r.comments).toHaveLength(300);
	});

	test('throws ParseError on invalid YAML, non-mapping or missing model', () => {
		expect(() => parseRecord('device-types/A/x.yaml', 'model: [unclosed', new Set())).toThrow(ParseError);
		expect(() => parseRecord('device-types/A/x.yaml', '- a\n- b\n', new Set())).toThrow(ParseError);
		expect(() => parseRecord('device-types/A/x.yaml', 'slug: x\n', new Set())).toThrow(/missing model/);
		expect(() => parseRecord('schema/x.json', 'model: x', new Set())).toThrow(ParseError);
	});
});
