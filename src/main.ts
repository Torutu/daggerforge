// https://lucide.dev/ for icons

import { Plugin, WorkspaceLeaf, MarkdownView } from "obsidian";
import { DaggerForgeSettingsTab } from "./features/settings/SettingsTab";
import { ContentBrowserView, Content_Browser_View_Type } from "./features/browser/ContentBrowserView";
import { DataManager } from "./data/index";
import { PluginSettings } from "./types/index";
import {
	registerSideBarView,
	setupRibbonIcon,
	setupCommands,
	listenForEditClicks,
	attachDiceBadges,
	handleDiceBtnClick,
	handleCollapseClick,
	handleWideToggleClick,
	handleTickChange,
	handleCountdownClick,
	handleCountdownTickChange,
	applyKeywordColors,
	setDiceTooltipDuration,
	applyTheme,
} from "./utils/index";

/** View types that belong to DaggerForge sidebars — never treated as insert targets. */
const SIDEBAR_VIEW_TYPES = new Set([Content_Browser_View_Type]);

export default class DaggerForgePlugin extends Plugin {
	dataManager: DataManager;
	settings: PluginSettings;
	savedInputStateAdv: Record<string, unknown> = {};
	savedInputStateEnv: Record<string, unknown> = {};
	lastMainLeaf: WorkspaceLeaf | null = null;

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

		this.settings = this.dataManager.getSettings();
		this.applySettings();

		this.addSettingTab(new DaggerForgeSettingsTab(this.app, this));

		this.addStatusBarItem().setText("DaggerForge Active");
		this.registerDomEvent(document, "click", (evt) => listenForEditClicks(evt, this.app, this));
		this.registerDomEvent(document, "click", handleDiceBtnClick);
		this.registerDomEvent(document, "click", handleCollapseClick);
		this.registerDomEvent(document, "click", handleWideToggleClick);
		this.registerDomEvent(document, "click", handleCountdownClick);
		this.registerDomEvent(document, "change", handleTickChange);
		this.registerDomEvent(document, "change", handleCountdownTickChange);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
				if (!leaf) return;
				const view = leaf.view;
				if (SIDEBAR_VIEW_TYPES.has((view as any).getViewType?.())) return;
				if ((view as any).canvas || view instanceof MarkdownView) {
					this.lastMainLeaf = leaf;
				}
			})
		);

		setupRibbonIcon(this);
		setupCommands(this);
		registerSideBarView(this, Content_Browser_View_Type, ContentBrowserView);

		this.registerMarkdownPostProcessor((element) => {
			processDiceBadgesInElement(element);
		});

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				processAllVisibleCards();
			})
		);

		this.app.workspace.onLayoutReady(() => {
			processAllVisibleCards();

			// Eagerly seed lastMainLeaf so the first insert never fails with
			// "no note open" on mobile, where active-leaf-change hasn't fired yet.
			if (!this.lastMainLeaf) {
				const seed =
					this.app.workspace.getMostRecentLeaf() ??
					this.app.workspace.getLeavesOfType("markdown")[0] ??
					this.app.workspace.getLeavesOfType("canvas")[0];
				if (seed) {
					const v = seed.view;
					if ((v as any).canvas || v instanceof MarkdownView) {
						this.lastMainLeaf = seed;
					}
				}
			}
		});

		function processAllVisibleCards() {
			document
				.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
				.forEach((section) => attachDiceBadges(section));
		}

		// Restore card state the moment a card enters the DOM.
		// layout-change fires before CM6 finishes rendering live-preview widgets,
		// so processAllVisibleCards misses cards that appear asynchronously.
		const cardObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of Array.from(mutation.addedNodes)) {
					if (!(node instanceof HTMLElement)) continue;
					if (node.classList.contains("df-card-outer") || node.classList.contains("df-env-card-outer")) {
						attachDiceBadges(node);
					}
					node.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
						.forEach(card => attachDiceBadges(card));
				}
			}
		});
		cardObserver.observe(document.body, { childList: true, subtree: true });
		this.register(() => cardObserver.disconnect());

		function processDiceBadgesInElement(element: HTMLElement) {
			if (
				element.classList.contains("df-card-outer") ||
				element.classList.contains("df-env-card-outer")
			) {
				attachDiceBadges(element);
			}
			element
				.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
				.forEach((section) => attachDiceBadges(section));
		}
	}

	applySettings(): void {
		applyTheme(this.settings.cardTheme);
		applyKeywordColors(this.settings.keywordHighlighting);
		setDiceTooltipDuration(this.settings.diceBadgeTooltipMs);
	}
}
