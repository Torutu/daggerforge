import { App, MarkdownView, Notice } from "obsidian";
import DaggerForgePlugin from "../main";
import {
	AdversaryView,
	Adv_View_Type,
	EnvironmentView,
	Env_View_Type,
	AdversaryModal,
	EnvironmentModal,
	handleCardEditClick,
} from "../features/index";
import { DeleteConfirmModal } from "../features/data-management/index";

/**
 * Opens the adversary or environment creator modal.
 *
 * Uses plugin.lastMainLeaf (set by the global active-leaf-change listener in
 * main.ts) so the correct destination is known even when the ribbon menu or a
 * command palette entry triggered this call — at that point activeLeaf is the
 * menu/palette overlay, not the canvas or note the user was working in.
 */
export function openCreator(plugin: DaggerForgePlugin, type: "adversary" | "environment"): void {
	const leaf = plugin.lastMainLeaf;
	const view = leaf?.view;

	if (!view) {
		new Notice("No note or canvas is open. Click on one first.");
		return;
	}

	// Canvas destination
	if ((view as any).canvas) {
		if (type === "adversary") {
			new AdversaryModal(plugin, null).open();
		} else {
			new EnvironmentModal(plugin, null).open();
		}
		return;
	}

	// Markdown destination
	if (view instanceof MarkdownView) {
		if (view.getMode() !== "source") {
			new Notice("Please switch to Edit mode.");
			return;
		}
		if (type === "adversary") {
			new AdversaryModal(plugin, view.editor).open();
		} else {
			new EnvironmentModal(plugin, view.editor).open();
		}
		return;
	}

	new Notice("No note or canvas is open. Click on one first.");
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

/**
 * Handles edit button clicks on adversary and environment cards
 * Only processes clicks on edit buttons, exits early for other clicks
 */
export function listenForEditClicks(evt: MouseEvent, app: App, plugin: DaggerForgePlugin): void {
	const target = evt.target as HTMLElement;

	if (!target.classList.contains("df-adv-edit-button") &&
		!target.classList.contains("df-env-edit-button")) {
		return;
	}

	handleCardEditClick(evt, app, plugin, target);
}
