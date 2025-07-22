import { App, Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { AdversaryView, ADVERSARY_VIEW_TYPE } from "./adversarySearch";
import { EnvironmentView, ENVIRONMENT_VIEW_TYPE } from "./environmentSearch";
import { TextInputModal } from "./adversaryCreator";
import { loadAdversaryTier } from "./adversaryList";
import { openAdversaryCreatorSidebar } from "./sidebar";
import { loadStyleSheet } from "./style";
import { openEnvironmentSidebar } from "./sidebar";

export default class DaggerForgePlugin extends Plugin {
	async onload() {
		await loadStyleSheet(this);

		this.registerView(ADVERSARY_VIEW_TYPE, (leaf) => new AdversaryView(leaf));
		this.addRibbonIcon("venetian-mask", "DaggerHeart Adversary Creator", () => {
			openAdversaryCreatorSidebar(this);
		});
		this.addStatusBarItem().setText("Status Bar Text");

		[1, 2, 3, 4].forEach((tier) => {
			this.addCommand({
				id: `load-tier-${tier}`,
				name: `Load Tier ${tier} Adversaries`,
				editorCallback: (editor) => loadAdversaryTier(String(tier), editor),
			});
		});

		this.registerView(ENVIRONMENT_VIEW_TYPE, (leaf) => new EnvironmentView(leaf));
		this.addRibbonIcon("mountain", "Environment Browser", () => {
			openEnvironmentSidebar(this);
		});

		this.addCommand({
			id: "Create-Adversary-Card",
			name: "Create Adversary Card",
			editorCallback: (editor, view) => new TextInputModal(this.app, editor).open(),
		});
		// this.registerDomEvent(document, "click", (evt) => console.log("click", evt));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(ADVERSARY_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(ENVIRONMENT_VIEW_TYPE);
	}
}
