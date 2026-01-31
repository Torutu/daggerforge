import { AdvData } from "../../../types/index";
import { Notice } from "obsidian";
// ─── Stats Text Parsing ────────────────────────────────────────────────────
// The .df-stats element renders as a fixed layout:
//
//   Difficulty: <value> | Thresholds: <major>/<severe> | HP: <value> |
//   Stress: <value>
//   ATK: <value> | <weaponName>: <range> | <damage>
//   Experience: <value>
//
// textContent collapses all child elements into one flat string. The segments
// are separated by " | " (pipe with surrounding spaces). Each segment follows
// the pattern "Label: value", except the weapon name/damage segment which is
// just "<name>: <range> | <damage>" — it has no "Label:" prefix.
//
// Strategy: split on " | ", then extract values from each known position.
// The Experience line lives in its own .df-experience-line element and is
// extracted directly by selector — it does not need to be parsed from the
// stats string.

/** Split the raw stats text into trimmed, non-empty segments. */
function splitStatSegments(statsText: string): string[] {
	return statsText
		.split("|")
		.map((s) => s.trim()) // removes whitespace from both ends of a string
		.filter(Boolean); // removes empty strings
}

/**
 * Extract the value portion of a "Label: value" segment.
 * Returns everything after the first colon, trimmed.
 * If there is no colon, returns the whole segment trimmed.
 */
function valueAfterLabel(segment: string): string {
	const colonIndex = segment.indexOf(":");
	if (colonIndex === -1) return segment.trim();
	return segment.substring(colonIndex + 1).trim();
}

/**
 * The Thresholds segment is "Thresholds: <major>/<severe>".
 * After extracting the value portion we split on "/" to get the two thresholds.
 */
function splitThresholds(segment: string): { major: string; severe: string } {
	const value = valueAfterLabel(segment);
	const slashIndex = value.indexOf("/");
	if (slashIndex === -1) return { major: value, severe: "" };
	return {
		major: value.substring(0, slashIndex).trim(),
		severe: value.substring(slashIndex + 1).trim(),
	};
}

/**
 * The weapon segment is "<weaponName>: <range>" — no standard "Label:" prefix.
 * The weapon name is everything before the first colon. The range is everything
 * after it.
 */
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

/**
 * Parse the full flat stats text into a record of labelled values.
 *
 * Actual textContent layout (pipes are the only delimiters; <br> produces
 * nothing in textContent):
 *
 *   "Difficulty: 14 | Thresholds: 8/15 | HP: 8 | Stress: 3 ATK: +3 | Claws: Very Close | 1d12+2 phy Experience: ..."
 *                                                  ^^^^^^^^^^^^^^^^^^^^^^
 *                                                  single segment when stress is present
 *
 * When stress is absent the HP segment is followed directly by ATK:
 *   "... HP: 8 | ATK: +3 | ..."
 *
 * The stress span in CardBuilder has no trailing " |" and the ATK label is
 * preceded by a <br> (which vanishes in textContent), so stress and ATK end
 * up in the same pipe-delimited segment.  We find "ATK" inside that merged
 * segment and split on it to recover both values.
 */
function parseStatsText(statsText: string): {
	difficulty: string;
	thresholdMajor: string;
	thresholdSevere: string;
	hp: string;
	stress: string;
	atk: string;
	weaponName: string;
	weaponDamage: string;
} {
	const segments = splitStatSegments(statsText);

	const difficulty = valueAfterLabel(segments[0] ?? "");

	const { major: thresholdMajor, severe: thresholdSevere } = splitThresholds(
		segments[1] ?? "",
	);

	const hp = valueAfterLabel(segments[2] ?? "");

	// Find which segment contains "ATK".  When stress is present it is
	// merged into the same segment as stress (see comment above).
	const atkSegmentIndex = segments.findIndex((s) => s.includes("ATK"));

	let stress = "";
	let atk = "";

	if (atkSegmentIndex === -1) {
		// Fallback: no ATK found at all — just try index 3 as stress
		stress = segments[3] ? valueAfterLabel(segments[3]) : "";
	} else {
		const atkSegment = segments[atkSegmentIndex];
		const atkPos = atkSegment.indexOf("ATK");

		if (atkPos > 0) {
			// Something sits before "ATK" in this segment — that's stress.
			// e.g. "Stress: 3 ATK: +3"  →  before="Stress: 3 "  after="ATK: +3"
			stress = valueAfterLabel(atkSegment.substring(0, atkPos));
			atk = valueAfterLabel(atkSegment.substring(atkPos));
		} else {
			// "ATK" is at the start — stress is absent (or was in an earlier segment)
			if (atkSegmentIndex > 3) {
				stress = valueAfterLabel(segments[3] ?? "");
			}
			atk = valueAfterLabel(atkSegment);
		}
	}

	// Weapon name and range sit in the segment immediately after the ATK segment.
	const weaponSegIdx = atkSegmentIndex !== -1 ? atkSegmentIndex + 1 : 4;
	const { weaponName } = splitWeaponSegment(
		segments[weaponSegIdx] ?? "",
	);

	// Weapon damage is the last segment.  Strip any trailing "Experience: ..."
	// that bleeds in when the experience line shares the same textContent block.
	const lastSegment = segments[segments.length - 1] ?? "";
	const expIndex = lastSegment.indexOf("Experience");
	const weaponDamage = (
		expIndex !== -1 ? lastSegment.substring(0, expIndex) : lastSegment
	).trim();

	return {
		difficulty,
		thresholdMajor,
		thresholdSevere,
		hp,
		stress,
		atk,
		weaponName,
		weaponDamage,
	};
}

// ─── Subtitle Parsing ──────────────────────────────────────────────────────
// The subtitle renders as "Tier <n> <Type> <sourceBadge>".
// textContent gives something like "Tier 2 Bruiser custom".
// Tier is at word index 1, type is at word index 2.

/** Split text into words, collapsing any runs of whitespace. */
function splitWords(text: string): string[] {
	return text.trim().split(" ").filter(Boolean);
}

function parseTier(subtitleText: string): string {
	const words = splitWords(subtitleText);
	// words[0] = "Tier", words[1] = the number
	return words[1] ?? "1";
}

function parseType(subtitleText: string, dataAttr: string): string {
	// Prefer the data attribute — it is set explicitly during card creation
	// and is guaranteed to be clean. Fall back to positional parsing only if
	// the attribute is missing.
	if (dataAttr) return dataAttr;

	const words = splitWords(subtitleText);
	// words[2] = the type
	return words[2] ?? "Standard";
}

// ─── Feature Title Parsing ─────────────────────────────────────────────────
// Feature titles render as "<Name> - <Type>: <Cost>" or "<Name> - <Type>:"
// (colon is always present; cost may be empty).

interface ParsedFeatureTitle {
	name: string;
	type: string;
	cost: string;
}

function parseFeatureTitle(titleText: string): ParsedFeatureTitle {
	// Split on " - " to separate name from the rest.
	const dashIndex = titleText.indexOf(" - ");
	if (dashIndex === -1) return { name: titleText.trim(), type: "", cost: "" };

	const name = titleText.substring(0, dashIndex).trim();
	const remainder = titleText.substring(dashIndex + 3); // skip " - "

	// The remainder is "Type: Cost" or "Type:". Split on the first colon.
	const colonIndex = remainder.indexOf(":");
	if (colonIndex === -1) return { name, type: remainder.trim(), cost: "" };

	const type = remainder.substring(0, colonIndex).trim();
	const cost = remainder.substring(colonIndex + 1).trim();

	return { name, type, cost };
}

// ─── Main Extraction ───────────────────────────────────────────────────────

export function extractCardData(cardElement: HTMLElement): AdvData {
	const statsText =
		cardElement.querySelector(".df-stats")?.textContent ?? "";
	const subtitleText =
		cardElement.querySelector(".df-subtitle")?.textContent ?? "";

	const weaponRange = cardElement.getAttribute("data-weapon-range") ?? "";
	const typeAttr = cardElement.getAttribute("data-type") ?? "";

	const adversaryCount = cardElement.querySelectorAll(".df-hp-tickboxes").length;
	const count = adversaryCount > 0 ? adversaryCount.toString() : "1";

	const stats = parseStatsText(statsText);

	const features = Array.from(
		cardElement.querySelectorAll(".df-feature"),
	).map((feat) => {
		const titleText =
			feat.querySelector(".df-feature-title")?.textContent ?? "";
		const { name, type, cost } = parseFeatureTitle(titleText);

		return {
			name,
			type,
			cost,
			desc: feat.querySelector(".df-feature-desc")?.textContent?.trim() ?? "",
		};
	});

	return {
		id: cardElement.getAttribute("data-id") ?? "",
		name: cardElement.querySelector("h2")?.textContent?.trim() ?? "",
		tier: parseTier(subtitleText),
		type: parseType(subtitleText, typeAttr),
		desc: cardElement.querySelector(".df-desc")?.textContent?.trim() ?? "",
		motives:
			cardElement.querySelector(".df-motives-desc")?.textContent?.trim() ?? "",
		difficulty: stats.difficulty,
		thresholdMajor: stats.thresholdMajor,
		thresholdSevere: stats.thresholdSevere,
		hp: stats.hp,
		stress: stats.stress,
		atk: stats.atk,
		weaponName: stats.weaponName,
		weaponRange,
		weaponDamage: stats.weaponDamage,
		xp:
			cardElement
				.querySelector(".df-experience-line")
				?.textContent?.replace("Experience:", "")
				?.trim() ?? "",
		count,
		features,
	};
}
