import { App, Notice, MarkdownView } from "obsidian";

/**
 * Check if there is a canvas open anywhere in the workspace.
 *
 * Why not use getMostRecentLeaf()?
 * When the user clicks a card inside a sidebar ItemView (the browser),
 * the sidebar itself becomes the most recent leaf. getMostRecentLeaf()
 * then returns the sidebar — whose view has no .file — so the old code
 * incorrectly returned null and treated the session as "no canvas open".
 *
 * We instead check the active leaf first, then fall back to scanning all
 * canvas-type leaves. This mirrors what getActiveCanvas() already does,
 * keeping both functions consistent.
 */
export function isCanvasActive(app: App): boolean {
	// 1. Active leaf is a canvas
	const activeView = app.workspace.activeLeaf?.view;
	if (activeView && (activeView as any).canvas) return true;

	// 2. Any canvas leaf is open in the workspace (e.g. active leaf is the sidebar)
	return app.workspace.getLeavesOfType("canvas").some(
		(leaf) => !!(leaf.view as any).canvas
	);
}

/**
 * Returns true only when the most-recently-focused main-area leaf is a
 * markdown note. The MarkdownView check is authoritative; if that returns
 * nothing we inspect the most-recent leaf's file extension as a fallback.
 */
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
