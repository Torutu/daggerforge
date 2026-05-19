import advCore from "./adv/advcore.json";
import advVoid from "./adv/advvoid.json";
import advUmbra from "./adv/advumbra.json";
import advSablewood from "./adv/advSablewood.json";
import type { AdvData } from "../types/index";

function normalizeAdv(adv: Record<string, unknown>): AdvData {
	return {
		...(adv as AdvData),
		features: ((adv.features as Record<string, unknown>[]) || []).map((f) => ({
			name: String(f.name ?? ""),
			type: String(f.type ?? "Passive"),
			cost: String(f.cost ?? ""),
			richContent: f.richContent
				? String(f.richContent)
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
