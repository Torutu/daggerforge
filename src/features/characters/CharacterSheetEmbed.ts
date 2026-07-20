import { MarkdownRenderChild } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import type DaggerForgePlugin from "../../main";
import { buildEmbedBlock, parseEmbedParams } from "../embeds/blockParams";
import { pickDestinationAndInsert } from "../embeds/insertDestination";
import { encodeCharacterCode } from "./characterCode";
import { CharacterSheetEmbedApp } from "./CharacterSheetEmbedApp";

/**
 * Live character sheet embeds for notes and canvas. A fenced code block
 *
 *   ```daggerforge-character
 *   id: CHR_xxx
 *   ```
 *
 * renders as the interactive sheet bound to that saved character. Canvas
 * text nodes run the same markdown pipeline, so the block works there too.
 */
export const Character_Embed_Language = "daggerforge-character";

/** Reads the `id:` line from the block body; a bare id also works. */
export function parseCharacterEmbedId(source: string): string | null {
	return parseEmbedParams(source).id;
}

export function buildCharacterEmbedBlock(id: string, code?: string): string {
	return buildEmbedBlock(Character_Embed_Language, { id, code });
}

/**
 * Ties the React root to the markdown renderer's lifecycle: Obsidian calls
 * onunload whenever the widget is destroyed (mode switch, block edit, note
 * close, CM6 discarding off-screen widgets), and unmounting runs the embed
 * app's effect cleanups - which flush any pending debounced save.
 */
class CharacterSheetEmbedChild extends MarkdownRenderChild {
	private root: Root | null = null;

	constructor(
		containerEl: HTMLElement,
		private plugin: DaggerForgePlugin,
		private characterId: string | null,
		private code: string | null,
	) {
		super(containerEl);
	}

	onload() {
		this.containerEl.addClasses(["df-cs-container", "df-cs-embed"]);
		this.root = createRoot(this.containerEl);
		this.root.render(
			createElement(CharacterSheetEmbedApp, {
				plugin: this.plugin,
				characterId: this.characterId,
				code: this.code,
			}),
		);
	}

	onunload() {
		this.root?.unmount();
		this.root = null;
	}
}

export function registerCharacterSheetEmbed(plugin: DaggerForgePlugin): void {
	plugin.registerMarkdownCodeBlockProcessor(Character_Embed_Language, (source, el, ctx) => {
		const params = parseEmbedParams(source);
		ctx.addChild(new CharacterSheetEmbedChild(el, plugin, params.id, params.code));
	});
}

/** Serialized snapshot for the block's `code:` line, so the sheet still renders
 *  in vaults whose plugin data doesn't have this character (e.g. after a sync
 *  that skipped data.json). Undefined when the character isn't stored yet. */
export async function characterEmbedCode(
	plugin: DaggerForgePlugin,
	id: string,
): Promise<string | undefined> {
	const character = plugin.dataManager.getCharacters().find((c) => c.id === id);
	if (!character) return undefined;
	try {
		return await encodeCharacterCode(character);
	} catch (error) {
		console.error("DaggerForge: failed to encode character embed code", error);
		return undefined;
	}
}

/** Asks where to place the sheet (note/canvas picker), then inserts the embed block.
 *  960px wide renders the full two-column sheet; the container queries handle
 *  narrower canvas nodes if the user resizes. */
export async function insertCharacterEmbed(plugin: DaggerForgePlugin, id: string): Promise<void> {
	const code = await characterEmbedCode(plugin, id);
	pickDestinationAndInsert(plugin, buildCharacterEmbedBlock(id, code), { width: 960, height: 1100 });
}
