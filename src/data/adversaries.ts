import adversariesTier1 from "../../../adversaries/Adversaries-Tier-1.json";
import adversariesTier2 from "../../../adversaries/Adversaries-Tier-2.json";
import adversariesTier3 from "../../../adversaries/Adversaries-Tier-3.json";
import adversariesTier4 from "../../../adversaries/Adversaries-Tier-4.json";

export const ADVERSARIES = {
	tier1: adversariesTier1,
	tier2: adversariesTier2,
	tier3: adversariesTier3,
	tier4: adversariesTier4,
};

export type AdversaryData = (typeof adversariesTier1)[0];
