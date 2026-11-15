import { useMemo } from "react";
import { useLanguage } from "../i18n/react";
import { getAdversaries } from "./adversaries";
import { getEnvironments } from "./environments";
import {
	getAllGear,
	getBeastforms,
	getSrdAncestries,
	getSrdClasses,
	getSrdCommunities,
	getSrdConsumables,
	getSrdDomainCards,
	getSrdEquipment,
	getSrdItems,
	getSrdTransformations,
} from "./srd";

/**
 * Thin reactive facade over the canonical localized getters. It owns no data:
 * changing the global language invalidates this memo and returns the matching
 * overlay while stable ids and mechanical fields remain canonical.
 */
export function useLocalizedSrd() {
	const language = useLanguage();
	return useMemo(
		() => ({
			language,
			classes: getSrdClasses(language),
			ancestries: getSrdAncestries(language),
			communities: getSrdCommunities(language),
			domainCards: getSrdDomainCards(language),
			transformations: getSrdTransformations(language),
			equipment: getSrdEquipment(language),
			items: getSrdItems(language),
			consumables: getSrdConsumables(language),
			beastforms: getBeastforms(language),
			gear: getAllGear(language),
			get adversaries() { return getAdversaries(language); },
			get environments() { return getEnvironments(language); },
		}),
		[language],
	);
}
