import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { ContentBrowserApp, type BrowserTab } from "./ContentBrowserApp";

export const Content_Browser_View_Type = "daggerforge:content-browser";
export type { BrowserTab };

export class ContentBrowserView extends ItemView {
	private root: Root | null = null;
	private setTab: ((tab: BrowserTab) => void) | null = null;

	constructor(leaf: WorkspaceLeaf) { super(leaf); }

	getViewType()    { return Content_Browser_View_Type; }
	getDisplayText() { return "Content Browser"; }
	getIcon()        { return "layout-grid"; }

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("df-content-browser");

		this.root = createRoot(container);
		this.root.render(
			createElement(ContentBrowserApp, {
				app: this.app,
				scrollContainer: container,
				onTabSetter: (fn) => { this.setTab = fn; },
			}),
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
		this.setTab = null;
	}

	public refresh() {
		// Re-render by remounting (simplest approach — React reconciles efficiently)
		if (this.root) {
			const container = this.containerEl.children[1] as HTMLElement;
			this.root.render(
				createElement(ContentBrowserApp, {
					app: this.app,
					scrollContainer: container,
					onTabSetter: (fn) => { this.setTab = fn; },
				}),
			);
		}
	}

	public switchTab(tab: BrowserTab) {
		this.setTab?.(tab);
	}
}
