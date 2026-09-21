import advCore from "./adv/advcore.json";
import advVoid from "./adv/advvoid.json";
import advUmbra from "./adv/advumbra.json";
import advSablewood from "./adv/advSablewood.json";
import type { AdvData } from "../types/index";

// Shape of a feature as it appears in the bundled SRD JSON - either the
// current richContent form, or the legacy desc form.
type RawFeatureJson = {
	name?: string;
	type?: string;
	cost?: string;
	richContent?: string;
	desc?: string;
};

function normalizeAdv(adv: Record<string, unknown>): AdvData {
	return {
		...(adv as AdvData),
		features: ((adv.features as RawFeatureJson[]) || []).map((f) => ({
			name: f.name ?? "",
			type: f.type ?? "Passive",
			cost: f.cost ?? "",
			richContent: f.richContent
				? f.richContent
				: f.desc
					? `<p>${f.desc}</p>`
					: "",
		})),
	};
}

export const ADVERSARIES: AdvData[] = [
	...(advCore as Record<string, unknown>[]).map(normalizeAdv),
	...(advVoid as Record<string, unknown>[]).map(normalizeAdv),
	...(advUmbra as Record<string, unknown>[]).map(normalizeAdv),
	...(advSablewood as Record<string, unknown>[]).map(normalizeAdv),
];
