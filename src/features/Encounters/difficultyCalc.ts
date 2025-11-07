import { Notice } from "obsidian";
import type { Plugin as ObsidianPlugin } from "obsidian";

export async function openEncounterCalculator(plugin: ObsidianPlugin) {
    new Notice("Opening Encounter Calculator in sidebar...");
    const leaf = plugin.app.workspace.getRightLeaf(true);
    if (leaf) {
        await leaf.setViewState({
            type: "encounter-calculator-view",
            active: true,
        });
    }
    plugin.app.workspace.rightSplit.expand();
}