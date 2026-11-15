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
import coreClassesJson from "../data/srd/classes.json";
import coreAncestriesJson from "../data/srd/ancestries.json";
import coreCommunitiesJson from "../data/srd/communities.json";
import coreDomainsJson from "../data/srd/domains.json";
import coreItemsJson from "../data/srd/items.json";
import coreConsumablesJson from "../data/srd/consumables.json";
import coreBeastformsJson from "../data/srd/beastforms.json";
import coreEquipmentJson from "../data/srd/equipment.json";
import hfClassesJson from "../data/srd/hope-fear/classes.json";
import hfAncestriesJson from "../data/srd/hope-fear/ancestries.json";
import hfCommunitiesJson from "../data/srd/hope-fear/communities.json";
import hfDomainsJson from "../data/srd/hope-fear/domains.json";
import hfItemsJson from "../data/srd/hope-fear/items.json";
import hfConsumablesJson from "../data/srd/hope-fear/consumables.json";
import hfTransformationsJson from "../data/srd/hope-fear/transformations.json";
import hfEquipmentJson from "../data/srd/hope-fear/equipment.json";
import deCoreClassesJson from "../data/srd/locales/de/classes.json";
import deCoreAncestriesJson from "../data/srd/locales/de/ancestries.json";
import deCoreCommunitiesJson from "../data/srd/locales/de/communities.json";
import deCoreDomainsJson from "../data/srd/locales/de/domains.json";
import deCoreItemsJson from "../data/srd/locales/de/items.json";
import deCoreConsumablesJson from "../data/srd/locales/de/consumables.json";
import deCoreEquipmentJson from "../data/srd/locales/de/equipment.json";
import deHfClassesJson from "../data/srd/locales/de/hope-fear/classes.json";
import deHfAncestriesJson from "../data/srd/locales/de/hope-fear/ancestries.json";
import deHfCommunitiesJson from "../data/srd/locales/de/hope-fear/communities.json";
import deHfDomainsJson from "../data/srd/locales/de/hope-fear/domains.json";
import deHfItemsJson from "../data/srd/locales/de/hope-fear/items.json";
import deHfConsumablesJson from "../data/srd/locales/de/hope-fear/consumables.json";
import deHfTransformationsJson from "../data/srd/locales/de/hope-fear/transformations.json";
import deHfEquipmentJson from "../data/srd/locales/de/hope-fear/equipment.json";
import deAdversariesJson from "../data/locales/de/adversaries.json";
import deEnvironmentsJson from "../data/locales/de/environments.json";

type JsonRecords = ReadonlyArray<{ id: string }>;
type JsonEquipment = Record<"weapons" | "armor" | "wheelchairs", JsonRecords>;
type SourcedRecords = ReadonlyArray<{ source?: string }>;
type SourcedEquipment = Record<"weapons" | "armor" | "wheelchairs", SourcedRecords>;

const sortedIds = (records: JsonRecords): string[] => records.map((item) => item.id).sort();

function uniqueIds(items: Array<{ id: string }>): boolean {
	return new Set(items.map((item) => item.id)).size === items.length;
}

describe("SRD 2.0 bundled content", () => {
	test("raw German overlays cover every canonical id exactly once", () => {
		const groups: Array<[JsonRecords, JsonRecords, JsonRecords]> = [
			[deCoreClassesJson, deHfClassesJson, SRD_CLASSES],
			[deCoreAncestriesJson, deHfAncestriesJson, SRD_ANCESTRIES],
			[deCoreCommunitiesJson, deHfCommunitiesJson, SRD_COMMUNITIES],
			[deCoreDomainsJson, deHfDomainsJson, SRD_DOMAIN_CARDS],
			[deCoreItemsJson, deHfItemsJson, SRD_ITEMS],
			[deCoreConsumablesJson, deHfConsumablesJson, SRD_CONSUMABLES],
		];
		for (const [core, expansion, originals] of groups) {
			expect(sortedIds([...core, ...expansion])).toEqual(sortedIds(originals));
		}
		expect(sortedIds(deHfTransformationsJson)).toEqual(sortedIds(SRD_TRANSFORMATIONS));
		expect(sortedIds(deAdversariesJson)).toEqual(sortedIds(ADVERSARIES));
		expect(sortedIds(deEnvironmentsJson)).toEqual(sortedIds(ENVIRONMENTS));
		const coreGear: JsonEquipment = deCoreEquipmentJson;
		const expansionGear: JsonEquipment = deHfEquipmentJson;
		for (const group of ["weapons", "armor", "wheelchairs"] as const) {
			expect(sortedIds([...coreGear[group], ...expansionGear[group]])).toEqual(sortedIds(SRD_EQUIPMENT[group]));
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

	test("known records change visible text while ids and mechanics stay stable", () => {
		const enClass = getSrdClasses("en").find((item) => item.id === "class-bard")!;
		const deClass = getSrdClasses("de").find((item) => item.id === "class-bard")!;
		expect(deClass.id).toBe(enClass.id);
		expect(deClass.name).not.toBe(enClass.name);
		expect({ evasion: deClass.stats.evasion, hp: deClass.stats.hp }).toEqual({
			evasion: enClass.stats.evasion,
			hp: enClass.stats.hp,
		});

		const cardId = "domain-card-arcana-1-rune-ward";
		const enCard = getSrdDomainCards("en").find((item) => item.id === cardId)!;
		const deCard = getSrdDomainCards("de").find((item) => item.id === cardId)!;
		expect(deCard.id).toBe(enCard.id);
		expect(deCard.name).not.toBe(enCard.name);
		expect(deCard.text).not.toBe(enCard.text);
		expect({ level: deCard.level, recallCost: deCard.recallCost }).toEqual({
			level: enCard.level,
			recallCost: enCard.recallCost,
		});

		const enAdversary = getAdversaries("en").find((item) => item.id === "SA001")!;
		const deAdversary = getAdversaries("de").find((item) => item.id === "SA001")!;
		expect(deAdversary.id).toBe(enAdversary.id);
		expect(deAdversary.name).not.toBe(enAdversary.name);
		expect(deAdversary.difficulty).toBe(enAdversary.difficulty);

		const enEnvironment = getEnvironments("en").find((item) => item.id === "CE001")!;
		const deEnvironment = getEnvironments("de").find((item) => item.id === "CE001")!;
		expect(deEnvironment.id).toBe(enEnvironment.id);
		expect(deEnvironment.name).not.toBe(enEnvironment.name);
		expect(deEnvironment.difficulty).toBe(enEnvironment.difficulty);
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
		const bySource: Record<"core" | "hope-fear", { records: SourcedRecords[]; equipment: SourcedEquipment }> = {
			core: {
				records: [coreClassesJson, coreAncestriesJson, coreCommunitiesJson, coreDomainsJson, coreItemsJson, coreConsumablesJson, coreBeastformsJson],
				equipment: coreEquipmentJson,
			},
			"hope-fear": {
				records: [hfClassesJson, hfAncestriesJson, hfCommunitiesJson, hfDomainsJson, hfItemsJson, hfConsumablesJson, hfTransformationsJson],
				equipment: hfEquipmentJson,
			},
		};
		for (const [source, { records: groups, equipment }] of Object.entries(bySource)) {
			for (const records of groups) {
				expect(records.length).toBeGreaterThan(0);
				expect(records.every((item) => item.source === source)).toBe(true);
			}
			for (const records of Object.values(equipment)) {
				expect(records.every((item) => item.source === source)).toBe(true);
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
