import { Notice } from "obsidian";
import type { Plugin as ObsidianPlugin } from "obsidian";
import { ADVERSARY_VIEW_TYPE } from "./adversarySearch";

export async function openAdversaryCreatorSidebar(plugin: ObsidianPlugin) {
	new Notice("Opening Adversary Creator in sidebar...");
	const leaf = plugin.app.workspace.getRightLeaf(true);
	if (leaf) {
		await leaf.setViewState({
			type: ADVERSARY_VIEW_TYPE,
			active: true,
		});
		await plugin.app.workspace.revealLeaf(leaf);
	}
}
