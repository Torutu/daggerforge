import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const [, , packsArgument, translationsArgument, outputArgument = "src/data/srd/hope-fear"] = process.argv;

if (!packsArgument || !translationsArgument) {
	throw new Error(
		"Usage: node scripts/import-hope-fear-srd.mjs <foundry-packs-dir> <hope_fear_cards_de.json> [output-dir]",
	);
}

const packsPath = resolve(packsArgument);
const translationsPath = resolve(translationsArgument);
const outputPath = resolve(outputArgument);
const localePath = resolve("src/data/srd/locales/de/hope-fear");
const translatedCards = JSON.parse(readFileSync(translationsPath, "utf8")).cards;

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? walk(path) : entry.name.endsWith(".json") ? [path] : [];
	});
}

const records = walk(packsPath)
	.map((path) => JSON.parse(readFileSync(path, "utf8")))
	.filter((record) => record && record._id);
const byId = new Map(records.map((record) => [record._id, record]));

function refId(reference) {
	return reference?.split(".").at(-1) ?? "";
}

function resolveRef(reference) {
	const record = byId.get(refId(reference));
	if (!record) throw new Error(`Missing compendium reference: ${reference}`);
	return record;
}

function decodeEntities(value) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

function htmlToText(html = "") {
	return decodeEntities(html)
		.replace(/\[\[\/r\s+([^\]]+)\]\]\{([^}]+)\}/g, "$2")
		.replace(/\[\[\/r\s+([^\]]+)\]\]/g, "$1")
		.replace(/<strong>(.*?)<\/strong>/gis, "**$1**")
		.replace(/<em>(.*?)<\/em>/gis, "_$1_")
		.replace(/<\/p>\s*<ul>/gi, "\n")
		.replace(/<\/ul>\s*<p>/gi, "\n\n")
		.replace(/<li>\s*<p>/gi, "• ")
		.replace(/<\/p>\s*<\/li>/gi, "\n")
		.replace(/<li>/gi, "• ")
		.replace(/<\/li>/gi, "\n")
		.replace(/<\/p>\s*<p>/gi, "\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/\s+—\s*/g, "—")
		.trim();
}

function feature(reference) {
	const record = resolveRef(reference);
	return { name: record.name, description: htmlToText(record.system?.description) };
}

function titleCase(value) {
	return value
		.toLocaleLowerCase("de-DE")
		.replace(/(^|[\s-])(\p{L})/gu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("de-DE")}`);
}

function displayTitle(value) {
	return titleCase(value).replace(
		/\b(Der|Die|Das|Den|Dem|Des|Ein|Eine|Einer|Eines|Und|Oder|Von|Vom|Im|In|Zu|Zur|Zum|Aus)\b/gu,
		(word, _capture, offset) => (offset === 0 ? word : word.toLocaleLowerCase("de-DE")),
	);
}

const germanTitleOverrides = {
	"executioners-guild": "Gilde der Henker",
	"poisoners-guild": "Gilde der Giftmischer",
	juggernaut: "Bollwerk",
	"martial-artist": "Kampfkunstmeister",
	"pact-of-the-endless": "Pakt des Ewigen",
	"pact-of-the-wrathful": "Pakt des Zornigen",
	hedge: "Heckenmagier",
	moon: "Mond",
	aetheris: "Ätheris",
	earthkin: "Erdkind",
	emberkin: "Glutkind",
	gnome: "Gnom",
	skykin: "Himmelskind",
	tidekin: "Gezeitenkind",
	duneborne: "Aus den Dünen",
	freeborne: "In Freiheit geboren",
	frostborne: "Aus dem Frost",
	hearthborne: "Vom Lande",
	reborne: "Neu verwurzelt",
	warborne: "Vom Krieg geprägt",
	demigod: "Halbgott",
	ghost: "Geist",
	reanimated: "Wiederbelebter",
	shapeshifter: "Gestaltwandler",
	vampire: "Vampir",
	werewolf: "Werwolf",
};

function translatedTitle(english, german) {
	return germanTitleOverrides[slug(english)] ?? displayTitle(german);
}

function signed(value) {
	return value > 0 ? `+${value}` : String(value);
}

const classNames = new Set(["Assassin", "Brawler", "Warlock", "Witch"]);
const classItems = {
	Assassin: "A list of names with several marked off or a rusted blade inscribed with an insignia",
	Brawler: "Hand wraps from a mentor or a book about your secret hobby",
	Warlock: "A carving that symbolizes your patron or a ring you can't remove",
	Witch: "A small, harmless pet or a scrying stone",
};

function suggestedName(reference) {
	return reference ? resolveRef(reference).name : null;
}

function buildSubclass(record) {
	const grouped = { foundation: [], specialization: [], mastery: [] };
	for (const entry of record.system.features) grouped[entry.type].push(feature(entry.item));
	return {
		name: record.name,
		...(record.system.spellcastingTrait
			? { spellcastTrait: titleCase(record.system.spellcastingTrait) }
			: {}),
		foundation: grouped.foundation,
		specialization: grouped.specialization,
		mastery: grouped.mastery,
	};
}

const classRecords = records.filter((record) => record.type === "class" && classNames.has(record.name));
const classes = classRecords.map((record) => {
	const guide = record.system.characterGuide;
	const features = record.system.features.map((entry) => ({ ...entry, value: feature(entry.item) }));
	const hope = features.find((entry) => entry.type === "hope")?.value;
	const linkedSubclasses = records.filter(
		(candidate) =>
			candidate.type === "subclass" &&
			refId(candidate.system?.linkedClass) === record._id,
	);
	const traits = ["agility", "strength", "finesse", "instinct", "presence", "knowledge"]
		.map((name) => signed(guide.suggestedTraits[name]))
		.join(", ");
	return {
		name: record.name,
		description: [htmlToText(record.system.description)],
		stats: {
			domains: record.system.domains.map(titleCase).join(" & "),
			evasion: record.system.evasion,
			hp: record.system.hitPoints,
			suggestedTraits: traits,
			suggestedPrimary: suggestedName(guide.suggestedPrimaryWeapon),
			suggestedSecondary: suggestedName(guide.suggestedSecondaryWeapon),
			suggestedArmor: suggestedName(guide.suggestedArmor),
		},
		items: classItems[record.name],
		hopeFeature: hope ? `${hope.name}: ${hope.description}` : "",
		classFeatures: features.filter((entry) => entry.type === "class").map((entry) => entry.value),
		subclasses: Object.fromEntries(linkedSubclasses.map((item) => [item.name, buildSubclass(item)])),
		backgroundQuestions: record.system.backgroundQuestions,
		connectionQuestions: record.system.connections,
	};
});

function buildHeritage(type) {
	return records
		.filter((record) => record.type === type && /Daggerheart SRD/i.test(record.system?.attribution?.source ?? ""))
		.filter((record) => refId(record.system?.features?.[0]?.item ?? record.system?.features?.[0]) &&
			["Aetheris", "Earthkin", "Emberkin", "Gnome", "Skykin", "Tidekin", "Duneborne", "Freeborne", "Frostborne", "Hearthborne", "Reborne", "Warborne"].includes(record.name))
		.map((record) => ({
			name: record.name,
			description: [htmlToText(record.system.description)],
			features: record.system.features.map((entry) => {
				const resolved = resolveRef(entry.item ?? entry);
				return `${resolved.name}: ${htmlToText(resolved.system.description)}`;
			}),
		}));
}

const ancestries = buildHeritage("ancestry");
const communities = buildHeritage("community");
const dreadCards = records
	.filter((record) => record.type === "domainCard" && record.system?.domain === "dread")
	.map((record) => ({
		name: record.name,
		domain: "Dread",
		type: titleCase(record.system.type),
		level: record.system.level,
		recallCost: record.system.recallCost,
		text: htmlToText(record.system.description),
	}))
	.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

const transformationNames = new Set(["Demigod", "Ghost", "Reanimated", "Shapeshifter", "Vampire", "Werewolf"]);
const transformations = records
	.filter((record) => record.type === "transformation" && transformationNames.has(record.name))
	.map((record) => ({
		name: record.name,
		description: [htmlToText(record.system.description)],
		features: record.system.features.map((reference) => feature(reference)),
		questions: htmlToText(record.system.questions).split("\n").map((line) => line.replace(/^•\s*/, "")).filter(Boolean),
	}));

function slug(value) {
	return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function paragraphs(text) {
	return text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function splitFeatures(text, skipSpellcast = false) {
	const result = [];
	for (const paragraph of paragraphs(text)) {
		if (skipSpellcast && /^ZAUBER-ATTRIBUT:/i.test(paragraph)) continue;
		const match = paragraph.match(/^([^:\n]+):\s*([\s\S]+)$/);
		if (match) result.push({ name: match[1].trim(), description: match[2].trim() });
		else if (result.length) result.at(-1).description += `\n\n${paragraph}`;
	}
	return result;
}

const categoryCards = (category) => translatedCards.filter((card) => card.category === category);
const translatedByEnglishTitle = new Map(
	translatedCards.map((card) => [slug(card.title_en), card.translation]),
);

const deDomains = dreadCards.map((card) => {
	const translation = translatedByEnglishTitle.get(slug(card.name));
	if (!translation) throw new Error(`Missing German Dread translation: ${card.name}`);
	return {
		id: `domain-card-dread-${card.level}-${slug(card.name)}`,
		name: translatedTitle(card.name, translation.title_de),
		type: titleCase(translation.label_de),
		text: translation.text_de,
	};
});

function translatedHeritages(category, englishRecords) {
	return englishRecords.map((record) => {
		const translation = translatedByEnglishTitle.get(slug(record.name));
		if (!translation) throw new Error(`Missing German ${category} translation: ${record.name}`);
		const parts = paragraphs(translation.text_de);
		return {
			id: `${category}-${slug(record.name)}`,
			name: translatedTitle(record.name, translation.title_de),
			description: [parts[0]],
			features: splitFeatures(parts.slice(1).join("\n\n")).map((item) => `${item.name}: ${item.description}`),
		};
	});
}

const subclassCards = categoryCards("subclass");
const deSubclasses = {};
for (const card of subclassCards) {
	const key = slug(card.title_en);
	deSubclasses[key] ??= { name: translatedTitle(card.title_en, card.translation.title_de) };
	const phase = { GRUNDLAGE: "foundation", SPEZIALISIERUNG: "specialization", MEISTERSCHAFT: "mastery" }[
		card.translation.label_de.toUpperCase()
	];
	deSubclasses[key][phase] = splitFeatures(card.translation.text_de, true);
	const spellcast = card.translation.text_de.match(/^ZAUBER-ATTRIBUT:\s*([^\n]+)/im)?.[1];
	if (spellcast) deSubclasses[key].spellcastTrait = titleCase(spellcast);
}

for (const subclass of Object.values(deSubclasses)) {
	for (const phase of ["foundation", "specialization", "mastery"]) subclass[phase] ??= [];
}

const deTransformations = transformations.map((record) => {
	const translation = translatedByEnglishTitle.get(slug(record.name));
	const parts = paragraphs(translation.text_de);
	return {
		id: `transformation-${slug(record.name)}`,
		name: translatedTitle(record.name, translation.title_de),
		description: [parts[0]],
		features: splitFeatures(parts.slice(1).join("\n\n")),
	};
});

mkdirSync(outputPath, { recursive: true });
mkdirSync(localePath, { recursive: true });
const outputs = {
	[join(outputPath, "classes.json")]: classes,
	[join(outputPath, "ancestries.json")]: ancestries,
	[join(outputPath, "communities.json")]: communities,
	[join(outputPath, "domains.json")]: dreadCards,
	[join(outputPath, "transformations.json")]: transformations,
	[join(localePath, "subclasses.json")]: deSubclasses,
	[join(localePath, "ancestries.json")]: translatedHeritages("ancestry", ancestries),
	[join(localePath, "communities.json")]: translatedHeritages("community", communities),
	[join(localePath, "domains.json")]: deDomains,
	[join(localePath, "transformations.json")]: deTransformations,
};

for (const [path, value] of Object.entries(outputs)) {
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`);
	console.log(`${basename(path)}: ${Array.isArray(value) ? value.length : Object.keys(value).length}`);
}
