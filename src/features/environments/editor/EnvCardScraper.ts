import { Notice } from "obsidian";
import type { EnvironmentData, EnvSavedFeatureState } from "../../../types/index";

function extractTierAndType(innerCard: Element | null): { tier: string; type: string } {
	const text = innerCard?.querySelector(".df-env-feat-tier-type")?.textContent?.trim() ?? "";
	const words = text.split(" ").filter(Boolean);
	return { tier: words[1] ?? "1", type: words[2] ?? "Exploration" };
}

function extractImpulse(innerCard: Element | null): string {
	const el = Array.from(innerCard?.querySelectorAll("p") ?? []).find((p) =>
		p.textContent?.includes("Impulse:"),
	);
	return el?.textContent?.replace("Impulse:", "").trim() ?? "";
}

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

function extractSingleFeature(feat: Element): EnvSavedFeatureState {
	const rawCost = feat.getAttribute("data-feature-cost") ?? "";

	// New format: single richContent div
	const richEl = feat.querySelector(".df-env-feat-richcontent");
	let richContent: string;

	if (richEl) {
		richContent = richEl.innerHTML;
	} else {
		// Backward compat: old cards had separate text / bullets / textAfter fields.
		// Reassemble them into a single HTML string so the rich editor pre-fills correctly.
		const parts: string[] = [];
		const textNodes = Array.from(feat.querySelectorAll(".df-env-feat-text"));
		const beforeText = textNodes[0]?.innerHTML?.trim();
		if (beforeText) parts.push(`<p>${beforeText}</p>`);

		const bullets = Array.from(feat.querySelectorAll(".df-env-bullet-item"));
		if (bullets.length) {
			const lis = bullets.map((b) => `<li>${b.innerHTML.trim()}</li>`).join("");
			parts.push(`<ul>${lis}</ul>`);
		}

		const afterText = feat.querySelector("#textafter")?.innerHTML?.trim();
		if (afterText) parts.push(`<p>${afterText}</p>`);

		richContent = parts.join("");
	}

	return {
		name: feat.getAttribute("data-feature-name") ?? "",
		type: feat.getAttribute("data-feature-type") ?? "Passive",
		cost: rawCost !== "" ? rawCost : undefined,
		richContent,
		questions: Array.from(
			feat.querySelector(".df-env-questions")?.querySelectorAll(".df-env-question") ?? [],
		)
			.map((q) => q.textContent?.trim() ?? "")
			.filter(Boolean),
	};
}

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
