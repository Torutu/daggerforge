import { Notice } from "obsidian";
import type { Plugin as ObsidianPlugin } from "obsidian";
import { Adv_View_Type } from "../features/adversaries/index";
import { Env_View_Type } from "../features/environments/index";

export async function adversariesSidebar(plugin: ObsidianPlugin) {
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

export async function openEnvironmentSidebar(plugin: ObsidianPlugin) {
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
