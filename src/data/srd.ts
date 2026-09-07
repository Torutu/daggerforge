import classesJson from "./srd/classes.json";
import ancestriesJson from "./srd/ancestries.json";
import communitiesJson from "./srd/communities.json";
import domainsJson from "./srd/domains.json";
import equipmentJson from "./srd/equipment.json";
import itemsJson from "./srd/items.json";
import consumablesJson from "./srd/consumables.json";
import beastformsJson from "./srd/beastforms.json";
import hopeFearClassesJson from "./srd/hope-fear/classes.json";
import hopeFearAncestriesJson from "./srd/hope-fear/ancestries.json";
import hopeFearCommunitiesJson from "./srd/hope-fear/communities.json";
import hopeFearDomainsJson from "./srd/hope-fear/domains.json";
import hopeFearTransformationsJson from "./srd/hope-fear/transformations.json";
import hopeFearEquipmentJson from "./srd/hope-fear/equipment.json";
import hopeFearItemsJson from "./srd/hope-fear/items.json";
import hopeFearConsumablesJson from "./srd/hope-fear/consumables.json";
import deCoreDomainsJson from "./srd/locales/de/domains.json";
import deCoreClassesJson from "./srd/locales/de/classes.json";
import deCoreSubclassesJson from "./srd/locales/de/subclasses.json";
import deCoreAncestriesJson from "./srd/locales/de/ancestries.json";
import deCoreCommunitiesJson from "./srd/locales/de/communities.json";
import deCoreBeastformsJson from "./srd/locales/de/beastforms.json";
import deCoreEquipmentJson from "./srd/locales/de/equipment.json";
import deCoreItemsJson from "./srd/locales/de/items.json";
import deCoreConsumablesJson from "./srd/locales/de/consumables.json";
import deHopeFearClassesJson from "./srd/locales/de/hope-fear/classes.json";
import deHopeFearSubclassesJson from "./srd/locales/de/hope-fear/subclasses.json";
import deHopeFearAncestriesJson from "./srd/locales/de/hope-fear/ancestries.json";
import deHopeFearCommunitiesJson from "./srd/locales/de/hope-fear/communities.json";
import deHopeFearDomainsJson from "./srd/locales/de/hope-fear/domains.json";
import deHopeFearTransformationsJson from "./srd/locales/de/hope-fear/transformations.json";
import deHopeFearEquipmentJson from "./srd/locales/de/hope-fear/equipment.json";
import deHopeFearItemsJson from "./srd/locales/de/hope-fear/items.json";
import deHopeFearConsumablesJson from "./srd/locales/de/hope-fear/consumables.json";
import type {
	GearData,
	SrdBeastform,
	SrdClass,
	SrdConsumable,
	SrdDomainCard,
	SrdDomainRef,
	SrdEquipment,
	SrdHeritage,
	SrdItem,
	SrdSubclass,
	SrdSource,
	SrdTransformation,
} from "../types/srd";
import { translate, type Language } from "../i18n";
import { gameTerm } from "../i18n/gameTerms";

/**
 * Bundled Daggerheart SRD reference data for the character sheet's card
 * picker, guided creation wizard, and item embeds. See src/types/srd.ts
 * for provenance.
 */
type RawSrdSubclass = Omit<SrdSubclass, "id" | "source">;
type RawSrdClass = Omit<SrdClass, "id" | "source" | "domains" | "subclasses"> & {
	subclasses: Record<string, RawSrdSubclass>;
};
type RawSrdHeritage = Omit<SrdHeritage, "id" | "source">;
type RawSrdDomainCard = Omit<SrdDomainCard, "id" | "source" | "domainId">;
type RawSrdTransformation = Omit<SrdTransformation, "id" | "source">;

function slug(value: string): string {
	return value
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function domainId(name: string): string {
	return `domain-${slug(name)}`;
}

function domainRef(name: string): SrdDomainRef {
	return { id: domainId(name), name };
}

function classDomains(raw: RawSrdClass): [SrdDomainRef, SrdDomainRef] {
	const names = raw.stats.domains.split(/\s*&\s*/).filter(Boolean);
	if (names.length !== 2) {
		throw new Error(`DaggerForge: class ${raw.name} must have exactly two domains.`);
	}
	return [domainRef(names[0]), domainRef(names[1])];
}

function normalizeClass(raw: RawSrdClass, source: SrdSource): SrdClass {
	const id = `class-${slug(raw.name)}`;
	return {
		...raw,
		id,
		source,
		domains: classDomains(raw),
		subclasses: Object.values(raw.subclasses).map((subclass) => ({
			...subclass,
			id: `subclass-${slug(raw.name)}-${slug(subclass.name)}`,
			source,
		})),
	};
}

function normalizeHeritage(kind: "ancestry" | "community", raw: RawSrdHeritage, source: SrdSource): SrdHeritage {
	return { ...raw, id: `${kind}-${slug(raw.name)}`, source };
}

function normalizeDomainCard(raw: RawSrdDomainCard, source: SrdSource): SrdDomainCard {
	return {
		...raw,
		id: `domain-card-${slug(raw.domain)}-${raw.level}-${slug(raw.name)}`,
		source,
		domainId: domainId(raw.domain),
	};
}

function normalizeTransformation(raw: RawSrdTransformation): SrdTransformation {
	return { ...raw, id: `transformation-${slug(raw.name)}`, source: "hope-fear" };
}

// JSON remains the canonical English SRD snapshot. Stable technical IDs are
// attached here, so visible names can be localized without changing links.
export const SRD_CLASSES = [
	...(classesJson as unknown as RawSrdClass[]).map(item => normalizeClass(item, "core")),
	...(hopeFearClassesJson as unknown as RawSrdClass[]).map(item => normalizeClass(item, "hope-fear")),
];
export const SRD_ANCESTRIES = [
	...(ancestriesJson as RawSrdHeritage[]).map(item => normalizeHeritage("ancestry", item, "core")),
	...(hopeFearAncestriesJson as RawSrdHeritage[]).map(item => normalizeHeritage("ancestry", item, "hope-fear")),
];
export const SRD_COMMUNITIES = [
	...(communitiesJson as RawSrdHeritage[]).map(item => normalizeHeritage("community", item, "core")),
	...(hopeFearCommunitiesJson as RawSrdHeritage[]).map(item => normalizeHeritage("community", item, "hope-fear")),
];
export const SRD_DOMAIN_CARDS = [
	...(domainsJson as RawSrdDomainCard[]).map(item => normalizeDomainCard(item, "core")),
	...(hopeFearDomainsJson as RawSrdDomainCard[]).map(item => normalizeDomainCard(item, "hope-fear")),
];
export const SRD_TRANSFORMATIONS = (hopeFearTransformationsJson as RawSrdTransformation[]).map(normalizeTransformation);
type RawEquipment = { [K in keyof SrdEquipment]: Array<Omit<SrdEquipment[K][number], "source">> };
const withSource = <T extends object>(items: T[], source: SrdSource): Array<T & { source: SrdSource }> =>
	items.map(item => ({ ...item, source }));
const coreEquipment = equipmentJson as RawEquipment;
const hopeFearEquipment = hopeFearEquipmentJson as RawEquipment;
export const SRD_EQUIPMENT: SrdEquipment = {
	weapons: [...withSource(coreEquipment.weapons, "core"), ...withSource(hopeFearEquipment.weapons, "hope-fear")],
	armor: [...withSource(coreEquipment.armor, "core"), ...withSource(hopeFearEquipment.armor, "hope-fear")],
	wheelchairs: [...withSource(coreEquipment.wheelchairs, "core"), ...withSource(hopeFearEquipment.wheelchairs, "hope-fear")],
};
export const SRD_ITEMS: SrdItem[] = [
	...withSource(itemsJson as Array<Omit<SrdItem, "source">>, "core"),
	...withSource(hopeFearItemsJson as Array<Omit<SrdItem, "source">>, "hope-fear"),
];
export const SRD_CONSUMABLES: SrdConsumable[] = [
	...withSource(consumablesJson as Array<Omit<SrdConsumable, "source">>, "core"),
	...withSource(hopeFearConsumablesJson as Array<Omit<SrdConsumable, "source">>, "hope-fear"),
];
export const BEASTFORMS = withSource(beastformsJson as Array<Omit<SrdBeastform, "source">>, "core");

type ClassTranslation = Partial<Omit<SrdClass, "id" | "domains" | "stats" | "subclasses">> & {
	id: string;
	stats?: Partial<SrdClass["stats"]>;
};

function mergeById<T extends { id: string; source: SrdSource }>(items: T[], translations: Array<Partial<T> & { id: string }>): T[] {
	const byId = new Map(translations.map((item) => [item.id, item]));
	return items.map((item) => ({ ...item, ...byId.get(item.id), id: item.id, source: item.source }));
}

function germanClasses(): SrdClass[] {
	const classTranslations = new Map(
		[...(deCoreClassesJson as ClassTranslation[]), ...(deHopeFearClassesJson as ClassTranslation[])]
			.map((item) => [item.id, item]),
	);
	const subclassTranslations = {
		...(deCoreSubclassesJson as Record<string, Partial<SrdSubclass>>),
		...(deHopeFearSubclassesJson as Record<string, Partial<SrdSubclass>>),
	};
	return SRD_CLASSES.map((item) => {
		const translated = classTranslations.get(item.id);
		return {
			...item,
			...translated,
			id: item.id,
			source: item.source,
			domains: item.domains,
			stats: { ...item.stats, ...translated?.stats },
			subclasses: item.subclasses.map((subclass) => ({
				...subclass,
				...(subclassTranslations[slug(subclass.name)] ?? {}),
				id: subclass.id,
				source: subclass.source,
			})),
		};
	});
}

export function getSrdClasses(language: Language): SrdClass[] {
	return language === "de" ? germanClasses() : SRD_CLASSES;
}

export function getSrdAncestries(language: Language): SrdHeritage[] {
	return language === "de"
		? mergeById(SRD_ANCESTRIES, [
			...(deCoreAncestriesJson as Array<Partial<SrdHeritage> & { id: string }>),
			...(deHopeFearAncestriesJson as Array<Partial<SrdHeritage> & { id: string }>),
		])
		: SRD_ANCESTRIES;
}

export function getSrdCommunities(language: Language): SrdHeritage[] {
	return language === "de"
		? mergeById(SRD_COMMUNITIES, [
			...(deCoreCommunitiesJson as Array<Partial<SrdHeritage> & { id: string }>),
			...(deHopeFearCommunitiesJson as Array<Partial<SrdHeritage> & { id: string }>),
		])
		: SRD_COMMUNITIES;
}

export function getSrdDomainCards(language: Language): SrdDomainCard[] {
	if (language !== "de") return SRD_DOMAIN_CARDS;
	const localized = mergeById(SRD_DOMAIN_CARDS, [
		...(deCoreDomainsJson as Array<Partial<SrdDomainCard> & { id: string }>),
		...(deHopeFearDomainsJson as Array<Partial<SrdDomainCard> & { id: string }>),
	]);
	return localized.map((item, index) => ({
		...item,
		id: SRD_DOMAIN_CARDS[index].id,
		source: SRD_DOMAIN_CARDS[index].source,
		domainId: SRD_DOMAIN_CARDS[index].domainId,
		domain: SRD_DOMAIN_CARDS[index].domain,
		type: SRD_DOMAIN_CARDS[index].type,
		level: SRD_DOMAIN_CARDS[index].level,
		recallCost: SRD_DOMAIN_CARDS[index].recallCost,
	}));
}

export function getSrdTransformations(language: Language): SrdTransformation[] {
	return language === "de"
		? mergeById(SRD_TRANSFORMATIONS, deHopeFearTransformationsJson as Array<Partial<SrdTransformation> & { id: string }>)
		: SRD_TRANSFORMATIONS;
}

export function getSrdEquipment(language: Language): SrdEquipment {
	if (language !== "de") return SRD_EQUIPMENT;
	const translations = deCoreEquipmentJson as {
		weapons: Array<Partial<SrdEquipment["weapons"][number]> & { id: string }>;
		armor: Array<Partial<SrdEquipment["armor"][number]> & { id: string }>;
		wheelchairs: Array<Partial<SrdEquipment["wheelchairs"][number]> & { id: string }>;
	};
	const hopeFearTranslations = deHopeFearEquipmentJson as typeof translations;
	return {
		weapons: mergeById(SRD_EQUIPMENT.weapons, [...translations.weapons, ...hopeFearTranslations.weapons]),
		armor: mergeById(SRD_EQUIPMENT.armor, [...translations.armor, ...hopeFearTranslations.armor]),
		wheelchairs: mergeById(SRD_EQUIPMENT.wheelchairs, [...translations.wheelchairs, ...hopeFearTranslations.wheelchairs]),
	};
}

export function getSrdItems(language: Language): SrdItem[] {
	return language === "de"
		? mergeById(SRD_ITEMS, [
			...(deCoreItemsJson as Array<Partial<SrdItem> & { id: string }>),
			...(deHopeFearItemsJson as Array<Partial<SrdItem> & { id: string }>),
		])
		: SRD_ITEMS;
}

export function getSrdConsumables(language: Language): SrdConsumable[] {
	return language === "de"
		? mergeById(SRD_CONSUMABLES, [
			...(deCoreConsumablesJson as Array<Partial<SrdConsumable> & { id: string }>),
			...(deHopeFearConsumablesJson as Array<Partial<SrdConsumable> & { id: string }>),
		])
		: SRD_CONSUMABLES;
}

export function getBeastforms(language: Language): SrdBeastform[] {
	if (language !== "de") return BEASTFORMS;
	const translations = deCoreBeastformsJson as Array<Partial<SrdBeastform>>;
	return BEASTFORMS.map((item, index) => ({ ...item, ...translations[index], source: item.source }));
}

export function localizeTrait(value: string, language: Language): string {
	return gameTerm(value, language);
}

export function localizeRange(value: string, language: Language): string {
	return gameTerm(value, language);
}

export function localizeDamageDie(value: string, language: Language): string {
	return value.replace(/^d/, translate("srd.diePrefix", {}, language));
}

function weaponMeta(w: { trait: string; range: string; damage: string; damageType: string; burden: string }, language: Language): string {
	return translate("srd.weaponMeta", {
		trait: localizeTrait(w.trait, language), range: localizeRange(w.range, language),
		damage: localizeDamageDie(w.damage, language),
		damageType: translate(w.damageType === "Magical" ? "srd.magicAbbreviation" : "srd.physicalAbbreviation", {}, language),
		burden: gameTerm(w.burden, language),
	}, language);
}

/** Everything browsable as gear, in one normalized list. */
export function getAllGear(language: Language): GearData[] {
	const equipment = getSrdEquipment(language);
	const items = getSrdItems(language);
	const consumables = getSrdConsumables(language);
	return [
	...equipment.weapons.map((w): GearData => ({
		id: w.id,
		kind: "weapon",
		name: w.name,
		tier: w.tier,
		rarity: null,
		meta: weaponMeta(w, language),
		text: w.feature ?? "",
		source: w.source,
	})),
	...equipment.armor.map((a): GearData => ({
		id: a.id,
		kind: "armor",
		name: a.name,
		tier: a.tier,
		rarity: null,
		meta: translate("srd.armorMeta", { minor: a.minor, major: a.major, score: a.score }, language),
		text: a.feature ?? "",
		source: a.source,
	})),
	...equipment.wheelchairs.map((w): GearData => ({
		id: w.id,
		kind: "wheelchair",
		name: w.name,
		tier: w.tier,
		rarity: null,
		meta: weaponMeta(w, language),
		text: w.feature ?? "",
		source: w.source,
	})),
	...items.map((i): GearData => ({
		id: i.id,
		kind: "item",
		name: i.name,
		tier: null,
		rarity: i.rarity,
		meta: i.subtype,
		text: i.text,
		source: i.source,
	})),
	...consumables.map((c): GearData => ({
		id: c.id,
		kind: "consumable",
		name: c.name,
		tier: null,
		rarity: c.rarity,
		meta: c.category,
		text: c.text,
		source: c.source,
	})),
	];
}

export const ALL_GEAR: GearData[] = getAllGear("en");
