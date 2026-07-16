/**
 * Data model for the Daggerheart character sheet.
 * Mirrors the official fillable character sheet 1:1 — same sections,
 * slot counts, and field names — plus a free-form notes section.
 *
 * This is a framework-agnostic copy of the type used by the DaggerForge
 * Obsidian plugin (src/types/character.ts in the plugin repo). It has no
 * Obsidian dependency, so it works as-is in a React/HTML/TypeScript website.
 */

export const TRAIT_NAMES = [
	"agility",
	"strength",
	"finesse",
	"instinct",
	"presence",
	"knowledge",
] as const;

export type TraitName = (typeof TRAIT_NAMES)[number];

/** Example actions printed under each trait on the official sheet. */
export const TRAIT_VERBS: Record<TraitName, readonly [string, string, string]> = {
	agility: ["Sprint", "Leap", "Maneuver"],
	strength: ["Lift", "Smash", "Grapple"],
	finesse: ["Control", "Hide", "Tinker"],
	instinct: ["Perceive", "Sense", "Navigate"],
	presence: ["Charm", "Perform", "Deceive"],
	knowledge: ["Recall", "Analyze", "Comprehend"],
};

// Slot counts printed on the official sheet
export const HP_SLOTS = 12;
export const HP_SOLID_SLOTS = 5;
export const STRESS_SLOTS = 12;
export const STRESS_SOLID_SLOTS = 6;
export const HOPE_SLOTS = 6;
export const ARMOR_SLOTS = 12;
export const EXPERIENCE_ROWS = 5;
export const GOLD_HANDFULS = 9;
export const GOLD_BAGS = 9;
/** Markable proficiency circles — the first printed circle is always filled. */
export const PROFICIENCY_SLOTS = 5;
export const INVENTORY_WEAPONS = 2;

export interface CharacterTrait {
	value: string;
	/** The circle beside the trait name, marked when upgrading the trait. */
	marked: boolean;
}

export interface CharacterWeapon {
	name: string;
	traitRange: string;
	damageDice: string;
	feature: string;
}

export interface CharacterInventoryWeapon extends CharacterWeapon {
	handOne: boolean;
	handTwo: boolean;
	primary: boolean;
	secondary: boolean;
}

export interface CharacterArmor {
	name: string;
	baseThresholds: string;
	baseScore: string;
	feature: string;
}

export interface CharacterExperience {
	text: string;
	modifier: string;
}

/** A user-defined currency row shown when the gold tracker is in custom mode. */
export interface CustomCurrency {
	name: string;
	amount: string;
}

/**
 * Per-section sheet options (each section's cog wheel). All purely visual /
 * homebrew knobs — defaults reproduce the printed sheet exactly.
 */
export interface SheetSettings {
	/** Adds a fourth "Massive Damage — Mark 4 HP" threshold block. */
	massiveDamage: boolean;
	/** Slots up to this count render solid; the rest stay dashed. */
	maxHp: number;
	maxStress: number;
	/** Hope diamonds beyond this count are greyed out and locked. Values above
	 *  6 wrap onto extra strips of 6 diamonds each (up to 24). */
	maxHope: number;
	/** Number of experience rows (printed sheet has 5). */
	experienceRows: number;
	goldMode: "standard" | "custom";
	/** Section title in custom mode (e.g. "Credits"). */
	goldLabel: string;
	currencies: CustomCurrency[];
	/** Layout override: auto follows the available width, the others force it. */
	layoutMode: "auto" | "wide" | "compact";
}

export function defaultSheetSettings(): SheetSettings {
	return {
		massiveDamage: false,
		maxHp: HP_SOLID_SLOTS,
		maxStress: STRESS_SOLID_SLOTS,
		maxHope: HOPE_SLOTS,
		experienceRows: EXPERIENCE_ROWS,
		goldMode: "standard",
		goldLabel: "Gold",
		currencies: [],
		layoutMode: "auto",
	};
}

/** An ancestry or community card attached to the character.
 *  Stored as a full snapshot so share codes stay self-contained. */
export interface HeritageCardData {
	name: string;
	description: string;
	features: string;
}

/** A domain ability card in the character's loadout or vault. */
export interface CharacterDomainCard {
	name: string;
	domain: string;
	level: number;
	type: string;
	recallCost: number;
	text: string;
	inVault: boolean;
}

export interface CharacterData {
	id: string;
	name: string;
	pronouns: string;
	heritage: string;
	classSubclass: string;
	level: string;
	traits: Record<TraitName, CharacterTrait>;
	evasion: string;
	armorScore: string;
	armorSlots: boolean[];
	majorThreshold: string;
	severeThreshold: string;
	hp: boolean[];
	stress: boolean[];
	hope: boolean[];
	hopeFeature: string;
	experiences: CharacterExperience[];
	goldHandfuls: boolean[];
	goldBags: boolean[];
	goldChest: boolean;
	classFeature: string;
	proficiency: boolean[];
	/** Hand icons beside the Active Weapons banner (burden marks). */
	weaponHandOne: boolean;
	weaponHandTwo: boolean;
	primaryWeapon: CharacterWeapon;
	secondaryWeapon: CharacterWeapon;
	activeArmor: CharacterArmor;
	inventory: string;
	inventoryWeapons: CharacterInventoryWeapon[];
	/** Not on the printed sheet — extra space for session/campaign notes. */
	notes: string;
	ancestryCard: HeritageCardData | null;
	communityCard: HeritageCardData | null;
	domainCards: CharacterDomainCard[];
	sheetSettings: SheetSettings;
	lastUpdated: number;
}

function emptyTrait(): CharacterTrait {
	return { value: "", marked: false };
}

function emptyWeapon(): CharacterWeapon {
	return { name: "", traitRange: "", damageDice: "", feature: "" };
}

function emptyInventoryWeapon(): CharacterInventoryWeapon {
	return { ...emptyWeapon(), handOne: false, handTwo: false, primary: false, secondary: false };
}

export function createEmptyCharacter(id: string): CharacterData {
	return {
		id,
		name: "",
		pronouns: "",
		heritage: "",
		classSubclass: "",
		level: "",
		traits: {
			agility: emptyTrait(),
			strength: emptyTrait(),
			finesse: emptyTrait(),
			instinct: emptyTrait(),
			presence: emptyTrait(),
			knowledge: emptyTrait(),
		},
		evasion: "",
		armorScore: "",
		armorSlots: new Array(ARMOR_SLOTS).fill(false),
		majorThreshold: "",
		severeThreshold: "",
		hp: new Array(HP_SLOTS).fill(false),
		stress: new Array(STRESS_SLOTS).fill(false),
		hope: new Array(HOPE_SLOTS).fill(false),
		hopeFeature: "",
		experiences: Array.from({ length: EXPERIENCE_ROWS }, () => ({ text: "", modifier: "" })),
		goldHandfuls: new Array(GOLD_HANDFULS).fill(false),
		goldBags: new Array(GOLD_BAGS).fill(false),
		goldChest: false,
		classFeature: "",
		proficiency: new Array(PROFICIENCY_SLOTS).fill(false),
		weaponHandOne: false,
		weaponHandTwo: false,
		primaryWeapon: emptyWeapon(),
		secondaryWeapon: emptyWeapon(),
		activeArmor: { name: "", baseThresholds: "", baseScore: "", feature: "" },
		inventory: "",
		inventoryWeapons: Array.from({ length: INVENTORY_WEAPONS }, emptyInventoryWeapon),
		notes: "",
		ancestryCard: null,
		communityCard: null,
		domainCards: [],
		sheetSettings: defaultSheetSettings(),
		lastUpdated: Date.now(),
	};
}

function asString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function asBooleanArray(value: unknown, length: number): boolean[] {
	const source = Array.isArray(value) ? value : [];
	return Array.from({ length }, (_, i) => source[i] === true);
}

/**
 * Coerce untrusted data (imported codes, old saves) into a valid character.
 * Unknown fields are dropped; missing fields get defaults; fixed-size arrays
 * are padded or truncated to the slot counts printed on the sheet.
 */
export function normalizeCharacter(raw: unknown, fallbackId: string): CharacterData {
	const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
	const base = createEmptyCharacter(asString(data.id) || fallbackId);

	const traits = (data.traits && typeof data.traits === "object" ? data.traits : {}) as Record<
		string,
		unknown
	>;
	for (const name of TRAIT_NAMES) {
		const t = (traits[name] && typeof traits[name] === "object" ? traits[name] : {}) as Record<
			string,
			unknown
		>;
		base.traits[name] = { value: asString(t.value), marked: t.marked === true };
	}

	base.name = asString(data.name);
	base.pronouns = asString(data.pronouns);
	base.heritage = asString(data.heritage);
	base.classSubclass = asString(data.classSubclass);
	base.level = asString(data.level);
	base.evasion = asString(data.evasion);
	base.armorScore = asString(data.armorScore);
	base.armorSlots = asBooleanArray(data.armorSlots, ARMOR_SLOTS);
	base.majorThreshold = asString(data.majorThreshold);
	base.severeThreshold = asString(data.severeThreshold);
	base.hp = asBooleanArray(data.hp, HP_SLOTS);
	base.stress = asBooleanArray(data.stress, STRESS_SLOTS);
	base.hopeFeature = asString(data.hopeFeature);
	base.sheetSettings = normalizeSheetSettings(data.sheetSettings);
	base.hope = asBooleanArray(data.hope, hopeSlotCount(base.sheetSettings.maxHope));

	const experiences = Array.isArray(data.experiences) ? data.experiences : [];
	base.experiences = Array.from({ length: base.sheetSettings.experienceRows }, (_, i) => {
		const e = (experiences[i] && typeof experiences[i] === "object" ? experiences[i] : {}) as Record<
			string,
			unknown
		>;
		return { text: asString(e.text), modifier: asString(e.modifier) };
	});

	base.goldHandfuls = asBooleanArray(data.goldHandfuls, GOLD_HANDFULS);
	base.goldBags = asBooleanArray(data.goldBags, GOLD_BAGS);
	base.goldChest = data.goldChest === true;
	base.classFeature = asString(data.classFeature);
	base.proficiency = asBooleanArray(data.proficiency, PROFICIENCY_SLOTS);
	base.weaponHandOne = data.weaponHandOne === true;
	base.weaponHandTwo = data.weaponHandTwo === true;
	base.primaryWeapon = normalizeWeapon(data.primaryWeapon);
	base.secondaryWeapon = normalizeWeapon(data.secondaryWeapon);

	const armor = (data.activeArmor && typeof data.activeArmor === "object"
		? data.activeArmor
		: {}) as Record<string, unknown>;
	base.activeArmor = {
		name: asString(armor.name),
		baseThresholds: asString(armor.baseThresholds),
		baseScore: asString(armor.baseScore),
		feature: asString(armor.feature),
	};

	base.inventory = asString(data.inventory);
	const inventoryWeapons = Array.isArray(data.inventoryWeapons) ? data.inventoryWeapons : [];
	base.inventoryWeapons = Array.from({ length: INVENTORY_WEAPONS }, (_, i) => {
		const w = (inventoryWeapons[i] && typeof inventoryWeapons[i] === "object"
			? inventoryWeapons[i]
			: {}) as Record<string, unknown>;
		return {
			...normalizeWeapon(w),
			handOne: w.handOne === true,
			handTwo: w.handTwo === true,
			primary: w.primary === true,
			secondary: w.secondary === true,
		};
	});

	base.notes = asString(data.notes);
	base.ancestryCard = normalizeHeritageCard(data.ancestryCard);
	base.communityCard = normalizeHeritageCard(data.communityCard);
	base.domainCards = (Array.isArray(data.domainCards) ? data.domainCards : [])
		.map(normalizeDomainCard)
		.filter((c): c is CharacterDomainCard => c !== null);
	base.lastUpdated = typeof data.lastUpdated === "number" ? data.lastUpdated : Date.now();
	return base;
}

function normalizeHeritageCard(raw: unknown): HeritageCardData | null {
	if (!raw || typeof raw !== "object") return null;
	const c = raw as Record<string, unknown>;
	const name = asString(c.name);
	if (!name) return null;
	return { name, description: asString(c.description), features: asString(c.features) };
}

function normalizeDomainCard(raw: unknown): CharacterDomainCard | null {
	if (!raw || typeof raw !== "object") return null;
	const c = raw as Record<string, unknown>;
	const name = asString(c.name);
	if (!name) return null;
	return {
		name,
		domain: asString(c.domain),
		level: typeof c.level === "number" ? c.level : 1,
		type: asString(c.type),
		recallCost: typeof c.recallCost === "number" ? c.recallCost : 0,
		text: asString(c.text),
		inVault: c.inVault === true,
	};
}

/** Hope renders in full strips of 6 — the slot count rounds max hope up to one. */
export function hopeSlotCount(maxHope: number): number {
	return Math.max(HOPE_SLOTS, Math.ceil(maxHope / HOPE_SLOTS) * HOPE_SLOTS);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
	const n = Number(value);
	if (!Number.isInteger(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

function normalizeSheetSettings(raw: unknown): SheetSettings {
	const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
	const defaults = defaultSheetSettings();
	const currencies = (Array.isArray(s.currencies) ? s.currencies : [])
		.map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>) : {}))
		.map((c) => ({ name: asString(c.name), amount: asString(c.amount) }))
		.filter((c) => c.name !== "" || c.amount !== "");
	return {
		massiveDamage: s.massiveDamage === true,
		maxHp: clampInt(s.maxHp, 1, HP_SLOTS, defaults.maxHp),
		maxStress: clampInt(s.maxStress, 1, STRESS_SLOTS, defaults.maxStress),
		maxHope: clampInt(s.maxHope, 1, 24, defaults.maxHope),
		experienceRows: clampInt(s.experienceRows, EXPERIENCE_ROWS, 20, defaults.experienceRows),
		goldMode: s.goldMode === "custom" ? "custom" : "standard",
		goldLabel: asString(s.goldLabel) || defaults.goldLabel,
		currencies,
		layoutMode: s.layoutMode === "wide" || s.layoutMode === "compact" ? s.layoutMode : "auto",
	};
}

function normalizeWeapon(raw: unknown): CharacterWeapon {
	const w = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
	return {
		name: asString(w.name),
		traitRange: asString(w.traitRange),
		damageDice: asString(w.damageDice),
		feature: asString(w.feature),
	};
}
