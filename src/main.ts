import { App, Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { AdversaryView, ADVERSARY_VIEW_TYPE } from "./adversaries/adversarySearch";
import { EnvironmentView, ENVIRONMENT_VIEW_TYPE } from "./environments/environmentSearch";
import { TextInputModal } from "./adversaries/adversaryCreator/textInputModalAdv";
import { loadAdversaryTier } from "./adversaries/adversaryList";
import { adversariesSidebar } from "./sidebar";
import { loadStyleSheet } from "./style";
import { openEnvironmentSidebar } from "./sidebar";

export default class DaggerForgePlugin extends Plugin {
	savedInputState: Record<string, any> = {};
	async onload() {
		await loadStyleSheet(this);

		this.registerView(ADVERSARY_VIEW_TYPE, (leaf) => new AdversaryView(leaf));
		this.addRibbonIcon("venetian-mask", "DaggerHeart Adversary Creator", () => {
			adversariesSidebar(this);
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

		// src/main.ts
		this.addCommand({
			id: "Create-Adversary-Card",
			name: "Create Adversary Card",
			editorCallback: (editor) => {
				// For creation, we don't have a cardElement to edit
				new TextInputModal(this, editor).open(); 
			},
		});
		// In your onload() method:
		// this.registerDomEvent(document, 'click', (evt) => {
		// 	const clickedElement = evt.target as HTMLElement;
		// 	const editor = this.app.workspace.activeEditor?.editor;
			
		// 	if (clickedElement.closest('.card-outer') && editor) {
		// 		new TextInputModal(
		// 			this, 
		// 			editor, 
		// 			clickedElement.closest('.card-outer') as HTMLElement
		// 		).open();
		// 	}
		// });
		// this.registerDomEvent(document, "click", (evt) => console.log("click", evt));
	}
}
