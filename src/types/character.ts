/**
 * Data model for the Daggerheart character sheet.
 * Mirrors the official fillable character sheet 1:1 - same sections,
 * slot counts, and field names - plus a free-form notes section.
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
/** Markable proficiency circles - the first printed circle is always filled. */
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
 * homebrew knobs - defaults reproduce the printed sheet exactly.
 */
export interface SheetSettings {
	/** Adds a fourth "Massive Damage - Mark 4 HP" threshold block. */
	massiveDamage: boolean;
	/** Slots up to this count render solid; the rest stay dashed. Values above
	 *  12 wrap onto extra lines of 12 slots each (up to 24). */
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
	/** Stable SRD id; absent on legacy and user-authored cards. */
	id?: string;
	name: string;
	description: string;
	features: string;
}

/** A domain ability card in the character's loadout or vault. */
export interface CharacterDomainCard {
	/** Stable SRD id; absent on legacy and user-authored cards. */
	id?: string;
	name: string;
	domain: string;
	level: number;
	type: string;
	recallCost: number;
	text: string;
	inVault: boolean;
}

/** Level Up Guide state. The advancement tables themselves are bundled data
 *  (src/data/levelUpGuide.ts); the character only stores its marks. */
export interface LevelUpState {
	/** Advancements gained per level - the printed rules say 2, but editable. */
	pointsPerLevel: number;
	/** Unspent advancement points ("you have 2 points to spend"). */
	pending: number;
	/** Last sheet Level the pending counter was synced against. */
	lastLevel: number;
	/** Marked slots per advancement option, keyed like "t2.traits". */
	marks: Record<string, number>;
}

export function defaultLevelUp(): LevelUpState {
	return { pointsPerLevel: 2, pending: 0, lastLevel: 1, marks: {} };
}

/** Sync the pending-points counter when the sheet's Level changes: each level
 *  gained adds pointsPerLevel; lowering the level just re-anchors. */
export function applyLevelChange(state: LevelUpState, newLevel: number): LevelUpState {
	if (!Number.isInteger(newLevel) || newLevel < 1 || newLevel === state.lastLevel) return state;
	const gained = Math.max(0, newLevel - state.lastLevel);
	return { ...state, lastLevel: newLevel, pending: state.pending + gained * state.pointsPerLevel };
}

export const COMPANION_STRESS_SLOTS = 6;
export const COMPANION_EXPERIENCES = 5;

/** Ranger Companion sheet, mirroring the printed page. The portrait is a
 *  small data URL so it travels inside share codes and embed snapshots. */
export interface CompanionData {
	name: string;
	art: string;
	evasion: string;
	stress: boolean[];
	experiences: CharacterExperience[];
	/** Standard attack description; damage starts at d6, range at Melee. */
	attack: string;
	range: string;
	/** "d6" | "d8" | "d10" | "d12" - stepped up by Vicious training. */
	damageDie: string;
	/** Marks per training option, keyed like "vicious" (see levelUpGuide.ts). */
	training: Record<string, number>;
}

export function defaultCompanion(): CompanionData {
	return {
		name: "",
		art: "",
		evasion: "",
		stress: new Array(COMPANION_STRESS_SLOTS).fill(false),
		experiences: Array.from({ length: COMPANION_EXPERIENCES }, () => ({ text: "", modifier: "" })),
		attack: "",
		range: "",
		damageDie: "",
		training: {},
	};
}

export interface CharacterData {
	id: string;
	name: string;
	pronouns: string;
	heritage: string;
	classSubclass: string;
	/** Stable SRD ids; empty for legacy or free-form class entries. */
	classId: string;
	subclassId: string;
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
	/** Not on the printed sheet - extra space for session/campaign notes. */
	notes: string;
	ancestryCard: HeritageCardData | null;
	communityCard: HeritageCardData | null;
	/** Optional Hope & Fear transformation card. */
	transformationCard: HeritageCardData | null;
	domainCards: CharacterDomainCard[];
	/** Answers to the class's background/connection questions, index-aligned. */
	backgroundAnswers: string[];
	connectionAnswers: string[];
	/** Name of the Druid Beastform currently assumed ("" when not transformed). */
	activeBeastform: string;
	levelUp: LevelUpState;
	companion: CompanionData;
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
		classId: "",
		subclassId: "",
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
		transformationCard: null,
		domainCards: [],
		backgroundAnswers: [],
		connectionAnswers: [],
		activeBeastform: "",
		levelUp: defaultLevelUp(),
		companion: defaultCompanion(),
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
	base.classId = asString(data.classId);
	base.subclassId = asString(data.subclassId);
	base.level = asString(data.level);
	base.evasion = asString(data.evasion);
	base.armorScore = asString(data.armorScore);
	base.armorSlots = asBooleanArray(data.armorSlots, ARMOR_SLOTS);
	base.majorThreshold = asString(data.majorThreshold);
	base.severeThreshold = asString(data.severeThreshold);
	base.sheetSettings = normalizeSheetSettings(data.sheetSettings);
	base.hp = asBooleanArray(data.hp, trackSlotCount(base.sheetSettings.maxHp, HP_SLOTS));
	base.stress = asBooleanArray(data.stress, trackSlotCount(base.sheetSettings.maxStress, STRESS_SLOTS));
	base.hopeFeature = asString(data.hopeFeature);
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
	base.transformationCard = normalizeHeritageCard(data.transformationCard);
	base.domainCards = (Array.isArray(data.domainCards) ? data.domainCards : [])
		.map(normalizeDomainCard)
		.filter((c): c is CharacterDomainCard => c !== null);
	base.backgroundAnswers = asStringArray(data.backgroundAnswers, 8);
	base.connectionAnswers = asStringArray(data.connectionAnswers, 8);
	base.activeBeastform = asString(data.activeBeastform);
	base.levelUp = normalizeLevelUp(data.levelUp);
	base.companion = normalizeCompanion(data.companion);
	base.lastUpdated = typeof data.lastUpdated === "number" ? data.lastUpdated : Date.now();
	return base;
}

function asStringArray(value: unknown, max: number): string[] {
	return (Array.isArray(value) ? value : []).slice(0, max).map(asString);
}

/** Positive integer marks only; junk keys/values are dropped. */
function asMarkRecord(raw: unknown): Record<string, number> {
	const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
	const marks: Record<string, number> = {};
	for (const [key, value] of Object.entries(source)) {
		const n = Number(value);
		if (Number.isInteger(n) && n > 0 && n <= 9) marks[key] = n;
	}
	return marks;
}

function normalizeLevelUp(raw: unknown): LevelUpState {
	const defaults = defaultLevelUp();
	const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
	return {
		pointsPerLevel: clampInt(s.pointsPerLevel, 0, 9, defaults.pointsPerLevel),
		pending: clampInt(s.pending, -99, 99, defaults.pending),
		lastLevel: clampInt(s.lastLevel, 1, 10, defaults.lastLevel),
		marks: asMarkRecord(s.marks),
	};
}

function normalizeCompanion(raw: unknown): CompanionData {
	const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
	const experiences = Array.isArray(s.experiences) ? s.experiences : [];
	return {
		name: asString(s.name),
		art: typeof s.art === "string" && s.art.startsWith("data:image/") ? s.art : "",
		evasion: asString(s.evasion),
		stress: asBooleanArray(s.stress, COMPANION_STRESS_SLOTS),
		experiences: Array.from({ length: COMPANION_EXPERIENCES }, (_, i) => {
			const e = (experiences[i] && typeof experiences[i] === "object" ? experiences[i] : {}) as Record<
				string,
				unknown
			>;
			return { text: asString(e.text), modifier: asString(e.modifier) };
		}),
		attack: asString(s.attack),
		range: asString(s.range),
		damageDie: asString(s.damageDie),
		training: asMarkRecord(s.training),
	};
}

function normalizeHeritageCard(raw: unknown): HeritageCardData | null {
	if (!raw || typeof raw !== "object") return null;
	const c = raw as Record<string, unknown>;
	const name = asString(c.name);
	if (!name) return null;
	return {
		id: asString(c.id) || undefined,
		name,
		description: asString(c.description),
		features: asString(c.features),
	};
}

function normalizeDomainCard(raw: unknown): CharacterDomainCard | null {
	if (!raw || typeof raw !== "object") return null;
	const c = raw as Record<string, unknown>;
	const name = asString(c.name);
	if (!name) return null;
	return {
		id: asString(c.id) || undefined,
		name,
		domain: asString(c.domain),
		level: typeof c.level === "number" ? c.level : 1,
		type: asString(c.type),
		recallCost: typeof c.recallCost === "number" ? c.recallCost : 0,
		text: asString(c.text),
		inVault: c.inVault === true,
	};
}

/** Tracks render in full lines (HP/Stress: 12, Hope: 6) - the slot count
 *  rounds the configured max up to complete lines. */
export function trackSlotCount(max: number, slotsPerLine: number): number {
	return Math.max(slotsPerLine, Math.ceil(max / slotsPerLine) * slotsPerLine);
}

/** Hope renders in full strips of 6 - the slot count rounds max hope up to one. */
export function hopeSlotCount(maxHope: number): number {
	return trackSlotCount(maxHope, HOPE_SLOTS);
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
		maxHp: clampInt(s.maxHp, 1, 24, defaults.maxHp),
		maxStress: clampInt(s.maxStress, 1, 24, defaults.maxStress),
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
