// https://lucide.dev/ for icons

import { Plugin } from "obsidian";
import {
	AdversaryView,
	Adv_View_Type,
	EnvironmentView,
	Env_View_Type,
	handleCardEditClick,
} from "./features/index";
import { DataManager } from "./data/index";
import { registerSideBarView, setupRibbonIcon, setupCommands } from "./utils/index";

export default class DaggerForgePlugin extends Plugin {
	dataManager: DataManager; //declare
	savedInputStateAdv: Record<string, unknown> = {};
	savedInputStateEnv: Record<string, unknown> = {};

	async onload() {
		this.dataManager = new DataManager(this); //initiate
		await this.dataManager.load();
		this.addStatusBarItem().setText("DaggerForge Active");
		this.registerDomEvent(document, "click", (evt) => handleCardEditClick(evt, this.app, this));
		setupRibbonIcon(this);
		setupCommands(this);
		registerSideBarView(this, Adv_View_Type, AdversaryView);
		registerSideBarView(this, Env_View_Type, EnvironmentView);
	}
}
