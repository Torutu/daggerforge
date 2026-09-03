import {
	CharacterData,
	CharacterWeapon,
	createEmptyCharacter,
	HeritageCardData,
	TRAIT_NAMES,
} from "../../types/character";
import { SrdArmor, SrdClass, SrdHeritage, SrdWeapon } from "../../types/srd";
import {
	SRD_EQUIPMENT,
	getSrdAncestries,
	getSrdClasses,
	getSrdCommunities,
	getSrdDomainCards,
	getSrdTransformations,
} from "../../data/srd";
import { getLanguage } from "../../i18n";

/** Selections made in the guided creation wizard. Everything is optional -
 *  skipped steps simply leave those parts of the sheet blank. */
export interface CreationChoices {
	classId?: string;
	subclassId?: string;
	ancestryId?: string;
	/** Second ancestry for a mixed heritage: first feature of the first
	 *  ancestry combined with the second feature of this one. */
	ancestryId2?: string;
	communityId?: string;
	transformationId?: string;
	/** Starting experiences (SRD: two, each at +2). */
	experiences?: string[];
	domainCardIds?: string[];
}

/** SRD mixed ancestry: the first-listed feature of one ancestry plus the
 *  second-listed feature of another. */
export function composeMixedHeritage(
	primary: SrdHeritage,
	secondary: SrdHeritage,
): HeritageCardData {
	const firstFeature = primary.features[0];
	const secondFeature = secondary.features[1] ?? secondary.features[0];
	return {
		id: `mixed-${primary.id}-${secondary.id}`,
		name: `${primary.name} / ${secondary.name}`,
		description: `Mixed ancestry: ${primary.name} and ${secondary.name}.`,
		features: [firstFeature, secondFeature].filter(Boolean).join("\n\n"),
	};
}

export function toHeritageCard(heritage: SrdHeritage): HeritageCardData {
	return {
		id: heritage.id,
		name: heritage.name,
		description: heritage.description.join("\n\n"),
		features: heritage.features.join("\n\n"),
	};
}

/** SRD step 5: standard starting inventory for every new character. */
const STARTING_INVENTORY =
	"Torch, 50 feet of rope, basic supplies, a Minor Health Potion or Minor Stamina Potion";

/**
 * Builds a level-1 character from wizard choices, following the SRD's
 * character creation steps: class stats, suggested traits and equipment,
 * heritage, 2 starting Hope, one handful of gold, and chosen domain cards.
 * Pure function - the wizard UI stays thin and this stays unit-testable.
 */
export function buildCharacterFromChoices(choices: CreationChoices, id: string): CharacterData {
	const char = createEmptyCharacter(id);
	const language = getLanguage();
	const classes = getSrdClasses(language);
	const ancestries = getSrdAncestries(language);
	const communities = getSrdCommunities(language);
	const domainCards = getSrdDomainCards(language);
	const transformations = getSrdTransformations(language);

	char.level = "1";
	char.hope = char.hope.map((_, i) => i < 2);
	char.goldHandfuls = char.goldHandfuls.map((_, i) => i < 1);
	char.inventory = STARTING_INVENTORY;

	const srdClass = classes.find((c) => c.id === choices.classId);
	if (srdClass) applyClass(char, srdClass, choices.subclassId);

	const ancestry = ancestries.find((a) => a.id === choices.ancestryId);
	const ancestry2 = ancestries.find((a) => a.id === choices.ancestryId2);
	if (ancestry && ancestry2) char.ancestryCard = composeMixedHeritage(ancestry, ancestry2);
	else if (ancestry) char.ancestryCard = toHeritageCard(ancestry);

	const community = communities.find((c) => c.id === choices.communityId);
	if (community) char.communityCard = toHeritageCard(community);
	const transformation = transformations.find((item) => item.id === choices.transformationId);
	if (transformation) {
		char.transformationCard = {
			id: transformation.id,
			name: transformation.name,
			description: transformation.description.join("\n\n"),
			features: transformation.features.map((feature) => `${feature.name}: ${feature.description}`).join("\n\n"),
		};
	}

	char.heritage = [char.ancestryCard?.name, community?.name].filter(Boolean).join(" ");

	(choices.experiences ?? [])
		.map((text) => text.trim())
		.filter(Boolean)
		.slice(0, char.experiences.length)
		.forEach((text, i) => {
			char.experiences[i] = { text, modifier: "+2" };
		});

	char.domainCards = (choices.domainCardIds ?? [])
		.map((id) => domainCards.find((c) => c.id === id))
		.filter((c): c is NonNullable<typeof c> => Boolean(c))
		.map((c) => ({ ...c, inVault: false }));

	return char;
}

function applyClass(char: CharacterData, srdClass: SrdClass, subclassId?: string): void {
	const subclass = subclassId
		? srdClass.subclasses.find((candidate) => candidate.id === subclassId)
		: undefined;

	char.classId = srdClass.id;
	char.subclassId = subclass?.id ?? "";
	char.classSubclass = subclass ? `${srdClass.name} - ${subclass.name}` : srdClass.name;
	char.evasion = String(srdClass.stats.evasion);
	char.hopeFeature = srdClass.hopeFeature;
	// Class HP becomes the sheet's solid-slot count (the cog can adjust it later)
	char.sheetSettings.maxHp = Math.min(12, Math.max(1, srdClass.stats.hp));
	char.notes = `Max HP: ${srdClass.stats.hp} (${srdClass.name})`;
	char.inventory += `\nClass items: ${srdClass.items}`;

	// Suggested trait spread, in printed order (Agility … Knowledge)
	const traitValues = srdClass.stats.suggestedTraits.split(",").map((v) => v.trim());
	TRAIT_NAMES.forEach((name, i) => {
		char.traits[name] = { value: traitValues[i] ?? "", marked: false };
	});

	const features = srdClass.classFeatures.map((f) => `${f.name}: ${f.description}`);
	if (subclass) {
		if (subclass.spellcastTrait) features.push(`Spellcast Trait: ${subclass.spellcastTrait}`);
		for (const f of subclass.foundation) {
			features.push(`${f.name} (${subclass.name} foundation): ${f.description}`);
		}
	}
	char.classFeature = features.join("\n\n");

	const primary = findWeapon(srdClass.stats.suggestedPrimary);
	if (primary) {
		char.primaryWeapon = toCharacterWeapon(primary);
		char.weaponHandOne = true;
		char.weaponHandTwo = primary.burden === "Two-Handed";
	}
	const secondary = findWeapon(srdClass.stats.suggestedSecondary);
	if (secondary) {
		char.secondaryWeapon = toCharacterWeapon(secondary);
		char.weaponHandTwo = true;
	}

	const armor = SRD_EQUIPMENT.armor.find((a) => a.name === srdClass.stats.suggestedArmor);
	if (armor) applyArmor(char, armor);
}

function findWeapon(name: string | null): SrdWeapon | undefined {
	if (!name) return undefined;
	return SRD_EQUIPMENT.weapons.find((w) => w.name === name);
}

/** Converts SRD weapon stats (weapons and combat wheelchairs share the shape)
 *  into a sheet weapon row. Also used by the card picker's Equipment tab. */
export function toCharacterWeapon(weapon: {
	name: string;
	trait: string;
	range: string;
	damage: string;
	damageType: string;
	feature: string | null;
}): CharacterWeapon {
	const damageType = weapon.damageType === "Magical" ? "mag" : "phy";
	return {
		name: weapon.name,
		traitRange: `${weapon.trait} - ${weapon.range}`,
		damageDice: `${weapon.damage} ${damageType}`,
		feature: weapon.feature ?? "",
	};
}

/** Sheet fields an equipped armor fills (thresholds assume +1 for level 1). */
export function armorToPatch(armor: SrdArmor): Partial<CharacterData> {
	return {
		activeArmor: {
			name: armor.name,
			baseThresholds: `${armor.minor} / ${armor.major}`,
			baseScore: String(armor.score),
			feature: armor.feature ?? "",
		},
		armorScore: String(armor.score),
		// Sheet rule: damage thresholds = armor base thresholds + current level (1)
		majorThreshold: String(armor.minor + 1),
		severeThreshold: String(armor.major + 1),
	};
}

function applyArmor(char: CharacterData, armor: SrdArmor): void {
	Object.assign(char, armorToPatch(armor));
}
