import { EventRef, MarkdownRenderChild } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { getAdversaries } from "../../data/adversaries";
import { getLanguage } from "../../i18n";
import { AdvData } from "../../types/index";
import { attachDiceBadges } from "../../utils/diceBadges";
import { buildEmbedBlock, EmbedParams, generateInstanceToken, parseEmbedParams } from "../embeds/blockParams";
import { decodeAdversaryCode } from "../embeds/embedCode";
import { embedStateKey, renderMissingEmbed } from "../embeds/embedShared";
import { advToValues, buildCardHTML } from "./AdvToHtml";

/**
 * Live adversary card embeds:
 *
 *   ```daggerforge-adversary
 *   id: VA013
 *   instance: k3x9f2
 *   count: 3
 *   ```
 *
 * The card renders from stored data (custom shadows bundled) and stays fully
 * interactive - the document-level tick/collapse/countdown handlers key their
 * localStorage state off the instance token, so every placed embed tracks its
 * own HP/stress and survives re-renders and restarts. Edits to the record
 * re-render every embed of that id.
 */
export const Adversary_Embed_Language = "daggerforge-adversary";

export function findAdversaryById(plugin: DaggerForgePlugin, id: string): AdvData | null {
	return (
		plugin.dataManager.getAdversaries().find((a) => a.id === id) ??
		getAdversaries(getLanguage()).find((a) => a.id === id) ??
		null
	);
}

export function buildAdversaryEmbedBlock(id: string, count?: number, code?: string): string {
	return buildEmbedBlock(Adversary_Embed_Language, {
		id,
		instance: generateInstanceToken(),
		count,
		code,
	});
}

class AdversaryEmbedChild extends MarkdownRenderChild {
	private refs: EventRef[] = [];
	// Decoded `code:` snapshot, used only when the id isn't in this vault
	private snapshot: AdvData | null = null;
	private snapshotTried = false;

	constructor(
		containerEl: HTMLElement,
		private plugin: DaggerForgePlugin,
		private params: EmbedParams,
		private sourcePath: string,
	) {
		super(containerEl);
	}

	onload() {
		this.containerEl.addClass("df-embed");
		this.render();

		const events = this.plugin.dataManager.events;
		this.refs = [
			events.on("adversary-changed", (adv: AdvData) => {
				if (adv.id === this.params.id) this.render();
			}),
			events.on("adversary-deleted", (id: string) => {
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

		const stored = this.params.id ? findAdversaryById(this.plugin, this.params.id) : null;
		const adv = stored ?? this.snapshot;
		if (!adv) {
			if (this.params.code && !this.snapshotTried) {
				this.snapshotTried = true;
				void decodeAdversaryCode(this.params.code).then((decoded) => {
					this.snapshot = decoded;
					this.render();
				});
				return;
			}
			renderMissingEmbed(el, "Adversary", this.params.id);
			return;
		}

		const count = this.params.count ?? (Number(adv.count) || 1);
		const html = buildCardHTML(
			advToValues(adv as unknown as Record<string, unknown>, count),
			adv.features.map((f) => ({ ...f, cost: f.cost || "" })),
			false,
			embedStateKey(this.params),
		);
		el.insertAdjacentHTML("beforeend", html);

		const section = el.querySelector<HTMLElement>("section");
		if (section) {
			section.setAttribute("data-df-embed-id", adv.id || this.params.id || "");
			section.setAttribute("data-df-embed-kind", "adversary");
			if (this.params.instance) section.setAttribute("data-df-embed-instance", this.params.instance);
			section.setAttribute("data-df-embed-src", this.sourcePath ?? "");
			// Snapshot-rendered card: let the edit flow decode it and save it locally
			if (!stored && this.params.code) section.setAttribute("data-df-embed-code", this.params.code);
			// Idempotent: injects dice badges, keyword colors, and restores
			// tick/collapse/wide/countdown state from localStorage.
			attachDiceBadges(section);
		}
	}
}

export function registerAdversaryEmbed(plugin: DaggerForgePlugin): void {
	plugin.registerMarkdownCodeBlockProcessor(Adversary_Embed_Language, (source, el, ctx) => {
		ctx.addChild(new AdversaryEmbedChild(el, plugin, parseEmbedParams(source), ctx.sourcePath));
	});
}
