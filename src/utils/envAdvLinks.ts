import { App, MarkdownView } from "obsidian";
import type DaggerForgePlugin from "../main";
import type { AdvData } from "../types/adversary";
import { ADVERSARIES } from "../data/index";
import { buildCardHTML } from "../features/adversaries/AdvToHtml";
import { injectDiceBadgesIntoHtml } from "./diceBadges";

// Build name → AdvData map. Core first, custom last so custom overwrites core
// (same name = custom is the "latest" version).
function buildNameMap(plugin: DaggerForgePlugin): Map<string, AdvData> {
	const map = new Map<string, AdvData>();
	ADVERSARIES.forEach(a => map.set(a.name.toLowerCase().trim(), a));
	plugin.dataManager.getAdversaries().forEach(a => map.set(a.name.toLowerCase().trim(), a));
	return map;
}

function advDataToValues(adv: AdvData): Record<string, string> {
	return {
		id: adv.id,
		name: adv.name,
		tier: adv.tier,
		type: adv.type,
		desc: adv.desc,
		motives: adv.motives,
		difficulty: adv.difficulty,
		thresholdMajor: adv.thresholdMajor,
		thresholdSevere: adv.thresholdSevere,
		hp: adv.hp,
		stress: adv.stress,
		atk: adv.atk,
		weaponName: adv.weaponName,
		weaponRange: adv.weaponRange,
		weaponDamage: adv.weaponDamage,
		xp: adv.xp,
		count: adv.count ?? "1",
		source: adv.source ?? "custom",
	};
}

// Find the character index immediately after the </section> that closes
// the env card containing the given hidden id.
function findEnvSectionEnd(content: string, cardId: string): number {
	const idPos = content.indexOf(`id="${cardId}"`);
	if (idPos === -1) return -1;
	const sectionStart = content.lastIndexOf("<section", idPos);
	if (sectionStart === -1) return -1;
	let depth = 1;
	let pos = sectionStart + 8;
	while (depth > 0 && pos < content.length) {
		const nextOpen  = content.indexOf("<section",   pos);
		const nextClose = content.indexOf("</section>", pos);
		if (nextClose === -1) return -1;
		if (nextOpen !== -1 && nextOpen < nextClose) { depth++; pos = nextOpen  + 8;  }
		else                                          { depth--; pos = nextClose + 10; }
	}
	return depth === 0 ? pos : -1;
}

/**
 * Scans the "Potential Adversaries" line of an env card and wraps any name
 * that exists in the adversary data with a clickable span.
 * Safe to call multiple times — bails if links are already attached.
 */
export function attachPotentialAdversaryLinks(
	section: HTMLElement,
	plugin: DaggerForgePlugin,
): void {
	if (!section.classList.contains("df-env-card-outer")) return;
	if (section.querySelector(".df-adv-link")) return;

	const advLine = section.querySelector<HTMLElement>(".df-env-adv-line");
	if (!advLine) return;

	const fullText = advLine.textContent ?? "";
	const colonIdx = fullText.indexOf(":");
	if (colonIdx === -1) return;

	const names = fullText
		.slice(colonIdx + 1)
		.split(",")
		.map(n => n.trim())
		.filter(Boolean);
	if (names.length === 0) return;

	const nameMap = buildNameMap(plugin);
	if (!names.some(n => nameMap.has(n.toLowerCase()))) return;

	// Rebuild the paragraph with linked names
	while (advLine.firstChild) advLine.removeChild(advLine.firstChild);

	const label = document.createElement("span");
	label.className = "df-bold-title";
	label.textContent = "Potential Adversaries";
	advLine.appendChild(label);
	advLine.appendChild(document.createTextNode(": "));

	names.forEach((name, i) => {
		if (i > 0) advLine.appendChild(document.createTextNode(", "));
		if (nameMap.has(name.toLowerCase())) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "df-adv-link";
			btn.dataset.advName = name;
			btn.textContent = name;
			advLine.appendChild(btn);
		} else {
			advLine.appendChild(document.createTextNode(name));
		}
	});
}

/**
 * Click handler for .df-adv-link spans. Finds the matching adversary and
 * inserts its card HTML immediately after the parent env card in the note.
 */
export function handleAdvLinkClick(
	evt: MouseEvent,
	app: App,
	plugin: DaggerForgePlugin,
): void {
	const span = (evt.target as HTMLElement).closest<HTMLButtonElement>(".df-adv-link");
	if (!span) return;

	evt.stopPropagation();

	const advName = span.dataset.advName;
	if (!advName) return;

	const adv = buildNameMap(plugin).get(advName.toLowerCase().trim());
	if (!adv) return;

	const envCard = span.closest<HTMLElement>(".df-env-card-outer");
	if (!envCard) return;

	const cardId = envCard.querySelector<HTMLElement>(".df-env-name")?.id;
	if (!cardId) return;

	const view = app.workspace.getActiveViewOfType(MarkdownView)
		?? (app.workspace.getMostRecentLeaf()?.view instanceof MarkdownView
			? app.workspace.getMostRecentLeaf()!.view as MarkdownView
			: null);
	if (!(view instanceof MarkdownView)) return;

	const content = view.editor.getValue();
	const endIdx = findEnvSectionEnd(content, cardId);
	if (endIdx === -1) return;

	const html      = buildCardHTML(advDataToValues(adv), adv.features, false, adv.countdowns);
	const injected  = injectDiceBadgesIntoHtml(html);
	const inserted  = "\n" + injected;
	const pos       = view.editor.offsetToPos(endIdx);
	view.editor.replaceRange(inserted, pos, pos);
	// Move cursor past the inserted block so CM6 doesn't unfold and show raw HTML
	view.editor.setCursor(view.editor.offsetToPos(endIdx + inserted.length));
}
