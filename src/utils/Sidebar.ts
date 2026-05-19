import { Notice, Plugin } from "obsidian";
import { Content_Browser_View_Type, ContentBrowserView, type BrowserTab } from "../features/browser/ContentBrowserView";

export function registerSideBarView(plugin: Plugin, viewType: string, view: any) {
	plugin.registerView(viewType, (leaf) => new view(leaf));
}

export async function openContentBrowser(plugin: Plugin, tab?: BrowserTab) {
	// Reuse an existing leaf of this type if one is open, otherwise create a new one
	const existing = plugin.app.workspace.getLeavesOfType(Content_Browser_View_Type);
	let leaf = existing[0] ?? plugin.app.workspace.getRightLeaf(true);

	if (!leaf) return;

	if (!existing[0]) {
		await leaf.setViewState({ type: Content_Browser_View_Type, active: true });
	}

	plugin.app.workspace.revealLeaf(leaf);

	if (tab) {
		const view = leaf.view as ContentBrowserView;
		view.switchTab(tab);
	}
}

// Legacy aliases kept so any remaining call sites compile without changes
export async function openAdversarySidebar(plugin: Plugin) {
	await openContentBrowser(plugin, "adversary");
}

export async function openEnvironmentSidebar(plugin: Plugin) {
	await openContentBrowser(plugin, "environment");
}
