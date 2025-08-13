import envTier1 from "../../../env/env-tier-1.json";
import envTier2 from "../../../env/env-tier-2.json";
import envTier3 from "../../../env/env-tier-3.json";
import envTier4 from "../../../env/env-tier-4.json";

export const ENVIRONMENTS = {
	tier1: envTier1,
	tier2: envTier2,
	tier3: envTier3,
	tier4: envTier4,
};

export type EnvironmentData = (typeof envTier1)[0];
