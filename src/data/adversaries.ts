import advCore from "./adv/advcore.json";
import advVoid from "./adv/advvoid.json";
import advUmbra from "./adv/advumbra.json";
import advSablewood from "./adv/advSablewood.json";
import advHopeFear from "./adv/advhopefear.json";
import deAdversaries from "./locales/de/adversaries.json";
import type { AdvData } from "../types/index";
import type { Language } from "../i18n";

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
	...(advHopeFear as Record<string, unknown>[]).map(normalizeAdv),
];

type AdversaryFeatureTranslation = Partial<AdvData["features"][number]> & { desc?: string };
type AdversaryTranslation = Partial<Omit<AdvData, "features">> & {
	id: string;
	features?: AdversaryFeatureTranslation[];
};

export function getAdversaries(language: Language): AdvData[] {
	if (language !== "de") return ADVERSARIES;
	const translations = new Map(
		(deAdversaries as AdversaryTranslation[]).map((item) => [item.id, item]),
	);
	return ADVERSARIES.map((item) => {
		const translated = translations.get(item.id);
		if (!translated) return item;
		return {
			...item,
			name: translated.name ?? item.name,
			desc: translated.desc ?? item.desc,
			motives: translated.motives ?? item.motives,
			weaponName: translated.weaponName ?? item.weaponName,
			xp: translated.xp ?? item.xp,
			features: item.features.map((feature, index) => {
				const translatedFeature = translated.features?.[index];
				return {
					...feature,
					name: translatedFeature?.name ?? feature.name,
					cost: translatedFeature?.cost ?? feature.cost,
					richContent: translatedFeature?.richContent ??
						(translatedFeature?.desc ? `<p>${translatedFeature.desc}</p>` : feature.richContent),
				};
			}),
		};
	});
}
