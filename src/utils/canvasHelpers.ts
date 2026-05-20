import { App, Notice, MarkdownView, WorkspaceLeaf } from "obsidian";

/**
 * Determines where the next card should be inserted by looking at the last
 * leaf the user explicitly focused in the main editor area.
 *
 * WHY WE NEED lastMainLeaf:
 * When the user clicks a card in the sidebar browser, Obsidian sets the
 * sidebar as the active leaf. From that point, activeLeaf is the sidebar —
 * not the canvas or note the user was working in before.
 *
 * The old approach scanned for ANY open canvas leaf and returned true if
 * one existed. This meant: open a canvas → insert a card → switch to a note
 * → insert again → still went to canvas, because the canvas tab was still
 * open somewhere.
 *
 * The correct signal is the LAST MAIN-AREA LEAF the user focused before
 * clicking the browser. The views track this as lastActiveMarkdown / a canvas
 * ref. This helper resolves the destination from that leaf.
 */
export type InsertDestination = "canvas" | "markdown" | "none";

export interface ResolvedDestination {
	kind: InsertDestination;
	/** The specific canvas object to insert into. Only set when kind === "canvas". */
	canvas: any | null;
	/** The target leaf. Use this to get the editor for markdown inserts. */
	leaf: WorkspaceLeaf | null;
}

/**
 * Resolves where to insert the next card AND which specific canvas to use.
 *
 * WHY THIS RETURNS THE CANVAS OBJECT:
 * getActiveCanvas() falls back to scanning all open canvas leaves and returns
 * the first one found. With two canvases open, it always returns canvas 1
 * regardless of which one the user last focused. By extracting the canvas
 * directly from lastMainLeaf here, we guarantee the correct target.
 */
export function resolveInsertDestination(
	app: App,
	lastMainLeaf: { view: any } | null
): ResolvedDestination {
	// Check the most recently focused leaf first (fastest path, e.g. user just
	// clicked directly on a canvas without going through the sidebar).
	const activeMostRecent = app.workspace.getMostRecentLeaf();
	const activeView = activeMostRecent?.view;
	if (activeView && (activeView as any).canvas) {
		return { kind: "canvas", canvas: (activeView as any).canvas, leaf: activeMostRecent ?? null };
	}

	// Fall back to the last main-area leaf the plugin tracked.
	if (lastMainLeaf) {
		const view = lastMainLeaf.view;
		if ((view as any).canvas) {
			return { kind: "canvas", canvas: (view as any).canvas, leaf: lastMainLeaf as WorkspaceLeaf };
		}
		if (view instanceof MarkdownView) {
			return { kind: "markdown", canvas: null, leaf: lastMainLeaf as WorkspaceLeaf };
		}
		const file = (view as any)?.file;
		if (file?.extension === "canvas") {
			return { kind: "canvas", canvas: (view as any).canvas ?? null, leaf: lastMainLeaf as WorkspaceLeaf };
		}
		if (file?.extension === "md") {
			return { kind: "markdown", canvas: null, leaf: lastMainLeaf as WorkspaceLeaf };
		}
	}

	// Auto-scan: find any open markdown note in edit mode so the user doesn't
	// need to click the note first before inserting.
	const fallbackLeaf = app.workspace.getLeavesOfType("markdown").find(
		(l) => (l.view as MarkdownView).getMode?.() !== "preview"
	);
	if (fallbackLeaf) {
		return { kind: "markdown", canvas: null, leaf: fallbackLeaf };
	}

	return { kind: "none", canvas: null, leaf: null };
}

/**
 * @deprecated Use resolveInsertDestination() instead.
 * Left here so existing call sites compile while being migrated.
 */
export function isCanvasActive(app: App): boolean {
	const activeView = app.workspace.getMostRecentLeaf()?.view;
	if (activeView && (activeView as any).canvas) return true;
	return app.workspace.getLeavesOfType("canvas").some(
		(leaf) => !!(leaf.view as any).canvas
	);
}

/** @deprecated Use resolveInsertDestination() instead. */
export function isMarkdownActive(app: App): boolean {
	if (app.workspace.getActiveViewOfType(MarkdownView)) return true;
	const leaf = app.workspace.getMostRecentLeaf();
	const file = (leaf?.view as any)?.file;
	return file?.extension === "md";
}

/**
 * Create a card on a specific canvas object.
 * Callers must pass the canvas from resolveInsertDestination() — never use
 * getActiveCanvas() which scans all leaves and picks the wrong one.
 */
export function createCanvasCard(
	_app: App,
	htmlContent: string,
	canvas: any,
	options?: { width?: number; height?: number; x?: number; y?: number }
): boolean {
	if (!canvas) return false;

	try {
		const pos = getAvailableCanvasPosition(canvas);
		canvas.createTextNode({
			pos: { x: options?.x ?? pos.x, y: options?.y ?? pos.y },
			text: htmlContent,
			size: { width: options?.width ?? 400, height: options?.height ?? 600 },
		});
		canvas.requestSave?.();
		return true;
	} catch (error) {
		console.error("Error creating canvas card:", error);
		new Notice(`Error creating canvas card: ${error.message}`);
		return false;
	}
}

/**
 * Get a non-overlapping position on a specific canvas object.
 */
export function getAvailableCanvasPosition(canvas: any): { x: number; y: number } {
	try {
		let x = (canvas.tx ?? 0) - 200;
		let y = (canvas.ty ?? 0) - 300;

		const nodes = canvas.nodes ? Array.from(canvas.nodes.values()) : [];

		const overlaps = (tx: number, ty: number): boolean =>
			nodes.some((node: any) =>
				tx < node.x + node.width &&
				tx + 400 > node.x &&
				ty < node.y + node.height &&
				ty + 600 > node.y
			);

		let attempts = 0;
		while (overlaps(x, y) && attempts < 20) { x += 50; y += 50; attempts++; }

		return { x, y };
	} catch {
		return { x: 0, y: 0 };
	}
}
