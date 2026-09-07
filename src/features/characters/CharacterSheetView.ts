import { translate } from "../../i18n";
import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { CharacterSheetApp } from "./CharacterSheetApp";
import { getDaggerForgePlugin } from "../../utils/pluginOperations";

export const Character_Sheet_View_Type = "daggerforge:character-sheet";

export class CharacterSheetView extends ItemView {
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) { super(leaf); }

	getViewType()    { return Character_Sheet_View_Type; }
	getDisplayText() { return translate("ui.character.sheet"); }
	getIcon()        { return "user"; }

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("df-cs-container");

		const plugin = getDaggerForgePlugin(this.app);
		if (!plugin) return;

		this.root = createRoot(container);
		this.root.render(createElement(CharacterSheetApp, { plugin }));
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

/** Open the character sheet in the main workspace area, reusing an open one. */
export async function openCharacterSheet(plugin: Plugin) {
	const existing = plugin.app.workspace.getLeavesOfType(Character_Sheet_View_Type);
	const leaf = existing[0] ?? plugin.app.workspace.getLeaf(true);

	if (!existing[0]) {
		await leaf.setViewState({ type: Character_Sheet_View_Type, active: true });
	}
	plugin.app.workspace.revealLeaf(leaf);
}
