import { App, Notice, MarkdownView } from "obsidian";

/**
 * Check if there's a canvas open in the workspace
 * This works even when the active leaf is something else (like a sidebar)
 */

export function getActiveViewType(app: App): string | null {
	// Markdown
	const mdView = app.workspace.getActiveViewOfType(MarkdownView);
	if (mdView) return "markdown";

	// Canvas (no public type, so check manually)
	const leaf = app.workspace.getMostRecentLeaf();
	const view = leaf?.view;

	if (!view) return null;

	const type = view.getViewType?.();
	if (type === "canvas" || view.constructor?.name === "CanvasView") {
		return "canvas";
	}

	const file = (view as any).file;
	if (file?.extension === "canvas") return "canvas";
	if (file?.extension === "md") return "markdown";

	return type ?? null;
}

export function isCanvasActive(app: App): boolean {
	return getActiveViewType(app) === "canvas";
}

export function isMarkdownActive(app: App): boolean {
	return getActiveViewType(app) === "markdown";
}

/**
 * Get the canvas view - checks active leaf first, then any canvas in workspace
 */
export function getActiveCanvas(app: App): any | null {
	// First try active leaf
	const activeLeaf = app.workspace.activeLeaf;
	
	if (activeLeaf?.view) {
		const view = activeLeaf.view;
		const canvas = (view as any).canvas;
		
		if (canvas) {
return canvas;
		}
	}
	
	// If active leaf doesn't have canvas, find any canvas leaf in workspace
	const canvasLeaves = app.workspace.getLeavesOfType("canvas");
	
	if (canvasLeaves.length > 0) {
		// Get the most recently used canvas
		const canvasLeaf = canvasLeaves[0];
		const canvas = (canvasLeaf.view as any).canvas;
		
		if (canvas) {
return canvas;
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
		
		// Get viewport center or use provided coordinates
		const viewport = canvas.viewport;
		const defaultX = options?.x ?? (viewport.x + viewport.width / 2 - 200);
		const defaultY = options?.y ?? (viewport.y + viewport.height / 2 - 150);

		// Create the card node
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

		// Save the canvas
		if (canvas.requestSave) {
			canvas.requestSave();
		} else {
			console.warn("⚠ requestSave not available on canvas");
		}
		return true;
		
	} catch (error) {
		console.error("✗ Error creating canvas card:", error);
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
		console.warn("No canvas found, returning default position");
		return { x: 0, y: 0 };
	}

	try {
		// Get the camera position (center of what user is looking at)
		const centerX = canvas.tx ?? 0; // Camera X position
		const centerY = canvas.ty ?? 0; // Camera Y position
		const zoom = canvas.zoom ?? 1; // Camera zoom level

		// Convert viewport center to canvas coordinates
		let x = centerX - 200; // Center card horizontally (400 / 2)
		let y = centerY - 300; // Center card vertically (600 / 2)

		// Get all existing nodes
		const nodes = canvas.nodes ? Array.from(canvas.nodes.values()) : [];
		
		// Check if position overlaps with any existing node
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

		// If overlaps, offset to the right and down
		let attempts = 0;
		while (overlaps(x, y) && attempts < 20) {
			x += 50;
			y += 50;
			attempts++;
		}

		return { x, y };
		
	} catch (error) {
		console.error("Error calculating position:", error);
		return { x: 0, y: 0 };
	}
}
