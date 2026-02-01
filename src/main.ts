// https://lucide.dev/ for icons

import { Plugin } from "obsidian";
import {
	AdversaryView,
	ADVERSARY_VIEW_TYPE,
	EnvironmentView,
	ENVIRONMENT_VIEW_TYPE,
	handleCardEditClick,
} from "./features/index";
import { DataManager } from "./data/index";
import { createView, setupRibbonIcon, setupCommands } from "./utils/index";

export default class DaggerForgePlugin extends Plugin {
	dataManager: DataManager;
	savedInputStateAdv: Record<string, unknown> = {};
	savedInputStateEnv: Record<string, unknown> = {};

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();
		this.addStatusBarItem().setText("DaggerForge Active");
		this.registerDomEvent(document, "click", (evt) => handleCardEditClick(evt, this.app, this));
		setupRibbonIcon(this);
		setupCommands(this);
		createView(this, ADVERSARY_VIEW_TYPE, AdversaryView);
		createView(this, ENVIRONMENT_VIEW_TYPE, EnvironmentView);
	}
}
