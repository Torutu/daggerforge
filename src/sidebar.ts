import { Notice } from "obsidian";
import type { Plugin as ObsidianPlugin } from "obsidian";
import { ADVERSARY_VIEW_TYPE } from "./adversarySearch";
import { ENVIRONMENT_VIEW_TYPE } from "./environmentSearch";

export async function adversariesSidebar(plugin: ObsidianPlugin) {
	new Notice("Opening Adversary Creator in sidebar...");
	const leaf = plugin.app.workspace.getRightLeaf(true);
	if (leaf) {
		await leaf.setViewState({
			type: ADVERSARY_VIEW_TYPE,
			active: true,
		});
	}
	plugin.app.workspace.rightSplit.expand();
}

export async function openEnvironmentSidebar(plugin: ObsidianPlugin) {
	new Notice("Opening Environment Cards in sidebar...");
	const leaf = plugin.app.workspace.getRightLeaf(true);
	if (leaf) {
		await leaf.setViewState({
			type: ENVIRONMENT_VIEW_TYPE,
			active: true,
		});
	}
	plugin.app.workspace.rightSplit.expand();
}