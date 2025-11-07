import adversariesTier1 from "adversaries/Adversaries-Tier-1.json";
import adversariesTier2 from "adversaries/Adversaries-Tier-2.json";
import adversariesTier3 from "adversaries/Adversaries-Tier-3.json";
import adversariesTier4 from "adversaries/Adversaries-Tier-4.json";

// Combine all adversaries into one flat array
export const ADVERSARIES = [
	...adversariesTier1,
	...adversariesTier2,
	...adversariesTier3,
	...adversariesTier4,
];

export type AdversaryData = (typeof adversariesTier1)[0];