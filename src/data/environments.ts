import envCore from "./env/envcore.json";
import envVoid from "./env/envvoid.json";
import envSablewood from "./env/envsablewood.json";
import envHopeFear from "./env/envhopefear.json";
import deEnvironments from "./locales/de/environments.json";
import type { EnvironmentData } from "../types/index";
import type { Language } from "../i18n";

function buildEnvRichContent(f: Record<string, unknown>): string {
	if (f.richContent) return String(f.richContent);
	const parts: string[] = [];
	if (f.text) parts.push(`<p>${f.text}</p>`);
	if (Array.isArray(f.bullets) && f.bullets.length) {
		parts.push(`<ul>${(f.bullets as string[]).map((b) => `<li>${b}</li>`).join("")}</ul>`);
	}
	if (f.textAfter) parts.push(`<p>${f.textAfter}</p>`);
	return parts.join("");
}

function normalizeEnv(env: Record<string, unknown>): EnvironmentData {
	return {
		...(env as EnvironmentData),
		features: ((env.features as Record<string, unknown>[]) || []).map((f) => ({
			name: String(f.name ?? ""),
			type: String(f.type ?? "Passive"),
			cost: f.cost ? String(f.cost) : undefined,
			richContent: buildEnvRichContent(f),
			questions: Array.isArray(f.questions) ? (f.questions as string[]) : [],
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
			...translated,
			id: item.id,
			features: item.features.map((feature, index) => {
				const translatedFeature = translated.features?.[index];
				return {
					...feature,
					...translatedFeature,
					richContent: translatedFeature
						? buildEnvRichContent(translatedFeature as Record<string, unknown>)
						: feature.richContent,
				};
			}),
		};
	});
}
