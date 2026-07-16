import classesJson from "./srd/classes.json";
import ancestriesJson from "./srd/ancestries.json";
import communitiesJson from "./srd/communities.json";
import domainsJson from "./srd/domains.json";
import equipmentJson from "./srd/equipment.json";
import itemsJson from "./srd/items.json";
import consumablesJson from "./srd/consumables.json";
import type {
	GearData,
	SrdClass,
	SrdConsumable,
	SrdDomainCard,
	SrdEquipment,
	SrdHeritage,
	SrdItem,
} from "../types/srd";

/**
 * Bundled Daggerheart SRD reference data for the character sheet's card
 * picker, guided creation wizard, and item embeds. See src/types/srd.ts
 * for provenance.
 */
// Via unknown: TS infers a union of per-class literal shapes from the JSON
// (every subclass key optional), which can't satisfy Record<string, SrdSubclass>.
export const SRD_CLASSES = classesJson as unknown as SrdClass[];
export const SRD_ANCESTRIES = ancestriesJson as SrdHeritage[];
export const SRD_COMMUNITIES = communitiesJson as SrdHeritage[];
export const SRD_DOMAIN_CARDS = domainsJson as SrdDomainCard[];
export const SRD_EQUIPMENT = equipmentJson as SrdEquipment;
export const SRD_ITEMS = itemsJson as SrdItem[];
export const SRD_CONSUMABLES = consumablesJson as SrdConsumable[];

function weaponMeta(w: { trait: string; range: string; damage: string; damageType: string; burden: string }): string {
	return `${w.trait} — ${w.range} · ${w.damage} ${w.damageType === "Magical" ? "mag" : "phy"} · ${w.burden}`;
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
