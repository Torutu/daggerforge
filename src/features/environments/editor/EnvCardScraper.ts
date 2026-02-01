import { Notice } from "obsidian";
import type { EnvironmentData, EnvSavedFeatureState } from "../../../types/index";

// Subtitle Parsing
// Renders as "Tier <n> <Type>", e.g. "Tier 2 Exploration".

function extractTierAndType(innerCard: Element | null): { tier: string; type: string } {
	const text = innerCard?.querySelector(".df-env-feat-tier-type")?.textContent?.trim() ?? "";
	const words = text.split(" ").filter(Boolean);
	return { tier: words[1] ?? "1", type: words[2] ?? "Exploration" };
}

// Impulse
// No dedicated class — find it by scanning <p> elements for "Impulse:" prefix.

function extractImpulse(innerCard: Element | null): string {
	const el = Array.from(innerCard?.querySelectorAll("p") ?? []).find((p) =>
		p.textContent?.includes("Impulse:"),
	);
	return el?.textContent?.replace("Impulse:", "").trim() ?? "";
}

// Difficulty & Potential Adversaries
// Both are <p> elements inside .df-env-card-diff-pot.

function extractDifficultyAndAdversaries(innerCard: Element | null): {
	difficulty: string;
	potentialAdversaries: string;
} {
	const paragraphs = Array.from(
		innerCard?.querySelector(".df-env-card-diff-pot")?.querySelectorAll("p") ?? [],
	);

	return {
		difficulty:
			paragraphs.find((p) => p.textContent?.includes("Difficulty"))
				?.textContent?.split(":")[1]?.trim() ?? "",
		potentialAdversaries:
			paragraphs.find((p) => p.textContent?.includes("Potential Adversaries"))
				?.textContent?.split(":")[1]?.trim() ?? "",
	};
}

// Feature Parsing
// Name, type, cost live as data attributes. Body content (text, bullets,
// continuation text, questions) is read from child elements by selector.

function extractSingleFeature(feat: Element): EnvSavedFeatureState {
	const rawCost = feat.getAttribute("data-feature-cost") ?? "";

	return {
		name: feat.getAttribute("data-feature-name") ?? "",
		type: feat.getAttribute("data-feature-type") ?? "Passive",
		cost: rawCost !== "" ? rawCost : undefined,
		text: feat.querySelector(".df-env-feat-text")?.textContent?.trim() ?? "",
		bullets: Array.from(feat.querySelectorAll(".df-env-bullet-item"))
			.map((b) => b.textContent?.trim() ?? "")
			.filter(Boolean),
		textAfter: feat.querySelector("#textafter")?.textContent?.trim() || undefined,
		questions: Array.from(
			feat.querySelector(".df-env-questions")?.querySelectorAll(".df-env-question") ?? [],
		)
			.map((q) => q.textContent?.trim() ?? "")
			.filter(Boolean),
	};
}

// Main Extraction
// Scrapes a rendered environment card DOM back into an EnvironmentData object.

export function extractEnvironmentData(cardElement: HTMLElement, cardName: string): EnvironmentData {
	const inner = cardElement.querySelector(".df-env-card-inner");
	const { tier, type } = extractTierAndType(inner);
	const { difficulty, potentialAdversaries } = extractDifficultyAndAdversaries(inner);

	const features = Array.from(
		inner?.querySelector(".df-features-section")?.querySelectorAll(".df-feature") ?? [],
	).map(extractSingleFeature);

	return {
		id: "",
		name: cardName,
		tier,
		type,
		desc: inner?.querySelector(".df-env-desc")?.textContent?.trim() ?? "",
		impulse: extractImpulse(inner),
		difficulty,
		potentialAdversaries,
		source: "custom",
		features,
	};
}
