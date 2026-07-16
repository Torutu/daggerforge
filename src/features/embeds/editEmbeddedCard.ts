import { Notice, TFile } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { AdvData, EnvironmentData } from "../../types/index";
import { AdversaryModal } from "../adversaries/index";
import { EnvironmentModal } from "../environments/index";
import { Adversary_Embed_Language, findAdversaryById } from "../adversaries/AdversaryEmbed";
import { Environment_Embed_Language, findEnvironmentById } from "../environments/EnvironmentEmbed";
import { repointEmbedBlock } from "./embedShared";

/**
 * Edit flow for id-based card embeds. Unlike legacy inline HTML cards (which
 * are DOM-scraped and spliced back into the note text), embeds edit the
 * stored record directly:
 *   • custom record → updated in place; every embed of that id re-renders.
 *   • bundled SRD record → saved as a new custom copy, and this embed's
 *     `id:` line is repointed to the copy (works in notes and canvas files;
 *     falls back to a Notice when the block can't be located).
 */
export function editEmbeddedCard(plugin: DaggerForgePlugin, section: HTMLElement): void {
	const kind = section.getAttribute("data-df-embed-kind");
	const id = section.getAttribute("data-df-embed-id");
	const instance = section.getAttribute("data-df-embed-instance");
	const sourcePath = section.getAttribute("data-df-embed-src") ?? "";
	if (!kind || !id) return;

	if (kind === "adversary") editEmbeddedAdversary(plugin, section, id, instance, sourcePath);
	else editEmbeddedEnvironment(plugin, id, instance, sourcePath);
}

function isCustomId(id: string): boolean {
	return id.startsWith("CUA_") || id.startsWith("CUE_");
}

function editEmbeddedAdversary(
	plugin: DaggerForgePlugin,
	section: HTMLElement,
	id: string,
	instance: string | null,
	sourcePath: string,
): void {
	const adv = findAdversaryById(plugin, id);
	if (!adv) {
		new Notice("This adversary no longer exists.");
		return;
	}

	// The section element only signals edit mode to the modal; prefill is data-based
	const modal = new AdversaryModal(plugin, null, section, structuredClone(adv) as unknown as Record<string, unknown>);
	modal.onEditUpdate = async (_newHTML: string, newData: AdvData) => {
		if (isCustomId(id)) {
			newData.id = id;
			await plugin.dataManager.upsertAdversary(newData);
			new Notice(`Updated ${newData.name}.`);
		} else {
			newData.id = "";
			newData.source = "custom";
			await plugin.dataManager.upsertAdversary(newData);
			await repointOrExplain(plugin, sourcePath, Adversary_Embed_Language, id, instance, newData.id, newData.name);
		}
	};
	modal.open();
}

function editEmbeddedEnvironment(
	plugin: DaggerForgePlugin,
	id: string,
	instance: string | null,
	sourcePath: string,
): void {
	const env = findEnvironmentById(plugin, id);
	if (!env) {
		new Notice("This environment no longer exists.");
		return;
	}

	const modal = new EnvironmentModal(plugin, null, structuredClone(env));
	modal.onEditUpdate = async (_newHTML: string, newData: EnvironmentData) => {
		if (isCustomId(id)) {
			newData.id = id;
			await plugin.dataManager.upsertEnvironment(newData);
			new Notice(`Updated ${newData.name}.`);
		} else {
			newData.id = "";
			newData.source = "custom";
			await plugin.dataManager.upsertEnvironment(newData);
			await repointOrExplain(plugin, sourcePath, Environment_Embed_Language, id, instance, newData.id, newData.name);
		}
	};
	modal.open();
}

/**
 * Rewrites this embed's `id:` line to the new custom copy. Handles both
 * markdown notes and canvas files (the block lives inside a text node's
 * JSON there). Falls back to an explanatory Notice when the file or block
 * can't be located.
 */
async function repointOrExplain(
	plugin: DaggerForgePlugin,
	sourcePath: string,
	language: string,
	oldId: string,
	instance: string | null,
	newId: string,
	name: string,
): Promise<void> {
	const fallback = () => new Notice(`Saved "${name}" as a custom copy.`);

	const file = sourcePath ? plugin.app.vault.getAbstractFileByPath(sourcePath) : null;
	if (!(file instanceof TFile)) {
		fallback();
		return;
	}

	let repointed = false;
	await plugin.app.vault.process(file, (content) => {
		if (file.extension === "canvas") {
			try {
				const canvas = JSON.parse(content || "{}");
				for (const node of canvas.nodes ?? []) {
					if (node.type !== "text" || typeof node.text !== "string") continue;
					const updated = repointEmbedBlock(node.text, language, oldId, instance, newId);
					if (updated !== null) {
						node.text = updated;
						repointed = true;
						break;
					}
				}
				return repointed ? JSON.stringify(canvas, null, "\t") : content;
			} catch {
				return content;
			}
		}
		const updated = repointEmbedBlock(content, language, oldId, instance, newId);
		if (updated === null) return content;
		repointed = true;
		return updated;
	});

	if (repointed) new Notice(`Updated ${name}.`);
	else fallback();
}
