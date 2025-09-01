import { Editor, MarkdownView, Menu, Notice, Plugin, TFile} from "obsidian";
import {
	AdversaryView,
	ADVERSARY_VIEW_TYPE,
} from "./adversaries/advSearch";
import {
	EnvironmentView,
	ENVIRONMENT_VIEW_TYPE,
} from "./environments/envSearch";
import { TextInputModal } from "./adversaries/adversaryCreator/textInputModalAdv";
import { adversariesSidebar } from "./sidebar";
import { loadStyleSheet } from "./style";
import { openEnvironmentSidebar } from "./sidebar";
import { environmentToHTML } from "./environments/envToHTML";
import { EnvironmentModal } from "./environments/environmentCreator/envModal";
import { CardData } from "./types";
import { extractCardData } from "./adversaries/adversaryEditor/cardDataHelpers";
import { AdversaryEditorModal } from "./adversaries/adversaryEditor/advEditorModal";

export default class DaggerForgePlugin extends Plugin {
	updateCardData(cardElement: HTMLElement, currentData: CardData) {
		throw new Error("Method not implemented.");
	}
	savedInputStateAdv: Record<string, any> = {};
	savedInputStateEnv: Record<string, any> = {};
	private isEditListenerAdded = false;


	async onload() {
		await loadStyleSheet(this);
		this.addStatusBarItem().setText("DaggerForge Active");

		if (!this.isEditListenerAdded) {
			document.addEventListener("click", this.handleCardEditClick);
			this.isEditListenerAdded = true;
		}

		// Register views
		this.registerView(
			ADVERSARY_VIEW_TYPE,
			(leaf) => new AdversaryView(leaf),
		);
		this.registerView(
			ENVIRONMENT_VIEW_TYPE,
			(leaf) => new EnvironmentView(leaf),
		);

		// Combined ribbon icon
		this.addRibbonIcon(
			"scroll-text",
			"DaggerForge Menu",
			(evt: MouseEvent) => {
				const menu = new Menu();

				menu.addItem((item) =>
					item
						.setTitle("Adversary Browser")
						.setIcon("venetian-mask")
						.onClick(() => adversariesSidebar(this)),
				);
				menu.addItem((item) =>
					item
						.setTitle("Environment Browser")
						.setIcon("mountain")
						.onClick(() => openEnvironmentSidebar(this)),
				);

				menu.addSeparator();

				menu.addItem((item) =>
					item
						.setTitle("Adversary Creator")
						.setIcon("swords")
						.onClick(() => this.openCreator("adversary")),
				);
				menu.addItem((item) =>
					item
						.setTitle("Environment Creator")
						.setIcon("landmark")
						.onClick(() => this.openCreator("environment")),
				);

				menu.showAtMouseEvent(evt);
			},
		);

this.addRibbonIcon("plus", "Add Hello Card", async () => {
    let canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
    let file: TFile;
    let canvasView: any;

    // Create or open canvas
    if (!canvasLeaves.length) {
        file = await this.app.vault.create(
            "TestCanvas.canvas",
            JSON.stringify({ nodes: {}, edges: {} }, null, 2)
        );
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
        canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
    } else {
        file = (canvasLeaves[0].view as any).file;
    }

    // Get the canvas view
    canvasView = canvasLeaves[0].view as any;
    const canvas = canvasView.canvas;

    // Create a new text card node
    canvas.createTextNode({
        pos: { x: 100, y: 100 },
        text: "Hello from plugin!",
        size: { width: 200, height: 100 }
    });

    // Save updated canvas JSON
    canvas.requestSave?.();

    new Notice("Added 'hello' card to canvas.");
});


		// Commands
		[1, 2, 3, 4].forEach((tier) => {
			this.addCommand({
				id: `load-tier-${tier}`,
				name: `Load Tier ${tier} Adversaries`,
				callback: () =>
					this.loadContentToMarkdown(`tier-${tier}-adversaries`),
			});
		});

		this.addCommand({
			id: "adversary-creator",
			name: "Adversary Creator",
			callback: () => this.openCreator("adversary"),
		});

		this.addCommand({
			id: "environment-creator",
			name: "Environment Creator",
			callback: () => this.openCreator("environment"),
		});
	}

	private async openCreator(type: "adversary" | "environment") {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("Please open a note first.");
			return;
		}

		if (activeView.getMode() !== "source") {
			new Notice("Please switch to Edit mode.");
			return;
		}

		if (type === "adversary") {
			new TextInputModal(this, activeView.editor).open();
		} else {
			new EnvironmentModal(this, activeView.editor, (result) => {
				this.insertEnvironment(activeView.editor, result);
			}).open();
		}
	}

	private async loadContentToMarkdown(contentType: string) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("Please open a note first.");
			return;
		}

		let content = "";
		if (contentType.startsWith("tier-")) {
			const tier = contentType.split("-")[1];
			content = await this.getAdversaryTierContent(tier);
		}

		if (content) {
			activeView.editor.replaceSelection(content);
		}
	}

	private async getAdversaryTierContent(tier: string): Promise<string> {
		// Implement your logic to get markdown content for the tier
		return `# Tier ${tier} Adversaries\n\n...`;
	}

	private insertEnvironment(editor: Editor, result: any) {
		const html = environmentToHTML(result);
		if (editor) {
			editor.replaceSelection(html);
		}
	}
	private handleCardEditClick = (evt: MouseEvent) => {
		// Check if we're in edit mode first
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView?.getMode() !== 'source') {
			if ((evt.target as HTMLElement).closest('.edit-button')) {
				new Notice("Please switch to Edit mode.");
			}
			return;
		}
		const clicked = evt.target as HTMLElement;
		const editBtn = clicked.closest(".edit-button");
		if (!editBtn) return;
		evt.stopPropagation();
		const card = editBtn.closest(".card-outer") as HTMLElement;
		const editor = this.app.workspace.activeEditor?.editor;
		if (!card || !editor) return;
		const cardData = extractCardData(card);
		console.log("Extracted Features:", cardData.features); 
		const modal = new AdversaryEditorModal(this, editor, card, cardData);
		console.log("modal cardData:", modal.cardData);
		modal.open();
		modal.onSubmit = async (newHTML: string) => {
			console.log("=== DEBUG: onSubmit started ===");
			
			const wrapper = document.createElement("div");
			wrapper.innerHTML = newHTML;
			const newCard = wrapper.firstElementChild as HTMLElement;
			
			// Check features in the new HTML
			const featuresInNewHTML = newCard.querySelectorAll('.feature');
			console.log("Features in new HTML:", featuresInNewHTML.length);
			featuresInNewHTML.forEach((feat, i) => {
				console.log(`Feature ${i}:`, feat.outerHTML);
			});
			
			const editor = this.app.workspace.activeEditor?.editor;
			if (!editor) return;
			
			const originalContent = editor.getValue();
			console.log("Original content length:", originalContent.length);
			
			const cardOuterHTML = card.outerHTML;
			console.log("Card outer HTML length:", cardOuterHTML.length);
			
			const cardStart = originalContent.indexOf(cardOuterHTML);
			console.log("Card found at position:", cardStart);
			
			if (cardStart !== -1) { // cardStart is always -1 for some reason need to check it asap
				const oldContent = originalContent.substring(cardStart, cardStart + cardOuterHTML.length);
				console.log("Old content to replace:", oldContent);
				console.log("New content to insert:", newHTML);
				
				const updatedContent = originalContent.substring(0, cardStart) + 
									newHTML + 
									originalContent.substring(cardStart + cardOuterHTML.length);
				
				editor.setValue(updatedContent);
				console.log("=== Content updated successfully ===");

				const updatedFeatures = editor.getValue().match(/class="feature"/g) || [];
				console.log("Features in updated editor:", updatedFeatures.length);
				
			} else {
				console.log("Card not found in source, using DOM replacement");
				card.replaceWith(newCard);
			}
		};
	};

	onunload() {
		document.removeEventListener("click", this.handleCardEditClick);
		this.isEditListenerAdded = false;
	}
}
