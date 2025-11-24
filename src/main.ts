import { Editor, MarkdownView, Menu, Notice, Plugin, TFile } from "obsidian";

import {
	AdversaryView,
	ADVERSARY_VIEW_TYPE,
	EnvironmentView,
	ENVIRONMENT_VIEW_TYPE,
	TextInputModal,
	EnvironmentModal,
	environmentToHTML,
	openDiceRoller,
	openEncounterCalculator,
	handleCardEditClick,
} from "./features/index";

import {
	adversariesSidebar,
	openEnvironmentSidebar,
	DeleteConfirmModal,
	ImportDataModal,
} from "./ui/index";

import { DataManager } from "./data/index";

import type { CardData } from "./types";

export default class DaggerForgePlugin extends Plugin {
	updateCardData(cardElement: HTMLElement, currentData: CardData) {
		throw new Error("Method not implemented.");
	}
	dataManager: DataManager;
	savedInputStateAdv: Record<string, any> = {};
	savedInputStateEnv: Record<string, any> = {};

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();
		this.addStatusBarItem().setText("DaggerForge Active");
		this.registerDomEvent(document, "click", (evt) => handleCardEditClick(evt, this.app, this));
		this.registerView(
			ADVERSARY_VIEW_TYPE,
			(leaf) => new AdversaryView(leaf),
		);
		this.registerView(
			ENVIRONMENT_VIEW_TYPE,
			(leaf) => new EnvironmentView(leaf),
		);

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
						.onClick(() => openDiceRoller(this)),
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
			callback: () => openDiceRoller(this),
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
			const dummyEditor: Editor | null = null;
			if (type === "adversary") {
				new TextInputModal(this, dummyEditor as any).open();
			} else {
				new EnvironmentModal(this, dummyEditor as any, (result) => {
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
				this.refreshBrowsers();
			}
		);
		modal.open();
	}

	/**
	 * Refresh all open adversary and environment browsers
	 */
	public refreshBrowsers() {
		const adversaryLeaves = this.app.workspace.getLeavesOfType(ADVERSARY_VIEW_TYPE);
		adversaryLeaves.forEach((leaf) => {
			const view = leaf.view as AdversaryView;
			if (view && typeof view.refresh === 'function') {
				view.refresh();
			}
		});

		const environmentLeaves = this.app.workspace.getLeavesOfType(ENVIRONMENT_VIEW_TYPE);
		environmentLeaves.forEach((leaf) => {
			const view = leaf.view as EnvironmentView;
			if (view && typeof view.refresh === 'function') {
				view.refresh();
			}
		});
	}
}
