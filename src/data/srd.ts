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
import deCoreDomainsJson from "./srd/locales/de/domains.json";
import deHopeFearClassesJson from "./srd/locales/de/hope-fear/classes.json";
import deHopeFearSubclassesJson from "./srd/locales/de/hope-fear/subclasses.json";
import deHopeFearAncestriesJson from "./srd/locales/de/hope-fear/ancestries.json";
import deHopeFearCommunitiesJson from "./srd/locales/de/hope-fear/communities.json";
import deHopeFearDomainsJson from "./srd/locales/de/hope-fear/domains.json";
import deHopeFearTransformationsJson from "./srd/locales/de/hope-fear/transformations.json";
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
	SrdTransformation,
} from "../types/srd";
import type { Language } from "../i18n";

/**
 * Bundled Daggerheart SRD reference data for the character sheet's card
 * picker, guided creation wizard, and item embeds. See src/types/srd.ts
 * for provenance.
 */
type RawSrdSubclass = Omit<SrdSubclass, "id">;
type RawSrdClass = Omit<SrdClass, "id" | "domains" | "subclasses"> & {
	subclasses: Record<string, RawSrdSubclass>;
};
type RawSrdHeritage = Omit<SrdHeritage, "id">;
type RawSrdDomainCard = Omit<SrdDomainCard, "id" | "domainId">;
type RawSrdTransformation = Omit<SrdTransformation, "id">;

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

function normalizeClass(raw: RawSrdClass): SrdClass {
	const id = `class-${slug(raw.name)}`;
	return {
		...raw,
		id,
		domains: classDomains(raw),
		subclasses: Object.values(raw.subclasses).map((subclass) => ({
			...subclass,
			id: `subclass-${slug(raw.name)}-${slug(subclass.name)}`,
		})),
	};
}

function normalizeHeritage(kind: "ancestry" | "community", raw: RawSrdHeritage): SrdHeritage {
	return { ...raw, id: `${kind}-${slug(raw.name)}` };
}

function normalizeDomainCard(raw: RawSrdDomainCard): SrdDomainCard {
	return {
		...raw,
		id: `domain-card-${slug(raw.domain)}-${raw.level}-${slug(raw.name)}`,
		domainId: domainId(raw.domain),
	};
}

function normalizeTransformation(raw: RawSrdTransformation): SrdTransformation {
	return { ...raw, id: `transformation-${slug(raw.name)}` };
}

// JSON remains the canonical English SRD snapshot. Stable technical IDs are
// attached here, so visible names can be localized without changing links.
export const SRD_CLASSES = ([...classesJson, ...hopeFearClassesJson] as unknown as RawSrdClass[]).map(normalizeClass);
export const SRD_ANCESTRIES = ([...ancestriesJson, ...hopeFearAncestriesJson] as RawSrdHeritage[]).map((item) =>
	normalizeHeritage("ancestry", item),
);
export const SRD_COMMUNITIES = ([...communitiesJson, ...hopeFearCommunitiesJson] as RawSrdHeritage[]).map((item) =>
	normalizeHeritage("community", item),
);
export const SRD_DOMAIN_CARDS = ([...domainsJson, ...hopeFearDomainsJson] as RawSrdDomainCard[]).map(normalizeDomainCard);
export const SRD_TRANSFORMATIONS = (hopeFearTransformationsJson as RawSrdTransformation[]).map(normalizeTransformation);
export const SRD_EQUIPMENT = equipmentJson as SrdEquipment;
export const SRD_ITEMS = itemsJson as SrdItem[];
export const SRD_CONSUMABLES = consumablesJson as SrdConsumable[];
export const BEASTFORMS = beastformsJson as SrdBeastform[];

type ClassTranslation = Partial<Omit<SrdClass, "id" | "domains" | "stats" | "subclasses">> & { id: string };

function mergeById<T extends { id: string }>(items: T[], translations: Array<Partial<T> & { id: string }>): T[] {
	const byId = new Map(translations.map((item) => [item.id, item]));
	return items.map((item) => ({ ...item, ...byId.get(item.id) }));
}

function germanClasses(): SrdClass[] {
	const classTranslations = new Map((deHopeFearClassesJson as ClassTranslation[]).map((item) => [item.id, item]));
	const subclassTranslations = deHopeFearSubclassesJson as Record<string, Partial<SrdSubclass>>;
	return SRD_CLASSES.map((item) => {
		const translated = classTranslations.get(item.id);
		return {
			...item,
			...translated,
			id: item.id,
			domains: item.domains,
			stats: item.stats,
			subclasses: item.subclasses.map((subclass) => ({
				...subclass,
				...(subclassTranslations[slug(subclass.name)] ?? {}),
				id: subclass.id,
			})),
		};
	});
}

export function getSrdClasses(language: Language): SrdClass[] {
	return language === "de" ? germanClasses() : SRD_CLASSES;
}

export function getSrdAncestries(language: Language): SrdHeritage[] {
	return language === "de"
		? mergeById(SRD_ANCESTRIES, deHopeFearAncestriesJson as Array<Partial<SrdHeritage> & { id: string }>)
		: SRD_ANCESTRIES;
}

export function getSrdCommunities(language: Language): SrdHeritage[] {
	return language === "de"
		? mergeById(SRD_COMMUNITIES, deHopeFearCommunitiesJson as Array<Partial<SrdHeritage> & { id: string }>)
		: SRD_COMMUNITIES;
}

export function getSrdDomainCards(language: Language): SrdDomainCard[] {
	if (language !== "de") return SRD_DOMAIN_CARDS;
	return mergeById(SRD_DOMAIN_CARDS, [
		...(deCoreDomainsJson as Array<Partial<SrdDomainCard> & { id: string }>),
		...(deHopeFearDomainsJson as Array<Partial<SrdDomainCard> & { id: string }>),
	]);
}

export function getSrdTransformations(language: Language): SrdTransformation[] {
	return language === "de"
		? mergeById(SRD_TRANSFORMATIONS, deHopeFearTransformationsJson as Array<Partial<SrdTransformation> & { id: string }>)
		: SRD_TRANSFORMATIONS;
}

function weaponMeta(w: { trait: string; range: string; damage: string; damageType: string; burden: string }): string {
	return `${w.trait} - ${w.range} · ${w.damage} ${w.damageType === "Magical" ? "mag" : "phy"} · ${w.burden}`;
}

/** Everything browsable as gear, in one normalized list. */
export const ALL_GEAR: GearData[] = [
	...SRD_EQUIPMENT.weapons.map((w): GearData => ({
		id: w.id,
		kind: "weapon",
		name: w.name,
		tier: w.tier,
		rarity: null,
		meta: weaponMeta(w),
		text: w.feature ?? "",
		source: "srd",
	})),
	...SRD_EQUIPMENT.armor.map((a): GearData => ({
		id: a.id,
		kind: "armor",
		name: a.name,
		tier: a.tier,
		rarity: null,
		meta: `Thresholds ${a.minor}/${a.major} · Score ${a.score}`,
		text: a.feature ?? "",
		source: "srd",
	})),
	...SRD_EQUIPMENT.wheelchairs.map((w): GearData => ({
		id: w.id,
		kind: "wheelchair",
		name: w.name,
		tier: w.tier,
		rarity: null,
		meta: weaponMeta(w),
		text: w.feature ?? "",
		source: "srd",
	})),
	...SRD_ITEMS.map((i): GearData => ({
		id: i.id,
		kind: "item",
		name: i.name,
		tier: null,
		rarity: i.rarity,
		meta: i.subtype,
		text: i.text,
		source: "srd",
	})),
	...SRD_CONSUMABLES.map((c): GearData => ({
		id: c.id,
		kind: "consumable",
		name: c.name,
		tier: null,
		rarity: c.rarity,
		meta: c.category,
		text: c.text,
		source: "srd",
	})),
];
