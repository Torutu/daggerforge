import { ADVERSARIES, getAdversaries } from "../data/adversaries";
import { ENVIRONMENTS, getEnvironments } from "../data/environments";
import {
	SRD_CLASSES, SRD_ANCESTRIES, SRD_COMMUNITIES, SRD_DOMAIN_CARDS, SRD_TRANSFORMATIONS,
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
	test("raw German overlays cover every canonical id exactly once", () => {
		const groups = {
			classes: SRD_CLASSES, ancestries: SRD_ANCESTRIES, communities: SRD_COMMUNITIES,
			domains: SRD_DOMAIN_CARDS, items: SRD_ITEMS, consumables: SRD_CONSUMABLES,
		};
		for (const [name, originals] of Object.entries(groups)) {
			const core = require(`../data/srd/locales/de/${name}.json`);
			const expansion = require(`../data/srd/locales/de/hope-fear/${name}.json`);
			expect([...core, ...expansion].map(x => x.id).sort()).toEqual(originals.map(x => x.id).sort());
		}
		const transformations = require("../data/srd/locales/de/hope-fear/transformations.json");
		expect(transformations.map((x: {id: string}) => x.id).sort()).toEqual(SRD_TRANSFORMATIONS.map(x => x.id).sort());
		const adversaries = require("../data/locales/de/adversaries.json");
		const environments = require("../data/locales/de/environments.json");
		expect(adversaries.map((x: {id: string}) => x.id).sort()).toEqual(ADVERSARIES.map(x => x.id).sort());
		expect(environments.map((x: {id: string}) => x.id).sort()).toEqual(ENVIRONMENTS.map(x => x.id).sort());
		const coreGear = require("../data/srd/locales/de/equipment.json");
		const expansionGear = require("../data/srd/locales/de/hope-fear/equipment.json");
		for (const group of ["weapons", "armor", "wheelchairs"] as const) {
			expect([...coreGear[group], ...expansionGear[group]].map(x => x.id).sort()).toEqual(SRD_EQUIPMENT[group].map(x => x.id).sort());
		}
	});
	test("localized adversaries preserve all filter and mechanical fields", () => {
		const fields = ["id", "tier", "type", "source", "difficulty", "thresholdMajor", "thresholdSevere", "hp", "stress", "atk", "weaponRange", "weaponDamage", "count"] as const;
		const german = getAdversaries("de");
		for (const [index, original] of ADVERSARIES.entries()) {
			for (const field of fields) expect(german[index][field]).toEqual(original[field]);
			expect(german[index].features.map(f => f.type)).toEqual(original.features.map(f => f.type));
		}
	});

	test("localized environments preserve filters, difficulty and countdowns", () => {
		const german = getEnvironments("de");
		for (const [index, original] of ENVIRONMENTS.entries()) {
			for (const field of ["id", "type", "tier", "source", "difficulty", "countdowns"] as const) {
				expect(german[index][field]).toEqual(original[field]);
			}
			expect(german[index].features.map(f => f.type)).toEqual(original.features.map(f => f.type));
		}
	});
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
