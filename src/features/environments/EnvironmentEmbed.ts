import { EventRef, MarkdownRenderChild } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { getEnvironments } from "../../data/environments";
import { getLanguage } from "../../i18n";
import { EnvironmentData } from "../../types/index";
import { attachDiceBadges } from "../../utils/diceBadges";
import { buildEmbedBlock, EmbedParams, generateInstanceToken, parseEmbedParams } from "../embeds/blockParams";
import { decodeEnvironmentCode } from "../embeds/embedCode";
import { embedStateKey, renderMissingEmbed } from "../embeds/embedShared";
import { envToHtml } from "./EnvToHtml";

/**
 * Live environment card embeds:
 *
 *   ```daggerforge-environment
 *   id: CE001
 *   instance: k3x9f2
 *   ```
 *
 * Same model as adversary embeds: renders from stored data (custom shadows
 * bundled), interactive countdowns/collapse keyed off the instance token,
 * re-renders on record changes.
 */
export const Environment_Embed_Language = "daggerforge-environment";

export function findEnvironmentById(plugin: DaggerForgePlugin, id: string): EnvironmentData | null {
	return (
		plugin.dataManager.getEnvironments().find((e) => e.id === id) ??
		getEnvironments(getLanguage()).find((e) => e.id === id) ??
		null
	);
}

export function buildEnvironmentEmbedBlock(id: string, code?: string): string {
	return buildEmbedBlock(Environment_Embed_Language, {
		id,
		instance: generateInstanceToken(),
		code,
	});
}

class EnvironmentEmbedChild extends MarkdownRenderChild {
	private refs: EventRef[] = [];
	// Decoded `code:` snapshot, used only when the id isn't in this vault
	private snapshot: EnvironmentData | null = null;
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
			events.on("environment-changed", (env: EnvironmentData) => {
				if (env.id === this.params.id) this.render();
			}),
			events.on("environment-deleted", (id: string) => {
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

		const stored = this.params.id ? findEnvironmentById(this.plugin, this.params.id) : null;
		const env = stored ?? this.snapshot;
		if (!env) {
			if (this.params.code && !this.snapshotTried) {
				this.snapshotTried = true;
				void decodeEnvironmentCode(this.params.code).then((decoded) => {
					this.snapshot = decoded;
					this.render();
				});
				return;
			}
			renderMissingEmbed(el, "Environment", this.params.id);
			return;
		}

		const html = envToHtml(env, false, embedStateKey(this.params));
		el.insertAdjacentHTML("beforeend", html);

		const section = el.querySelector<HTMLElement>("section");
		if (section) {
			section.setAttribute("data-df-embed-id", env.id || this.params.id || "");
			section.setAttribute("data-df-embed-kind", "environment");
			if (this.params.instance) section.setAttribute("data-df-embed-instance", this.params.instance);
			section.setAttribute("data-df-embed-src", this.sourcePath ?? "");
			// Snapshot-rendered card: let the edit flow decode it and save it locally
			if (!stored && this.params.code) section.setAttribute("data-df-embed-code", this.params.code);
			attachDiceBadges(section);
		}
	}
}

export function registerEnvironmentEmbed(plugin: DaggerForgePlugin): void {
	plugin.registerMarkdownCodeBlockProcessor(Environment_Embed_Language, (source, el, ctx) => {
		ctx.addChild(new EnvironmentEmbedChild(el, plugin, parseEmbedParams(source), ctx.sourcePath));
	});
}
