/**
 * Types for the bundled Daggerheart SRD reference data (classes, heritages,
 * domain cards, tier-1 equipment) used by the character sheet's card picker
 * and guided creation wizard.
 *
 * Data lives in src/data/srd/*.json, sourced from the author's dhtools
 * project. Contains material from the Daggerheart System Reference Document,
 * © Critical Role LLC, used under the Darrington Press Community Gaming License.
 */

export interface SrdClassFeature {
	name: string;
	description: string;
}

export interface SrdSubclass {
	id: string;
	name: string;
	/** Missing on non-spellcasting subclasses. */
	spellcastTrait?: string;
	foundation: SrdClassFeature[];
	specialization: SrdClassFeature[];
	mastery: SrdClassFeature[];
}

export interface SrdClassStats {
	/** e.g. "Grace & Codex" */
	domains: string;
	evasion: number;
	hp: number;
	/** Six values in trait order (Agility, Strength, Finesse, Instinct, Presence, Knowledge), e.g. "0, -1, +1, 0, +2, +1" */
	suggestedTraits: string;
	suggestedPrimary: string;
	/** Null for classes whose suggested primary is two-handed. */
	suggestedSecondary: string | null;
	suggestedArmor: string;
}

export interface SrdClass {
	id: string;
	name: string;
	domains: [SrdDomainRef, SrdDomainRef];
	description: string[];
	stats: SrdClassStats;
	items: string;
	hopeFeature: string;
	classFeatures: SrdClassFeature[];
	subclasses: SrdSubclass[];
	backgroundQuestions?: string[];
	connectionQuestions?: string[];
}

/** Ancestries and communities share one shape; features are "Name: text" strings. */
export interface SrdHeritage {
	id: string;
	name: string;
	description: string[];
	features: string[];
}

/** Optional Hope & Fear transformation card. */
export interface SrdTransformation {
	id: string;
	name: string;
	description: string[];
	features: SrdClassFeature[];
	questions?: string[];
}

/** Druid Beastform options (official Beastform list). */
export interface SrdBeastform {
	name: string;
	tier: number;
	/** e.g. "Fox, Mouse, Weasel" */
	examples: string;
	/** Trait that gains the bonus while transformed. */
	trait: string;
	traitMod: number;
	evasionMod: number;
	attackRange: string;
	attackTrait: string;
	attackDamage: string;
	attackMod: number;
	/** Roll types made with advantage, e.g. ["deceive", "locate", "sneak"] */
	advantages: string[];
	features: { name: string; text: string }[];
}

export interface SrdDomainCard {
	id: string;
	name: string;
	level: number;
	domainId: string;
	domain: string;
	/** "Ability" | "Spell" | "Grimoire" */
	type: string;
	recallCost: number;
	/** Body text with light **bold** / _italic_ markdown. */
	text: string;
}

export interface SrdDomainRef {
	id: string;
	name: string;
}

export interface SrdWeapon {
	id: string;
	name: string;
	category: string;
	damageType: string;
	tier: number;
	trait: string;
	range: string;
	damage: string;
	burden: string;
	feature: string | null;
	isUnique: boolean;
}

export interface SrdArmor {
	id: string;
	name: string;
	tier: number;
	minor: number;
	major: number;
	score: number;
	feature: string | null;
	isUnique: boolean;
}

export interface SrdWheelchair {
	id: string;
	name: string;
	frame: string;
	damageType: string;
	tier: number;
	trait: string;
	range: string;
	damage: string;
	burden: string;
	feature: string | null;
}

export interface SrdEquipment {
	weapons: SrdWeapon[];
	armor: SrdArmor[];
	wheelchairs: SrdWheelchair[];
}

export interface SrdItem {
	id: string;
	roll: number;
	rarity: string;
	name: string;
	subtype: string;
	text: string;
}

export interface SrdConsumable {
	id: string;
	roll: number;
	rarity: string;
	name: string;
	category: string;
	text: string;
}

/** Unified view over every piece of gear (SRD equipment/items/consumables and
 *  user-created items) - what the browser, embeds, and picker consume. */
export interface GearData {
	id: string;
	kind: "weapon" | "armor" | "wheelchair" | "item" | "consumable";
	name: string;
	tier: number | null;
	rarity: string | null;
	/** One-line stat summary, e.g. "Agility - Melee · d8 phy · One-Handed". */
	meta: string;
	/** Effect / feature text. */
	text: string;
	source: "srd" | "custom";
}

export const GEAR_KIND_LABELS: Record<GearData["kind"], string> = {
	weapon: "Weapon",
	armor: "Armor",
	wheelchair: "Wheelchair",
	item: "Item",
	consumable: "Consumable",
};

/** Left-border accents for gear cards in the Content Browser, per kind. */
export const GEAR_KIND_COLORS: Record<GearData["kind"], string> = {
	weapon: "#b3542d",
	armor: "#5a7d9a",
	wheelchair: "#8a6bbe",
	item: "#c9a227",
	consumable: "#4e9a51",
};

export const DOMAIN_NAMES = [
	"Arcana",
	"Blade",
	"Bone",
	"Codex",
	"Grace",
	"Midnight",
	"Sage",
	"Splendor",
	"Valor",
	"Dread",
] as const;

/** Signature color per domain (from the printed cards / dhtools). */
export const DOMAIN_COLORS: Record<string, string> = {
	Arcana: "#c47fff",
	Blade: "#ff6e6e",
	Bone: "#c0c0c0",
	Codex: "#6aaeff",
	Grace: "#f06ab0",
	Midnight: "#8860c0",
	Sage: "#60d890",
	Splendor: "#e8c547",
	Valor: "#f0903a",
	Dread: "#5f273f",
};

/** Signature color per class, used for character cards (border + class tag). */
export const CLASS_COLORS: Record<string, string> = {
	Bard: "#e879ab",      // pinkish
	Druid: "#2f7d4f",     // dark forest green
	Guardian: "#c94f24",  // dark orange-red
	Ranger: "#7bc86c",    // lighter green
	Rogue: "#7a68a6",     // dark muted purple (kept light enough to read)
	Seraph: "#f0c94f",    // radiant gold
	Sorcerer: "#a05fd6",  // purple
	Warrior: "#9aa5b1",   // steel grey
	Wizard: "#4f8fe8",    // blue
	Assassin: "#39414f",
	Brawler: "#a95832",
	Warlock: "#7f315f",
	Witch: "#527c55",
	Assassine: "#39414f",
	Faustkämpfer: "#a95832",
	Paktmagier: "#7f315f",
	Hexe: "#527c55",
};

export const CLASS_DOMAINS: Record<string, [string, string]> = {
	Bard: ["Codex", "Grace"],
	Druid: ["Arcana", "Sage"],
	Guardian: ["Blade", "Valor"],
	Ranger: ["Bone", "Sage"],
	Rogue: ["Grace", "Midnight"],
	Seraph: ["Splendor", "Valor"],
	Sorcerer: ["Arcana", "Midnight"],
	Warrior: ["Blade", "Bone"],
	Wizard: ["Codex", "Splendor"],
	Assassin: ["Blade", "Midnight"],
	Brawler: ["Valor", "Bone"],
	Warlock: ["Dread", "Grace"],
	Witch: ["Sage", "Dread"],
};

export const DOMAIN_CARD_TYPES = ["Ability", "Spell", "Grimoire"] as const;
