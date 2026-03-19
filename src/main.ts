// https://lucide.dev/ for icons

import { Plugin, WorkspaceLeaf, MarkdownView } from "obsidian";
import { AdversaryView, Adv_View_Type, EnvironmentView, Env_View_Type } from "./features/index";
import { DataManager } from "./data/index";
import { registerSideBarView, setupRibbonIcon, setupCommands, listenForEditClicks, attachDiceBadges, handleDiceBtnClick } from "./utils/index";

/** View types that belong to DaggerForge sidebars — never treated as insert targets. */
const SIDEBAR_VIEW_TYPES = new Set([Adv_View_Type, Env_View_Type]);

export default class DaggerForgePlugin extends Plugin {
	dataManager: DataManager;
	savedInputStateAdv: Record<string, unknown> = {};
	savedInputStateEnv: Record<string, unknown> = {};
	/**
	 * The last main-area leaf the user explicitly focused (canvas or markdown).
	 * Updated by a single workspace listener so every feature reads the same
	 * source of truth — modals, browser views, and commands all use this.
	 */
	lastMainLeaf: WorkspaceLeaf | null = null;

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();
		this.addStatusBarItem().setText("DaggerForge Active");
		this.registerDomEvent(document, "click", (evt) => listenForEditClicks(evt, this.app, this));
		// Single delegated listener for all dice buttons — survives re-renders
		// because it lives on document, not on individual button elements.
		this.registerDomEvent(document, "click", handleDiceBtnClick);

		// Track the last main-area leaf globally so all features agree on the
		// insert destination regardless of which one is currently focused.
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

		// registerMarkdownPostProcessor handles cards rendered in reading mode.
		// Obsidian passes each rendered HTML block to the callback — we look for
		// any element that IS a card section, or that contains one.
		this.registerMarkdownPostProcessor((element) => {
			processDiceBadgesInElement(element);
		});

		// layout-change fires when a note switches to reading mode, when panes
		// are rearranged, or when a file is opened. This catches cases where
		// the post-processor ran before our plugin was loaded (e.g. on startup).
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				processAllVisibleCards();
			})
		);

		// Also run once immediately in case notes are already open.
		this.app.workspace.onLayoutReady(() => {
			processAllVisibleCards();
		});

		function processAllVisibleCards() {
			document
				.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
				.forEach((section) => attachDiceBadges(section));
		}

		function processDiceBadgesInElement(element: HTMLElement) {
			// The element itself might be the section
			if (
				element.classList.contains("df-card-outer") ||
				element.classList.contains("df-env-card-outer")
			) {
				attachDiceBadges(element);
			}
			// Or it might contain sections
			element
				.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
				.forEach((section) => attachDiceBadges(section));
		}
	}
}
