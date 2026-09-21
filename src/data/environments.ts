import envCore from "./env/envcore.json";
import envVoid from "./env/envvoid.json";
import envSablewood from "./env/envsablewood.json";
import type { EnvironmentData } from "../types/index";

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
];
