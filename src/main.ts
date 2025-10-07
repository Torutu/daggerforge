import { Plugin } from 'obsidian';
import { AdversaryView, ADVERSARY_VIEW_TYPE } from "./adversarySearch";
import { TextInputModal } from "./adversaryCreator";
import { loadAdversaryTier } from "./adversaryList";
import { openAdversaryCreatorSidebar } from "./sidebar";

export default class DaggerForgePlugin extends Plugin {
	async onload() {

		this.registerView(ADVERSARY_VIEW_TYPE, (leaf) => new AdversaryView(leaf));
		
		this.addRibbonIcon("venetian-mask", "DaggerHeart adversary creator", () => {
			openAdversaryCreatorSidebar(this);
		});
		this.addCommand({
			id: "open-adversary-sidebar",
			name: "Open adversary creator sidebar",
			callback: () => openAdversaryCreatorSidebar(this),
		});

		[1, 2, 3, 4].forEach((tier) => {
			this.addCommand({
				id: `load-tier-${tier}`,
				name: `Load tier ${tier} adversaries`,
				editorCallback: (editor) => loadAdversaryTier(String(tier), editor),
			});
		});

		this.addCommand({
			id: "Create-Adversary-Card",
			name: "Create adversary card",
			editorCallback: (editor, view) => new TextInputModal(this.app, editor).open(),
		});

	}
}
