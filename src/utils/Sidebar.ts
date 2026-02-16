import { Notice, Plugin } from "obsidian";
import { Adv_View_Type } from "../features/adversaries/index";
import { Env_View_Type } from "../features/environments/index";

export function registerSideBarView(plugin: Plugin, viewType: string, view: any) {
	plugin.registerView(viewType, (leaf) => new view(leaf));
}

export async function openAdversarySidebar(plugin: Plugin) {
	new Notice("Opening Adversary Browser in sidebar...");
	const leaf = plugin.app.workspace.getRightLeaf(true);
	if (leaf) {
		await leaf.setViewState({
			type: Adv_View_Type,
			active: true,
		});
		plugin.app.workspace.revealLeaf(leaf);
	}
}

export async function openEnvironmentSidebar(plugin: Plugin) {
	new Notice("Opening Environment Browser in sidebar...");
	const leaf = plugin.app.workspace.getRightLeaf(true);
	if (leaf) {
		await leaf.setViewState({
			type: Env_View_Type,
			active: true,
		});
		plugin.app.workspace.revealLeaf(leaf);
	}
}
