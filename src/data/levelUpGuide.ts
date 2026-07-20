/**
 * The Level Up Guide and Ranger Companion training options, transcribed from
 * the official character sheet pack (Character Sheets and Guides, May 2025).
 * Wording, option order, slot counts, and per-tier differences follow the
 * printed page exactly.
 */

export interface AdvancementOption {
	/** Stable key the character's level-up marks are stored under. */
	key: string;
	text: string;
	slots: number;
	/** Costs both of the level's advancements; its slots are marked together. */
	doubleCost?: boolean;
}

export interface LevelUpTier {
	tier: 2 | 3 | 4;
	label: string;
	levels: string;
	/** The dark banner at the top of the printed column. */
	achievement: string;
	/** "Choose two options..." line under the banner. */
	chooser: string;
	options: AdvancementOption[];
	/** The always-do reminder at the bottom of the printed column. */
	footer: string;
}

const baseOptions = (domainCap: string): AdvancementOption[] => [
	{ key: "traits", slots: 3, text: "Gain a +1 bonus to two unmarked character traits and mark them." },
	{ key: "hp", slots: 2, text: "Permanently gain one Hit Point slot." },
	{ key: "stress", slots: 2, text: "Permanently gain one Stress slot." },
	{ key: "experiences", slots: 1, text: "Permanently gain a +1 bonus to two Experiences." },
	{ key: "domain-card", slots: 1, text: `Choose an additional domain card of your level or lower from a domain you have access to${domainCap}.` },
	{ key: "evasion", slots: 1, text: "Permanently gain a +1 bonus to your Evasion." },
];

const UPPER_TIER_OPTIONS: AdvancementOption[] = [
	{ key: "subclass", slots: 1, text: "Take an upgraded subclass card. Then cross out the multiclass option for this tier." },
	{ key: "proficiency", slots: 2, doubleCost: true, text: "Increase your Proficiency by +1." },
	{ key: "multiclass", slots: 2, doubleCost: true, text: "Multiclass: Choose an additional class for your character, then cross out an unused “Take an upgraded subclass card” and the other multiclass option on this sheet." },
];

const TIER_FOOTER =
	"Update your level and adjust your damage thresholds accordingly. Take an additional domain card of your level or lower from a domain you have access to.";

export const LEVEL_UP_TIERS: LevelUpTier[] = [
	{
		tier: 2,
		label: "Tier 2",
		levels: "Levels 2-4",
		achievement: "At level 2, gain an additional Experience at +2 and gain a +1 bonus to your Proficiency.",
		chooser: "Choose two options from the list below and mark them.",
		options: baseOptions(" (up to level 4)"),
		footer: TIER_FOOTER,
	},
	{
		tier: 3,
		label: "Tier 3",
		levels: "Levels 5-7",
		achievement: "At level 5, gain an additional Experience at +2 and clear all marks on character traits. Then gain a +1 bonus to your Proficiency.",
		chooser: "Choose two options from the list below or any from the previous tier and mark them.",
		options: [...baseOptions(" (up to level 7)"), ...UPPER_TIER_OPTIONS],
		footer: TIER_FOOTER,
	},
	{
		tier: 4,
		label: "Tier 4",
		levels: "Levels 8-10",
		achievement: "At level 8, gain an additional Experience at +2 and clear all marks on character traits. Then gain a +1 bonus to your Proficiency.",
		chooser: "Choose two options from the list below or any from the previous tier and mark them.",
		options: [...baseOptions(""), ...UPPER_TIER_OPTIONS],
		footer: TIER_FOOTER,
	},
];

export function tierForLevel(level: number): 2 | 3 | 4 | null {
	if (level >= 8) return 4;
	if (level >= 5) return 3;
	if (level >= 2) return 2;
	return null;
}

// ── Ranger companion ─────────────────────────────────────────────────────────

export interface CompanionTrainingOption {
	key: string;
	name: string;
	text: string;
	slots: number;
}

/** "When your character levels up, choose one available option for your companion." */
export const COMPANION_TRAINING: CompanionTrainingOption[] = [
	{ key: "intelligent", name: "Intelligent", slots: 3, text: "Your companion gains a permanent +1 bonus to a Companion Experience of your choice." },
	{ key: "light", name: "Light in the Dark", slots: 1, text: "Use this as an additional Hope slot your character can mark." },
	{ key: "comfort", name: "Creature Comfort", slots: 1, text: "Once per rest, when you take time during a quiet moment to give your companion love and attention, you can gain a Hope or you can both clear a Stress." },
	{ key: "armored", name: "Armored", slots: 1, text: "When your companion takes damage, you can mark one of your Armor Slots instead of marking one of their Stress." },
	{ key: "vicious", name: "Vicious", slots: 3, text: "Increase your companion's damage dice or range by one step (d6 to d8, Close to Far, etc.)." },
	{ key: "resilient", name: "Resilient", slots: 3, text: "Your companion gains an additional Stress slot." },
	{ key: "bonded", name: "Bonded", slots: 1, text: "When you mark your last Hit Point, your companion rushes to your side to comfort you. Roll a number of d6s equal to the unmarked Stress slots they have and mark them. If any roll a 6, your companion helps you up. Clear your last Hit Point and return to the scene." },
	{ key: "aware", name: "Aware", slots: 3, text: "Your companion gains a permanent +2 bonus to their Evasion." },
];

export const COMPANION_EXPERIENCE_EXAMPLES =
	"Bold Distraction, Expert Climber, Fetch, Friendly, Guardian of the Forest, Horrifying, Intimidating, Loyal Until the End, Navigation, Nimble, On High Alert, Protective, Scout, Service Animal, Trusted Mount, Vigilant, We Always Find Them";
