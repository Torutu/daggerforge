import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { ContentBrowserApp, type BrowserTab } from "./ContentBrowserApp";

export const Content_Browser_View_Type = "daggerforge:content-browser";
export type { BrowserTab };

export class ContentBrowserView extends ItemView {
	private root: Root | null = null;
	private setTab: ((tab: BrowserTab) => void) | null = null;
	private refreshToken = 0;

	constructor(leaf: WorkspaceLeaf) { super(leaf); }

	getViewType()    { return Content_Browser_View_Type; }
	getDisplayText() { return "Content Browser"; }
	getIcon()        { return "layout-grid"; }

	private renderApp(container: HTMLElement) {
		this.root!.render(
			createElement(ContentBrowserApp, {
				app: this.app,
				scrollContainer: container,
				onTabSetter: (fn) => { this.setTab = fn; },
				refreshToken: this.refreshToken,
			}),
		);
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("df-content-browser");
		this.root = createRoot(container);
		this.renderApp(container);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
		this.setTab = null;
	}

	public refresh() {
		if (!this.root) return;
		this.refreshToken++;
		this.renderApp(this.containerEl.children[1] as HTMLElement);
	}

	public switchTab(tab: BrowserTab) {
		this.setTab?.(tab);
	}
}
