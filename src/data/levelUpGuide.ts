/**
 * The Level Up Guide and Ranger Companion training options, transcribed from
 * the official character sheet pack (Character Sheets and Guides, May 2025).
 * Wording, option order, slot counts, and per-tier differences follow the
 * printed page exactly.
 */

import type { TranslationKey } from "../i18n";

export interface AdvancementOption {
	/** Stable key the character's level-up marks are stored under. */
	key: string;
	textKey: TranslationKey;
	slots: number;
	/** Costs both of the level's advancements; its slots are marked together. */
	doubleCost?: boolean;
}

export interface LevelUpTier {
	tier: 2 | 3 | 4;
	labelKey: TranslationKey;
	levelsKey: TranslationKey;
	/** The dark banner at the top of the printed column. */
	achievementKey: TranslationKey;
	/** "Choose two options..." line under the banner. */
	chooserKey: TranslationKey;
	options: AdvancementOption[];
	/** The always-do reminder at the bottom of the printed column. */
	footerKey: TranslationKey;
}

const baseOptions = (tier: 2 | 3 | 4): AdvancementOption[] => [
	{ key: "traits", slots: 3, textKey: "levelUp.option.traits" },
	{ key: "hp", slots: 2, textKey: "levelUp.option.hp" },
	{ key: "stress", slots: 2, textKey: "levelUp.option.stress" },
	{ key: "experiences", slots: 1, textKey: "levelUp.option.experiences" },
	{ key: "domain-card", slots: 1, textKey: `levelUp.option.domain.t${tier}` },
	{ key: "evasion", slots: 1, textKey: "levelUp.option.evasion" },
];

const UPPER_TIER_OPTIONS: AdvancementOption[] = [
	{ key: "subclass", slots: 1, textKey: "levelUp.option.subclass" },
	{
		key: "proficiency",
		slots: 2,
		doubleCost: true,
		textKey: "levelUp.option.proficiency",
	},
	{
		key: "multiclass",
		slots: 2,
		doubleCost: true,
		textKey: "levelUp.option.multiclass",
	},
];

export const LEVEL_UP_TIERS: LevelUpTier[] = [
	{
		tier: 2,
		labelKey: "levelUp.tier2.label",
		levelsKey: "levelUp.tier2.levels",
		achievementKey: "levelUp.tier2.achievement",
		chooserKey: "levelUp.tier2.chooser",
		options: baseOptions(2),
		footerKey: "levelUp.footer",
	},
	{
		tier: 3,
		labelKey: "levelUp.tier3.label",
		levelsKey: "levelUp.tier3.levels",
		achievementKey: "levelUp.tier3.achievement",
		chooserKey: "levelUp.upperTier.chooser",
		options: [...baseOptions(3), ...UPPER_TIER_OPTIONS],
		footerKey: "levelUp.footer",
	},
	{
		tier: 4,
		labelKey: "levelUp.tier4.label",
		levelsKey: "levelUp.tier4.levels",
		achievementKey: "levelUp.tier4.achievement",
		chooserKey: "levelUp.upperTier.chooser",
		options: [...baseOptions(4), ...UPPER_TIER_OPTIONS],
		footerKey: "levelUp.footer",
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
	nameKey: TranslationKey;
	textKey: TranslationKey;
	slots: number;
}

/** "When your character levels up, choose one available option for your companion." */
export const COMPANION_TRAINING: CompanionTrainingOption[] = [
	{
		key: "intelligent",
		nameKey: "companion.training.intelligent.name",
		slots: 3,
		textKey: "companion.training.intelligent.text",
	},
	{
		key: "light",
		nameKey: "companion.training.light.name",
		slots: 1,
		textKey: "companion.training.light.text",
	},
	{
		key: "comfort",
		nameKey: "companion.training.comfort.name",
		slots: 1,
		textKey: "companion.training.comfort.text",
	},
	{
		key: "armored",
		nameKey: "companion.training.armored.name",
		slots: 1,
		textKey: "companion.training.armored.text",
	},
	{
		key: "vicious",
		nameKey: "companion.training.vicious.name",
		slots: 3,
		textKey: "companion.training.vicious.text",
	},
	{
		key: "resilient",
		nameKey: "companion.training.resilient.name",
		slots: 3,
		textKey: "companion.training.resilient.text",
	},
	{
		key: "bonded",
		nameKey: "companion.training.bonded.name",
		slots: 1,
		textKey: "companion.training.bonded.text",
	},
	{
		key: "aware",
		nameKey: "companion.training.aware.name",
		slots: 3,
		textKey: "companion.training.aware.text",
	},
];

export const COMPANION_EXPERIENCE_EXAMPLES_KEY: TranslationKey =
	"companion.experience.examples";
