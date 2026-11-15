import { getLanguage, Language, translate, TranslationKey } from "./index";

/** Display labels only: callers must keep canonical values in filters and saves. */
const keys: Record<string, TranslationKey> = {
	items: "term.items",
	characters: "term.characters",
	environments: "term.environments",
	adversaries: "term.adversaries",
	consumable: "term.consumable",
	item: "term.item",
	wheelchair: "term.wheelchair",
	armor: "term.armor",
	weapon: "term.weapon",
	agility: "term.agility", strength: "term.strength", finesse: "term.finesse",
	instinct: "term.instinct", presence: "term.presence", knowledge: "term.knowledge",
	bruiser: "term.bruiser", horde: "term.horde", leader: "term.leader",
	minion: "term.minion", ranged: "term.ranged", skulk: "term.skulk",
	social: "term.social", solo: "term.solo", standard: "term.standard", support: "term.support",
	traversal: "term.traversal", exploration: "term.exploration", event: "term.event",
	passive: "term.passive", action: "term.action", reaction: "term.reaction",
	melee: "term.melee", "very close": "term.very.close", close: "term.close",
	far: "term.far", "very far": "term.very.far",
	core: "term.core", custom: "term.custom", "hope-fear": "term.hope.fear",
	sprint: "term.sprint", leap: "term.leap", maneuver: "term.maneuver",
	lift: "term.lift", smash: "term.smash", grapple: "term.grapple",
	control: "term.control", hide: "term.hide", tinker: "term.tinker",
	perceive: "term.perceive", sense: "term.sense", navigate: "term.navigate",
	charm: "term.charm", perform: "term.perform", deceive: "term.deceive",
	recall: "term.recall", analyze: "term.analyze", comprehend: "term.comprehend",
	spellcast: "term.spellcast", "one-handed": "term.oneHanded", "two-handed": "term.twoHanded",
	evasion: "term.evasion",
	spell: "term.spell", ability: "term.ability", grimoire: "term.grimoire",
	arcana: "term.arcana", blade: "term.blade", bone: "term.bone",
	codex: "term.codex", grace: "term.grace", midnight: "term.midnight",
	sage: "term.sage", splendor: "term.splendor", valor: "term.valor",
	dread: "term.dread",
};

export function gameTerm(value: string, language: Language = getLanguage()): string {
	const key = keys[value.toLowerCase()];
	if (key) return translate(key, {}, language);
	// Preserve subtype values and counts rather than treating them as prose.
	const match = value.match(/^([^()]+)(\s*\(.*\))$/);
	if (match) {
		const base = keys[match[1].trim().toLowerCase()];
		if (base) return translate(base, {}, language) + " " + match[2].trim();
	}
	return value;
}
