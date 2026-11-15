import envCore from "./env/envcore.json";
import envVoid from "./env/envvoid.json";
import envSablewood from "./env/envsablewood.json";
import envHopeFear from "./env/envhopefear.json";
import deEnvironments from "./locales/de/environments.json";
import type { EnvironmentData } from "../types/index";
import type { Language } from "../i18n";

// Shape of a feature as it appears in the bundled SRD JSON - either the
// current richContent form, or the legacy text/bullets/textAfter form.
type RawFeatureJson = {
	name?: string;
	type?: string;
	cost?: string;
	richContent?: string;
	text?: string;
	bullets?: string[];
	textAfter?: string;
	questions?: string[];
};

function buildEnvRichContent(f: RawFeatureJson): string {
	if (f.richContent) return f.richContent;
	const parts: string[] = [];
	if (f.text) parts.push(`<p>${f.text}</p>`);
	if (Array.isArray(f.bullets) && f.bullets.length) {
		parts.push(`<ul>${f.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`);
	}
	if (f.textAfter) parts.push(`<p>${f.textAfter}</p>`);
	return parts.join("");
}

function normalizeEnv(env: Record<string, unknown>): EnvironmentData {
	return {
		...(env as EnvironmentData),
		features: ((env.features as RawFeatureJson[]) || []).map((f) => ({
			name: f.name ?? "",
			type: f.type ?? "Passive",
			cost: f.cost ? f.cost : undefined,
			richContent: buildEnvRichContent(f),
			questions: Array.isArray(f.questions) ? f.questions : [],
		})),
	};
}

export const ENVIRONMENTS: EnvironmentData[] = [
	...(envCore as Record<string, unknown>[]).map(normalizeEnv),
	...(envVoid as Record<string, unknown>[]).map(normalizeEnv),
	...(envSablewood as Record<string, unknown>[]).map(normalizeEnv),
	...(envHopeFear as Record<string, unknown>[]).map(normalizeEnv),
];

type EnvironmentFeatureTranslation = Partial<EnvironmentData["features"][number]> & {
	text?: string;
	bullets?: string[];
	textAfter?: string;
};
type EnvironmentTranslation = Partial<Omit<EnvironmentData, "features">> & {
	id: string;
	features?: EnvironmentFeatureTranslation[];
};

export function getEnvironments(language: Language): EnvironmentData[] {
	if (language !== "de") return ENVIRONMENTS;
	const translations = new Map(
		(deEnvironments as EnvironmentTranslation[]).map((item) => [item.id, item]),
	);
	return ENVIRONMENTS.map((item) => {
		const translated = translations.get(item.id);
		if (!translated) return item;
		return {
			...item,
			name: translated.name ?? item.name,
			desc: translated.desc ?? item.desc,
			impulse: translated.impulse ?? item.impulse,
			potentialAdversaries: translated.potentialAdversaries ?? item.potentialAdversaries,
			features: item.features.map((feature, index) => {
				const translatedFeature = translated.features?.[index];
				return {
					...feature,
					name: translatedFeature?.name ?? feature.name,
					cost: translatedFeature?.cost ?? feature.cost,
					questions: translatedFeature?.questions ?? feature.questions,
					richContent: translatedFeature
						? buildEnvRichContent(translatedFeature) || feature.richContent
						: feature.richContent,
				};
			}),
		};
	});
}
