import { ItemView, MarkdownView, Notice } from "obsidian";
import DaggerForgePlugin from "../main";
import {
	AdversaryView,
	Adv_View_Type,
	EnvironmentView,
	Env_View_Type,
	TextInputModal as AdversaryModal,
	EnvironmentModal,
} from "../features/index";
import { DeleteConfirmModal } from "../features/data-management/index";

/**
 * Opens the adversary or environment creator modal
 * Handles both Canvas and Markdown view contexts
 */
export function openCreator(plugin: DaggerForgePlugin, type: "adversary" | "environment"): void {
	if (handleCanvasView(plugin, type)) {
		return;
	}

	const isActiveMarkdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!isActiveMarkdownView) {
		new Notice("No note or canvas is open. Click on a note to activate it.");
		return;
	}

	handleMarkdownView(plugin, type, isActiveMarkdownView);
}

/**
 * Handles creator modal opening when Canvas view is active
 * Returns true if Canvas view was handled, false otherwise
 */
function handleCanvasView(plugin: DaggerForgePlugin, type: "adversary" | "environment"): boolean {
	const isActiveCanvasView = plugin.app.workspace.getActiveViewOfType(ItemView);
	if (isActiveCanvasView?.getViewType() === "canvas") {
		if (type === "adversary") {
			new AdversaryModal(plugin, null).open();
		} else {
			new EnvironmentModal(plugin, null).open();
		}
		return true;
	}
	return false;
}

/**
 * Handles creator modal opening when Markdown view is active
 * Requires the view to be in source (edit) mode
 */
function handleMarkdownView(
	plugin: DaggerForgePlugin,
	type: "adversary" | "environment",
	view: MarkdownView
): void {
	if (view.getMode() !== "source") {
		new Notice("Please switch to Edit mode.");
		return;
	}

	if (type === "adversary") {
		new AdversaryModal(plugin, view.editor).open();
	} else {
		new EnvironmentModal(plugin, view.editor).open();
	}
}

/**
 * Displays a confirmation modal before deleting the data file
 * On confirmation, deletes the file and refreshes all browsers
 */
export function confirmDeleteDataFile(plugin: DaggerForgePlugin): void {
	const modal = new DeleteConfirmModal(
		plugin.app,
		plugin,
		async () => {
			await plugin.dataManager.deleteDataFile();
			refreshBrowsers(plugin);
		}
	);
	modal.open();
}

/**
 * Refreshes all open adversary and environment browser views
 * Used after data changes to keep UI in sync
 */
export function refreshBrowsers(plugin: DaggerForgePlugin): void {
	const adversaryLeaves = plugin.app.workspace.getLeavesOfType(Adv_View_Type);
	adversaryLeaves.forEach((leaf) => {
		const view = leaf.view as AdversaryView;
		if (view && typeof view.refresh === 'function') {
			view.refresh();
		}
	});

	const environmentLeaves = plugin.app.workspace.getLeavesOfType(Env_View_Type);
	environmentLeaves.forEach((leaf) => {
		const view = leaf.view as EnvironmentView;
		if (view && typeof view.refresh === 'function') {
			view.refresh();
		}
	});
}
