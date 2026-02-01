import { AdvData } from "../../../types/index";

// Stats Parsing
// .df-stats collapses into a flat pipe-delimited string:
//   "Difficulty: X | Thresholds: M/S | HP: X | Stress: X ATK: X | WeaponName: range | damage"
// Stress and ATK can merge into one segment when stress has no trailing pipe
// and ATK is preceded by a <br> (invisible in textContent).

function splitStatSegments(statsText: string): string[] {
	return statsText
		.split("|")
		.map((s) => s.trim())
		.filter(Boolean);
}

// Returns everything after the first colon, or the whole string if none.
function valueAfterLabel(segment: string): string {
	const colonIndex = segment.indexOf(":");
	if (colonIndex === -1) return segment.trim();
	return segment.substring(colonIndex + 1).trim();
}

// "Thresholds: major/severe" -> split on "/".
function splitThresholds(segment: string): { major: string; severe: string } {
	const value = valueAfterLabel(segment);
	const slashIndex = value.indexOf("/");
	if (slashIndex === -1) return { major: value, severe: "" };
	return {
		major: value.substring(0, slashIndex).trim(),
		severe: value.substring(slashIndex + 1).trim(),
	};
}

// "WeaponName: range" — name is before the colon, range is after.
function splitWeaponSegment(segment: string): {
	weaponName: string;
	weaponRange: string;
} {
	const colonIndex = segment.indexOf(":");
	if (colonIndex === -1) return { weaponName: segment.trim(), weaponRange: "" };
	return {
		weaponName: segment.substring(0, colonIndex).trim(),
		weaponRange: segment.substring(colonIndex + 1).trim(),
	};
}

interface ParsedStats {
	difficulty: string;
	thresholdMajor: string;
	thresholdSevere: string;
	hp: string;
	stress: string;
	atk: string;
	weaponName: string;
	weaponDamage: string;
}

function parseStatsText(statsText: string): ParsedStats {
	const segments = splitStatSegments(statsText);

	const difficulty = valueAfterLabel(segments[0] ?? "");
	const { major: thresholdMajor, severe: thresholdSevere } = splitThresholds(segments[1] ?? "");
	const hp = valueAfterLabel(segments[2] ?? "");

	const { stress, atk } = parseStressAndAtk(segments);

	// Weapon name+range sit in the segment right after ATK.
	const atkIdx = segments.findIndex((s) => s.includes("ATK"));
	const weaponIdx = atkIdx !== -1 ? atkIdx + 1 : 4;
	const { weaponName } = splitWeaponSegment(segments[weaponIdx] ?? "");

	// Damage is the last segment — strip any trailing "Experience:" that bleeds in.
	const weaponDamage = stripTrailingExperience(segments[segments.length - 1] ?? "");

	return { difficulty, thresholdMajor, thresholdSevere, hp, stress, atk, weaponName, weaponDamage };
}

// Stress and ATK can land in the same segment. Splits them apart by locating "ATK".
function parseStressAndAtk(segments: string[]): { stress: string; atk: string } {
	const atkIdx = segments.findIndex((s) => s.includes("ATK"));

	if (atkIdx === -1) {
		return { stress: segments[3] ? valueAfterLabel(segments[3]) : "", atk: "" };
	}

	const atkSegment = segments[atkIdx];
	const atkPos = atkSegment.indexOf("ATK");

	if (atkPos > 0) {
		// e.g. "Stress: 3 ATK: +3" — stress is everything before "ATK".
		return {
			stress: valueAfterLabel(atkSegment.substring(0, atkPos)),
			atk: valueAfterLabel(atkSegment.substring(atkPos)),
		};
	}

	// "ATK" is at the start — stress is absent or in an earlier segment.
	return {
		stress: atkIdx > 3 ? valueAfterLabel(segments[3] ?? "") : "",
		atk: valueAfterLabel(atkSegment),
	};
}

function stripTrailingExperience(segment: string): string {
	const expIndex = segment.indexOf("Experience");
	return (expIndex !== -1 ? segment.substring(0, expIndex) : segment).trim();
}

// Subtitle Parsing
// Renders as "Tier <n> <Type> <sourceBadge>", e.g. "Tier 2 Bruiser custom".

function parseTier(subtitleText: string): string {
	const words = subtitleText.trim().split(" ").filter(Boolean);
	return words[1] ?? "1";
}

function parseType(subtitleText: string, dataAttr: string): string {
	// data-type is set explicitly at creation — prefer it over positional parsing.
	if (dataAttr) return dataAttr;
	const words = subtitleText.trim().split(" ").filter(Boolean);
	return words[2] ?? "Standard";
}

// Feature Parsing
// Title format: "<name> - <Type>: <Cost>" (cost may be empty after the colon).

interface ParsedFeature {
	name: string;
	type: string;
	cost: string;
	desc: string;
}

function parseFeature(feat: Element): ParsedFeature {
	const titleText = feat.querySelector(".df-feature-title")?.textContent ?? "";
	const { name, type, cost } = parseFeatureTitle(titleText);
	const desc = feat.querySelector(".df-feature-desc")?.textContent?.trim() ?? "";
	return { name, type, cost, desc };
}

function parseFeatureTitle(titleText: string): { name: string; type: string; cost: string } {
	const dashIndex = titleText.indexOf(" - ");
	if (dashIndex === -1) return { name: titleText.trim(), type: "", cost: "" };

	const name = titleText.substring(0, dashIndex).trim();
	const remainder = titleText.substring(dashIndex + 3);

	const colonIndex = remainder.indexOf(":");
	if (colonIndex === -1) return { name, type: remainder.trim(), cost: "" };

	return {
		name,
		type: remainder.substring(0, colonIndex).trim(),
		cost: remainder.substring(colonIndex + 1).trim(),
	};
}

// Main Extraction
// Scrapes a rendered adversary card DOM back into an AdvData object.

export function extractCardData(cardElement: HTMLElement): AdvData {
	const statsText = cardElement.querySelector(".df-stats")?.textContent ?? "";
	const subtitleText = cardElement.querySelector(".df-subtitle")?.textContent ?? "";
	const weaponRange = cardElement.getAttribute("data-weapon-range") ?? "";
	const typeAttr = cardElement.getAttribute("data-type") ?? "";

	const count = cardElement.querySelectorAll(".df-hp-tickboxes").length || 1;
	const stats = parseStatsText(statsText);

	const features = Array.from(cardElement.querySelectorAll(".df-feature")).map(parseFeature);

	return {
		id: cardElement.getAttribute("data-id") ?? "",
		name: cardElement.querySelector("h2")?.textContent?.trim() ?? "",
		tier: parseTier(subtitleText),
		type: parseType(subtitleText, typeAttr),
		desc: cardElement.querySelector(".df-desc")?.textContent?.trim() ?? "",
		motives: cardElement.querySelector(".df-motives-desc")?.textContent?.trim() ?? "",
		difficulty: stats.difficulty,
		thresholdMajor: stats.thresholdMajor,
		thresholdSevere: stats.thresholdSevere,
		hp: stats.hp,
		stress: stats.stress,
		atk: stats.atk,
		weaponName: stats.weaponName,
		weaponRange,
		weaponDamage: stats.weaponDamage,
		xp: cardElement
			.querySelector(".df-experience-line")
			?.textContent?.replace("Experience:", "")
			?.trim() ?? "",
		count: count.toString(),
		features,
	};
}
