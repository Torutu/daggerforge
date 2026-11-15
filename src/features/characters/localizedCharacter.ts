import type { Language } from "../../i18n";
import {
	getBeastforms,
	getSrdAncestries,
	getSrdClasses,
	getSrdCommunities,
	getSrdDomainCards,
	getSrdEquipment,
	getSrdTransformations,
} from "../../data/srd";
import type {
	CharacterArmor,
	CharacterData,
	CharacterDomainCard,
	CharacterWeapon,
	HeritageCardData,
} from "../../types/character";
import type { SrdHeritage } from "../../types/srd";
import {
	buildClassFeatureText,
	composeMixedHeritage,
	toCharacterWeapon,
} from "./creationTemplate";

/**
 * Resolves bundled SRD snapshots by stable id for display only. The stored
 * character is never mutated. Legacy and user-authored snapshots without an
 * id deliberately remain unchanged when the interface language changes.
 */
export function resolveCharacterClass(char: CharacterData, language: Language) {
	return char.classId
		? getSrdClasses(language).find((candidate) => candidate.id === char.classId)
		: undefined;
}

export function localizedClassSubclass(char: CharacterData, language: Language): string {
	if (char.customSrdFields.classSubclass) return char.classSubclass;
	const srdClass = resolveCharacterClass(char, language);
	if (!srdClass) return char.classSubclass;
	const subclass = srdClass.subclasses.find((candidate) => candidate.id === char.subclassId);
	return subclass ? `${srdClass.name} - ${subclass.name}` : srdClass.name;
}

export function localizedClassFeature(char: CharacterData, language: Language): string {
	if (char.customSrdFields.classFeature) return char.classFeature;
	const srdClass = resolveCharacterClass(char, language);
	return srdClass
		? buildClassFeatureText(srdClass, char.subclassId || undefined, language)
		: char.classFeature;
}

export function localizedHopeFeature(char: CharacterData, language: Language): string {
	if (char.customSrdFields.hopeFeature) return char.hopeFeature;
	return resolveCharacterClass(char, language)?.hopeFeature ?? char.hopeFeature;
}

function mixedHeritageById(id: string, language: Language): HeritageCardData | undefined {
	const ancestries = getSrdAncestries(language);
	for (const primary of ancestries) {
		for (const secondary of ancestries) {
			if (`mixed-${primary.id}-${secondary.id}` === id) {
				return composeMixedHeritage(primary, secondary, language);
			}
		}
	}
	return undefined;
}

function heritageSnapshot(heritage: SrdHeritage): HeritageCardData {
	return {
		id: heritage.id,
		name: heritage.name,
		description: heritage.description.join("\n\n"),
		features: heritage.features.join("\n\n"),
	};
}

export function localizedHeritageCard(
	card: HeritageCardData | null,
	kind: "ancestry" | "community" | "transformation",
	language: Language,
): HeritageCardData | null {
	if (!card?.id) return card;
	if (kind === "ancestry" && card.id.startsWith("mixed-")) {
		return mixedHeritageById(card.id, language) ?? card;
	}
	if (kind === "transformation") {
		const item = getSrdTransformations(language).find((candidate) => candidate.id === card.id);
		return item
			? {
					id: item.id,
					name: item.name,
					description: item.description.join("\n\n"),
					features: item.features
						.map((feature) => `${feature.name}: ${feature.description}`)
						.join("\n\n"),
				}
			: card;
	}
	const items = kind === "ancestry" ? getSrdAncestries(language) : getSrdCommunities(language);
	const item = items.find((candidate) => candidate.id === card.id);
	return item ? heritageSnapshot(item) : card;
}

export function localizedHeritageSummary(char: CharacterData, language: Language): string {
	if (char.customSrdFields.heritage) return char.heritage;
	const ancestry = localizedHeritageCard(char.ancestryCard, "ancestry", language);
	const community = localizedHeritageCard(char.communityCard, "community", language);
	if (!ancestry?.id && !community?.id) return char.heritage;
	return [ancestry?.name, community?.name].filter(Boolean).join(" ");
}

export function localizedDomainCard(
	card: CharacterDomainCard,
	language: Language,
): CharacterDomainCard {
	if (!card.id) return card;
	const item = getSrdDomainCards(language).find((candidate) => candidate.id === card.id);
	return item ? { ...item, inVault: card.inVault } : card;
}

export function localizedWeapon(
	weapon: CharacterWeapon,
	language: Language,
): CharacterWeapon {
	if (!weapon.id) return weapon;
	const equipment = getSrdEquipment(language);
	const item = [...equipment.weapons, ...equipment.wheelchairs].find(
		(candidate) => candidate.id === weapon.id,
	);
	return item ? toCharacterWeapon(item, language) : weapon;
}

export function localizedArmor(armor: CharacterArmor, language: Language): CharacterArmor {
	if (!armor.id) return armor;
	const item = getSrdEquipment(language).armor.find((candidate) => candidate.id === armor.id);
	return item
		? {
				id: item.id,
				name: item.name,
				baseThresholds: `${item.minor} / ${item.major}`,
				baseScore: String(item.score),
				feature: item.feature ?? "",
			}
		: armor;
}

export function localizedBeastform(char: CharacterData, language: Language) {
	if (!char.activeBeastformId) return undefined;
	return getBeastforms(language).find((candidate) => candidate.id === char.activeBeastformId);
}
