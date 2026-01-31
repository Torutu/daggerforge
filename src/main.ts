// https://lucide.dev/ for icons

import { Editor, ItemView, MarkdownView, Notice, Plugin } from "obsidian";
import {
	AdversaryView,
	ADVERSARY_VIEW_TYPE,
	EnvironmentView,
	ENVIRONMENT_VIEW_TYPE,
	TextInputModal as AdversaryModal,
	EnvironmentModal,
	environmentToHTML,
	handleCardEditClick,
} from "./features/index";
import {
	DeleteConfirmModal,
} from "./ui/index";
import { DataManager } from "./data/index";
import { createView, setupRibbonIcon, setupCommands } from "./utils/index";

export default class DaggerForgePlugin extends Plugin {
	dataManager: DataManager;
	savedInputStateAdv: Record<string, any> = {};
	savedInputStateEnv: Record<string, any> = {};

	async onload() {
		this.dataManager = new DataManager(this);
		await this.dataManager.load();
		this.addStatusBarItem().setText("DaggerForge Active");
		this.registerDomEvent(document, "click", (evt) => handleCardEditClick(evt, this.app, this));
		setupRibbonIcon(this);
		setupCommands(this);
		createView(this, ADVERSARY_VIEW_TYPE, AdversaryView);
		createView(this, ENVIRONMENT_VIEW_TYPE, EnvironmentView);
	}

	async openCreator(type: "adversary" | "environment") {
		if (this.handleCanvasView(type)) {
			return;
		}
		
		const isActiveMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!isActiveMarkdownView) {
			new Notice("No note or canvas is open. Click on a note to activate it.");
			return;
		}
		
		this.handleMarkdownView(type, isActiveMarkdownView);
	}

	private handleCanvasView(type: "adversary" | "environment"): boolean {
		const isActiveCanvasView = this.app.workspace.getActiveViewOfType(ItemView);
		if (isActiveCanvasView?.getViewType() === "canvas") {
			const dummyEditor: Editor | null = null;
			if (type === "adversary") {
				new AdversaryModal(this, dummyEditor).open();
			} else {
				new EnvironmentModal(this, dummyEditor, () => {
				}).open();
			}
			return true;
		}
		return false;
	}

	private handleMarkdownView(type: "adversary" | "environment", isActiveMarkdownView: MarkdownView) {
		if (isActiveMarkdownView.getMode() !== "source") {
			new Notice("Please switch to Edit mode.");
			return;
		}

		if (type === "adversary") {
			new AdversaryModal(this, isActiveMarkdownView.editor).open();
		} else {
			new EnvironmentModal(this, isActiveMarkdownView.editor, (result) => {
				this.insertEnvironment(isActiveMarkdownView.editor, result);
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
	async confirmDeleteDataFile() {
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
