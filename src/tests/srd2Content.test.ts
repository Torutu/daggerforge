import { ADVERSARIES, getAdversaries } from "../data/adversaries";
import { ENVIRONMENTS, getEnvironments } from "../data/environments";
import {
	SRD_CONSUMABLES,
	SRD_EQUIPMENT,
	SRD_ITEMS,
	getSrdConsumables,
	getSrdEquipment,
	getSrdItems,
} from "../data/srd";

function uniqueIds(items: Array<{ id: string }>): boolean {
	return new Set(items.map((item) => item.id)).size === items.length;
}

describe("SRD 2.0 bundled content", () => {
	test("includes Core, Hope & Fear, and the existing adventure content", () => {
		expect(ADVERSARIES).toHaveLength(289);
		expect(ENVIRONMENTS).toHaveLength(51);
		expect(ADVERSARIES.filter((item) => item.source === "hope-fear")).toHaveLength(121);
		expect(ENVIRONMENTS.filter((item) => item.source === "hope-fear")).toHaveLength(25);
		expect(uniqueIds(ADVERSARIES)).toBe(true);
		expect(uniqueIds(ENVIRONMENTS)).toBe(true);
	});

	test("includes all added Hope & Fear equipment and loot", () => {
		expect(SRD_EQUIPMENT.weapons).toHaveLength(312);
		expect(SRD_EQUIPMENT.armor).toHaveLength(70);
		expect(SRD_EQUIPMENT.wheelchairs).toHaveLength(12);
		expect(SRD_ITEMS).toHaveLength(121);
		expect(SRD_CONSUMABLES).toHaveLength(121);
		expect(uniqueIds(SRD_EQUIPMENT.weapons)).toBe(true);
		expect(uniqueIds(SRD_EQUIPMENT.armor)).toBe(true);
		expect(uniqueIds(SRD_ITEMS)).toBe(true);
		expect(uniqueIds(SRD_CONSUMABLES)).toBe(true);
	});

	test("German overlays keep stable ids and mechanical values", () => {
		const deAdversaries = getAdversaries("de");
		const deEnvironments = getEnvironments("de");
		const deEquipment = getSrdEquipment("de");
		const deItems = getSrdItems("de");
		const deConsumables = getSrdConsumables("de");

		expect(deAdversaries.map((item) => item.id)).toEqual(ADVERSARIES.map((item) => item.id));
		expect(deAdversaries.map((item) => item.weaponDamage)).toEqual(ADVERSARIES.map((item) => item.weaponDamage));
		expect(deEnvironments.map((item) => item.id)).toEqual(ENVIRONMENTS.map((item) => item.id));
		expect(deEnvironments.map((item) => item.difficulty)).toEqual(ENVIRONMENTS.map((item) => item.difficulty));
		expect(deEquipment.weapons.map((item) => item.id)).toEqual(SRD_EQUIPMENT.weapons.map((item) => item.id));
		expect(deEquipment.weapons.map((item) => item.damage)).toEqual(SRD_EQUIPMENT.weapons.map((item) => item.damage));
		expect(deItems.map((item) => item.id)).toEqual(SRD_ITEMS.map((item) => item.id));
		expect(deConsumables.map((item) => item.id)).toEqual(SRD_CONSUMABLES.map((item) => item.id));
	});
});
