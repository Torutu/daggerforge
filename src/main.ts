// https://lucide.dev/ for icons

import { Plugin, WorkspaceLeaf, MarkdownView } from "obsidian";
import { AdversaryView, Adv_View_Type, EnvironmentView, Env_View_Type } from "./features/index";
import { DaggerForgeSettingsTab } from "./features/settings/SettingsTab";
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
	handleTickChange,
	applyKeywordColors,
	setDiceTooltipDuration,
	applyTheme,
} from "./utils/index";

/** View types that belong to DaggerForge sidebars — never treated as insert targets. */
const SIDEBAR_VIEW_TYPES = new Set([Adv_View_Type, Env_View_Type]);

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
		this.registerDomEvent(document, "change", handleTickChange);

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
		registerSideBarView(this, Adv_View_Type, AdversaryView);
		registerSideBarView(this, Env_View_Type, EnvironmentView);

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
		});

		function processAllVisibleCards() {
			document
				.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
				.forEach((section) => attachDiceBadges(section));
		}

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
