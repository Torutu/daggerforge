// https://lucide.dev/ for icons

import { Plugin, WorkspaceLeaf, MarkdownView } from "obsidian";
import { AdversaryView, Adv_View_Type, EnvironmentView, Env_View_Type } from "./features/index";
import { DataManager } from "./data/index";
import { registerSideBarView, setupRibbonIcon, setupCommands, listenForEditClicks } from "./utils/index";

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
	}
}
