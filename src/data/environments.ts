import envCore from "./env/envcore.json";
import envVoid from "./env/envvoid.json";
import envSablewood from "./env/envsablewood.json";
import type { EnvironmentData } from "../types/index";

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
];
