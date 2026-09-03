import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , pdfArgument, outputArgument = "src/data/srd/locales/de/domains.json"] = process.argv;

if (!pdfArgument) {
	throw new Error("Usage: node scripts/extract-core-domain-translations.mjs <cards.pdf> [output.json]");
}

const pdfPath = resolve(pdfArgument);
const outputPath = resolve(outputArgument);
const sourceCards = JSON.parse(readFileSync(new URL("../src/data/srd/domains.json", import.meta.url), "utf8"));
const columns = [28, 208, 388];
const rows = [42, 294, 547];
const translations = new Map();

function slug(value) {
	return value
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function extractCard(page, x, y) {
	return execFileSync(
		"pdftotext",
		["-f", String(page), "-l", String(page), "-x", String(x), "-y", String(y), "-W", "180", "-H", "253", "-layout", pdfPath, "-"],
		{ encoding: "utf8" },
	);
}

function joinParagraph(lines) {
	return lines
		.map((line) => line.trim())
		.filter(Boolean)
		.join("\n")
		// PDF line wrapping inserts hyphens into ordinary words. Preserve
		// intentional compounds such as "Zauber-Attribut" (uppercase continuation),
		// but rejoin lowercase continuations such as "durch-\nzuführen".
		.replace(/(\p{Ll})-\n(\p{Ll})/gu, "$1$2")
		.replace(/\n/g, " ")
		.replace(/(\p{L})-\s+(\p{L})/gu, "$1-$2")
		.replace(/\s+/g, " ")
		.trim();
}

function parseCard(raw) {
	const lines = raw.replace(/\f/g, "").split(/\r?\n/);
	const footerIndex = lines.findIndex((line) => /DH Basis \d{3}\/270/.test(line));
	if (footerIndex < 0) return null;

	const number = Number(lines[footerIndex].match(/DH Basis (\d{3})\/270/)[1]);
	if (number < 82) return { number };
	const typeIndex = lines.findIndex((line) => /^(Fähigkeit|Zauber|Zauberbuch)$/.test(line.trim()));
	if (typeIndex < 0) throw new Error(`Card ${number}: type label not found.`);

	let bodyIndex = typeIndex + 1;
	while (bodyIndex < footerIndex && !lines[bodyIndex].trim()) bodyIndex += 1;
	const nameIndex = bodyIndex;
	bodyIndex += 1;
	while (bodyIndex < footerIndex && /^\s{4,}\S/.test(lines[bodyIndex])) bodyIndex += 1;
	const name = joinParagraph(lines.slice(nameIndex, bodyIndex))
		.replace(/grimoire/gi, "")
		.replace(/\bZauberbuch\b/gi, "")
		.replace(/\s+/g, " ")
		.trim();

	const paragraphs = [];
	let paragraph = [];
	for (const line of lines.slice(bodyIndex, footerIndex)) {
		if (line.trim()) {
			paragraph.push(line);
		} else if (paragraph.length) {
			paragraphs.push(joinParagraph(paragraph));
			paragraph = [];
		}
	}
	if (paragraph.length) paragraphs.push(joinParagraph(paragraph));

	return { number, name, type: lines[typeIndex].trim(), text: paragraphs.join("\n\n") };
}

for (let page = 1; page <= 30; page += 1) {
	for (const y of rows) {
		for (const x of columns) {
			const parsed = parseCard(extractCard(page, x, y));
			if (parsed && parsed.number >= 82) translations.set(parsed.number, parsed);
		}
	}
}

const output = sourceCards.map((card, index) => {
	const number = index + 82;
	const translated = translations.get(number);
	if (!translated) throw new Error(`Missing German translation for card ${number}.`);
	return {
		id: `domain-card-${slug(card.domain)}-${card.level}-${slug(card.name)}`,
		name: translated.name,
		type: translated.type,
		text: translated.text,
	};
});

writeFileSync(outputPath, `${JSON.stringify(output, null, "\t")}\n`);
console.log(`Wrote ${output.length} German domain-card translations to ${outputPath}.`);
