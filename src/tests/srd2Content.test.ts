import { ADVERSARIES, getAdversaries } from "../data/adversaries";
import { ENVIRONMENTS, getEnvironments } from "../data/environments";
import {
	SRD_CLASSES, SRD_ANCESTRIES, SRD_COMMUNITIES, SRD_DOMAIN_CARDS, SRD_TRANSFORMATIONS,
	SRD_CONSUMABLES,
	SRD_EQUIPMENT,
	SRD_ITEMS,
	BEASTFORMS,
	getSrdAncestries,
	getSrdClasses,
	getSrdCommunities,
	getSrdDomainCards,
	getSrdTransformations,
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

	test("labels every canonical SRD record with its source", () => {
		const expectSources = <T extends { source: string }>(items: T[], core: number, hopeFear: number) => {
			expect(items.filter(item => item.source === "core")).toHaveLength(core);
			expect(items.filter(item => item.source === "hope-fear")).toHaveLength(hopeFear);
			expect(items.every(item => item.source === "core" || item.source === "hope-fear")).toBe(true);
		};
		expectSources(SRD_CLASSES, 9, 4);
		expectSources(SRD_CLASSES.flatMap(item => item.subclasses), 18, 8);
		expectSources(SRD_ANCESTRIES, 18, 6);
		expectSources(SRD_COMMUNITIES, 9, 6);
		expectSources(SRD_DOMAIN_CARDS, 189, 21);
		expectSources(SRD_TRANSFORMATIONS, 0, 6);
		expectSources(SRD_EQUIPMENT.weapons, 192, 120);
		expectSources(SRD_EQUIPMENT.armor, 34, 36);
		expectSources(SRD_EQUIPMENT.wheelchairs, 12, 0);
		expectSources(SRD_ITEMS, 60, 61);
		expectSources(SRD_CONSUMABLES, 60, 61);
		expectSources(BEASTFORMS, 24, 0);
	});

	test("stores source labels in every canonical JSON record", () => {
		for (const source of ["core", "hope-fear"] as const) {
			const prefix = source === "core" ? "../data/srd" : "../data/srd/hope-fear";
			const names = source === "core"
				? ["classes", "ancestries", "communities", "domains", "items", "consumables", "beastforms"]
				: ["classes", "ancestries", "communities", "domains", "items", "consumables", "transformations"];
			for (const name of names) {
				const records = require(`${prefix}/${name}.json`);
				expect(records.length).toBeGreaterThan(0);
				expect(records.every((item: { source?: string }) => item.source === source)).toBe(true);
			}
			const equipment = require(`${prefix}/equipment.json`);
			for (const records of Object.values(equipment) as Array<Array<{ source?: string }>>) {
				expect(records.every(item => item.source === source)).toBe(true);
			}
		}
	});

	test("German overlays cannot replace canonical source labels", () => {
		const pairs = [
			[SRD_CLASSES, getSrdClasses("de")],
			[SRD_ANCESTRIES, getSrdAncestries("de")],
			[SRD_COMMUNITIES, getSrdCommunities("de")],
			[SRD_DOMAIN_CARDS, getSrdDomainCards("de")],
			[SRD_TRANSFORMATIONS, getSrdTransformations("de")],
			[SRD_ITEMS, getSrdItems("de")],
			[SRD_CONSUMABLES, getSrdConsumables("de")],
		] as const;
		for (const [canonical, localized] of pairs) {
			expect(localized.map(item => item.source)).toEqual(canonical.map(item => item.source));
		}
		const equipment = getSrdEquipment("de");
		for (const kind of ["weapons", "armor", "wheelchairs"] as const) {
			expect(equipment[kind].map(item => item.source)).toEqual(SRD_EQUIPMENT[kind].map(item => item.source));
		}
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
