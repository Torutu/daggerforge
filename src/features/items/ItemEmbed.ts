import { EventRef, MarkdownRenderChild } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { ALL_GEAR } from "../../data/srd";
import { GearData } from "../../types/srd";
import { buildEmbedBlock, EmbedParams, generateInstanceToken, parseEmbedParams } from "../embeds/blockParams";
import { renderMissingEmbed } from "../embeds/embedShared";
import { gearToHtml } from "./ItemToHtml";

/**
 * Live gear embeds (weapons, armor, items, consumables — SRD and custom):
 *
 *   ```daggerforge-item
 *   id: IT007
 *   ```
 *
 * Renders from stored data; custom items re-render everywhere when edited.
 */
export const Item_Embed_Language = "daggerforge-item";

export function findGearById(plugin: DaggerForgePlugin, id: string): GearData | null {
	return (
		plugin.dataManager.getItems().find((i) => i.id === id) ??
		ALL_GEAR.find((i) => i.id === id) ??
		null
	);
}

export function buildItemEmbedBlock(id: string): string {
	return buildEmbedBlock(Item_Embed_Language, { id, instance: generateInstanceToken() });
}

class ItemEmbedChild extends MarkdownRenderChild {
	private refs: EventRef[] = [];

	constructor(
		containerEl: HTMLElement,
		private plugin: DaggerForgePlugin,
		private params: EmbedParams,
	) {
		super(containerEl);
	}

	onload() {
		this.containerEl.addClass("df-embed");
		this.render();

		const events = this.plugin.dataManager.events;
		this.refs = [
			events.on("item-changed", (item: GearData) => {
				if (item.id === this.params.id) this.render();
			}),
			events.on("item-deleted", (id: string) => {
				if (id === this.params.id) this.render();
			}),
			events.on("data-reloaded", () => this.render()),
		];
	}

	onunload() {
		const events = this.plugin.dataManager.events;
		this.refs.forEach((ref) => events.offref(ref));
		this.refs = [];
	}

	private render() {
		const el = this.containerEl;
		el.empty();
		const gear = this.params.id ? findGearById(this.plugin, this.params.id) : null;
		if (!gear) {
			renderMissingEmbed(el, "Item", this.params.id);
			return;
		}
		el.insertAdjacentHTML("beforeend", gearToHtml(gear));
	}
}

export function registerItemEmbed(plugin: DaggerForgePlugin): void {
	plugin.registerMarkdownCodeBlockProcessor(Item_Embed_Language, (source, el, ctx) => {
		ctx.addChild(new ItemEmbedChild(el, plugin, parseEmbedParams(source)));
	});
}
