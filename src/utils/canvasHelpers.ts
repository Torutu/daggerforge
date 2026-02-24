import { App, Notice, MarkdownView } from "obsidian";

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

export function resolveInsertDestination(
	app: App,
	lastMainLeaf: { view: any } | null
): InsertDestination {
	// If the currently active leaf (non-sidebar) is a canvas, use that.
	const activeView = app.workspace.activeLeaf?.view;
	if (activeView && (activeView as any).canvas) return "canvas";

	// Otherwise trust the last main-area leaf the user explicitly focused.
	if (!lastMainLeaf) return "none";

	const view = lastMainLeaf.view;
	if ((view as any).canvas) return "canvas";
	if (view instanceof MarkdownView) return "markdown";

	// Fallback: inspect the file extension
	const file = (view as any)?.file;
	if (file?.extension === "canvas") return "canvas";
	if (file?.extension === "md") return "markdown";

	return "none";
}

/**
 * @deprecated Use resolveInsertDestination() instead.
 * Left here so existing call sites compile while being migrated.
 */
export function isCanvasActive(app: App): boolean {
	const activeView = app.workspace.activeLeaf?.view;
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
 * Get the canvas view - checks active leaf first, then any canvas in workspace
 */
export function getActiveCanvas(app: App): any | null {
	// First check if the active leaf is a canvas
	const activeLeaf = app.workspace.activeLeaf;
	
	if (activeLeaf?.view) {
		const view = activeLeaf.view;
		// Check if this view has a canvas property
		if ((view as any).canvas) {
			return (view as any).canvas;
		}
	}
	
	// If active leaf is not a canvas, look for any open canvas in the workspace
	const canvasLeaves = app.workspace.getLeavesOfType("canvas");
	
	if (canvasLeaves.length > 0) {
		for (const leaf of canvasLeaves) {
			const view = leaf.view;
			if ((view as any).canvas) {
				return (view as any).canvas;
			}
		}
	}
	
	return null;
}

/**
 * Create a card on the canvas with the given HTML content
 */
export function createCanvasCard(
	app: App,
	htmlContent: string,
	options?: {
		width?: number;
		height?: number;
		x?: number;
		y?: number;
	}
): boolean {
	const canvas = getActiveCanvas(app);
	
	if (!canvas) {
		return false;
	}

	try {
		
		const viewport = canvas.viewport;
		const defaultX = options?.x ?? (viewport.x + viewport.width / 2 - 200);
		const defaultY = options?.y ?? (viewport.y + viewport.height / 2 - 150);

		const node = canvas.createTextNode({
			pos: { 
				x: defaultX, 
				y: defaultY 
			},
			text: htmlContent,
			size: { 
				width: options?.width ?? 400, 
				height: options?.height ?? 600 
			}
		});

		if (canvas.requestSave) {
			canvas.requestSave();
		} else {
			console.warn("⚠ requestSave not available on canvas");
		}
		return true;
		
	} catch (error) {
		console.error("Error creating canvas card:", error);
		new Notice(`Error creating canvas card: ${error.message}`);
		return false;
	}
}

/**
 * Get a position for a new canvas card that doesn't overlap with existing cards
 */
export function getAvailableCanvasPosition(app: App): { x: number; y: number } {
	const canvas = getActiveCanvas(app);
	
	if (!canvas) {
		new Notice("No canvas found. Please open or focus a canvas file first.");
		return { x: 0, y: 0 };
	}

	try {
		// Get the camera position (center of what user is looking at)
		const centerX = canvas.tx ?? 0;
		const centerY = canvas.ty ?? 0;

		let x = centerX - 200;
		let y = centerY - 300;

		const nodes = canvas.nodes ? Array.from(canvas.nodes.values()) : [];
		
		const overlaps = (testX: number, testY: number): boolean => {
			return nodes.some((node: any) => {
				const nodeX = node.x;
				const nodeY = node.y;
				const nodeWidth = node.width;
				const nodeHeight = node.height;
				
				return (
					testX < nodeX + nodeWidth &&
					testX + 400 > nodeX &&
					testY < nodeY + nodeHeight &&
					testY + 600 > nodeY
				);
			});
		};

		let attempts = 0;
		while (overlaps(x, y) && attempts < 20) {
			x += 50;
			y += 50;
			attempts++;
		}

		return { x, y };
		
	} catch (error) {
		console.error("Error calculating canvas position:", error);
		new Notice("Error calculating canvas position. Using default.");
		return { x: 0, y: 0 };
	}
}
