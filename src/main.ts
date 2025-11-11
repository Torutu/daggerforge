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
import { DataManager } from "./services/DataManager";
import { ImportDataModal } from "./ui/ImportDataModal";
import { DeleteConfirmModal } from "./ui/DeleteConfirmModal";
import { openDiceRoller } from "./features/dice/diceRoller";
import { openEncounterCalculator } from "./features/Encounters/encounterCalc";
import { onEditClick } from "./features/environments/editor/envEditor";

export default class DaggerForgePlugin extends Plugin {
updateCardData(cardElement: HTMLElement, currentData: CardData) {
throw new Error("Method not implemented.");
}
dataManager: DataManager;
savedInputStateAdv: Record<string, any> = {};
savedInputStateEnv: Record<string, any> = {};

	async onload() {
		// Initialize DataManager
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

		this.addStatusBarItem().setText("DaggerForge Active");

		/* Handle edit button clicks on cards */
		this.registerDomEvent(document, "click", (evt) => {
			const target = evt.target as HTMLElement;
			if (!target) return;
			let cardType: "env" | "adv" | null = null;

			if (target.matches(".df-env-edit-button")) cardType = "env";
			else if (target.closest(".df-adv-edit-button")) cardType = "adv";

			if (!cardType) return;

			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			const isEditMode = view.getMode() === "source";

			if (isEditMode) {
				//warning emoji in notice
				new Notice("Edit feature is coming soon ⚠️");
				onEditClick(evt, cardType);
			} else {
				// new Notice("Clicked in READING mode!");
			}
		});

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
						.setTitle("Dice roller")
						.setIcon("dice")
						.onClick(() => openDiceRoller()),
				);

				menu.addItem((item) =>
					item
						.setTitle("Battle calculator")
						.setIcon("flame")
						.onClick(() => openEncounterCalculator()),
				);

				menu.addItem((item) =>
					item
						.setTitle("Player dashboard")
						.setIcon("file-user")
						.onClick(() => { new Notice("Coming soon!"); }),
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

		this.addCommand({
			id: "open-floating-window",
			name: "Open dice roller",
			callback: () => openDiceRoller(),
		});

		this.addCommand({
			id: "open-encounter-calculator",
			name: "Open battle calculator",
			callback: () => openEncounterCalculator(),
		});

		this.addCommand({
			id: "open-adversary-browser",
			name: "Open adversary browser",
			callback: () => adversariesSidebar(this),
		});

		this.addCommand({
			id: "open-environment-browser",
			name: "Open environment browser",
			callback: () => openEnvironmentSidebar(this),
		});

		this.addCommand({
			id: "open-player-dashboard",
			name: "Open player dashboard",
			callback: () => { new Notice("Coming soon!"); },
		})
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

	// private async loadContentToMarkdown(contentType: string) {
	// 	const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	if (!activeView) {
	// 		new Notice("Please open a note first.");
	// 		return;
	// 	}

	// 	let content = "";
	// 	if (contentType.startsWith("tier-")) {
	// 		const tier = contentType.split("-")[1];
	// 		content = await this.getAdversaryTierContent(tier);
	// 	}

	// 	if (content) {
	// 		activeView.editor.replaceSelection(content);
	// 	}
	// }

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

	/**
	 * Confirm before deleting the data file
	 */
	private async confirmDeleteDataFile() {
		const modal = new DeleteConfirmModal(
			this.app,
			this,
			async () => {
				await this.dataManager.deleteDataFile();
				// Refresh both browsers
				this.refreshBrowsers();
			}
		);
		modal.open();
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
}
