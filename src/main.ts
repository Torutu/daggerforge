import { Editor, MarkdownView, Menu, Notice, Plugin, TFile} from "obsidian";
import {
	AdversaryView,
	ADVERSARY_VIEW_TYPE,
} from "./features/adversaries/components/AdvSearch";
import {
	EnvironmentView,
	ENVIRONMENT_VIEW_TYPE,
} from "./features/environments/components/EnvSearch";
import { TextInputModal } from "./features/adversaries/creator/TextInputModal";
import {
		adversariesSidebar,
		openEnvironmentSidebar,
 } from "./ui/Sidebar";
import { environmentToHTML } from "./features/environments/components/EnvToHTML";
import { EnvironmentModal } from "./features/environments/creator/EnvModal";
import { CardData } from "./types";
import { extractCardData } from "./features/adversaries/editor/CardDataHelpers";
import { AdversaryEditorModal } from "./features/adversaries/editor/AdvEditorModal";
import { DataManager } from "./services/DataManager";
import { ImportDataModal } from "./ui/ImportDataModal";
import { openEncounterCalculator } from "./features/Encounters/difficultyCalc";

export default class DaggerForgePlugin extends Plugin {
updateCardData(cardElement: HTMLElement, currentData: CardData) {
throw new Error("Method not implemented.");
}
dataManager: DataManager;
savedInputStateAdv: Record<string, any> = {};
savedInputStateEnv: Record<string, any> = {};
	private isEditListenerAdded = false;


	async onload() {
		// Initialize DataManager
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

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
			"DaggerForge menu",
			(evt: MouseEvent) => {
				const menu = new Menu();

				menu.addItem((item) =>
					item
						.setTitle("Adversary browser")
						.setIcon("venetian-mask")
						.onClick(() => adversariesSidebar(this)),
				);
				menu.addItem((item) =>
					item
						.setTitle("Environment browser")
						.setIcon("mountain")
						.onClick(() => openEnvironmentSidebar(this)),
				);

				menu.addSeparator();

				menu.addItem((item) =>
					item
						.setTitle("Adversary creator")
						.setIcon("swords")
						.onClick(() => this.openCreator("adversary")),
				);
				menu.addItem((item) =>
					item
						.setTitle("Environment creator")
						.setIcon("landmark")
						.onClick(() => this.openCreator("environment")),
				);

				menu.addSeparator();

				menu.addItem((item) =>
					item
						.setTitle("Encounter calculator")
						.setIcon("dice")
						.onClick(() => openEncounterCalculator(this)),
				);

				menu.addSeparator();

				menu.addItem((item) =>
					item
						.setTitle("Import data")
						.setIcon("upload")
						.onClick(() => new ImportDataModal(this.app, this).open()),
				);
				menu.addItem((item) =>
					item
						.setTitle("Delete data file")
						.setIcon("trash")
						.onClick(() => this.confirmDeleteDataFile()),
				);

				menu.showAtMouseEvent(evt);
			},
		);

		// Commands
		[1, 2, 3, 4].forEach((tier) => {
			this.addCommand({
				id: `load-tier-${tier}`,
				name: `Load tier ${tier} adversaries`,
				callback: () =>
					this.loadContentToMarkdown(`tier-${tier}-adversaries`),
			});
		});

		this.addCommand({
			id: "adversary-creator",
			name: "Adversary creator",
			callback: () => this.openCreator("adversary"),
		});

		this.addCommand({
			id: "environment-creator",
			name: "Environment creator",
			callback: () => this.openCreator("environment"),
		});

		this.addCommand({
			id: "import-data",
			name: "Import data from JSON file",
			callback: () => {
				new ImportDataModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: "delete-data-file",
			name: "Delete data file",
			callback: () => this.confirmDeleteDataFile(),
		});

		// Debug command to check canvas detection
		// this.addCommand({
		// 	id: "debug-view-type",
		// 	name: "Debug: Show current view type",
		// 	callback: () => debugCurrentView(this.app),
		// });
	}

	private async openCreator(type: "adversary" | "environment") {
		// Check if we're on a canvas
		const activeLeaf = this.app.workspace.activeLeaf;
		if (activeLeaf?.view?.getViewType() === "canvas") {
			// On canvas - create a dummy editor (won't be used but required for modal constructor)
			const dummyEditor = null as any;
			if (type === "adversary") {
				new TextInputModal(this, dummyEditor).open();
			} else {
				new EnvironmentModal(this, dummyEditor, (result) => {
					// This won't be called for canvas
				}).open();
			}
			return;
		}

		// Check if we're in a markdown view
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("Please open a note or canvas first.");
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

	/**
	 * Confirm before deleting the data file
	 */
	private async confirmDeleteDataFile() {
		const confirmed = confirm(
			"Are you sure you want to delete the data.json file?\n\n" +
			"This will permanently remove ALL stored adversaries and environments.\n" +
			"This action cannot be undone!"
		);

		if (confirmed) {
			try {
				await this.dataManager.deleteDataFile();
				new Notice("Data file deleted successfully!");
				// Refresh both browsers
				this.refreshBrowsers();
			} catch (err) {
				new Notice("Error deleting data file: " + err.message);
				console.error("Error deleting data file:", err);
			}
		}
	}

	/**
	 * Refresh all open adversary and environment browsers
	 */
	public refreshBrowsers() {
		// Refresh adversary browsers
		const adversaryLeaves = this.app.workspace.getLeavesOfType(ADVERSARY_VIEW_TYPE);
		adversaryLeaves.forEach((leaf) => {
			const view = leaf.view as AdversaryView;
			if (view && typeof view.refresh === 'function') {
				view.refresh();
			}
		});

		// Refresh environment browsers
		const environmentLeaves = this.app.workspace.getLeavesOfType(ENVIRONMENT_VIEW_TYPE);
		environmentLeaves.forEach((leaf) => {
			const view = leaf.view as EnvironmentView;
			if (view && typeof view.refresh === 'function') {
				view.refresh();
			}
		});
	}

	onunload() {
		document.removeEventListener("click", this.handleCardEditClick);
		this.isEditListenerAdded = false;
	}
}
