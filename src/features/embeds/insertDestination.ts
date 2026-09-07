import { translate as dfTranslate } from "../../i18n";
import { App, FuzzySuggestModal, MarkdownView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { createCanvasCard, resolveInsertDestination } from "../../utils/canvasHelpers";

/**
 * One-click insert into the last-focused note or canvas (no picker).
 * Works in any note mode: edit mode inserts at the cursor, reading mode
 * appends to the end of the note. Returns whether a target was found.
 */
export function insertAtFocusedTarget(
	plugin: DaggerForgePlugin,
	blockText: string,
	canvasSize: CanvasNodeSize,
	itemName?: string,
	quiet = false,
): boolean {
	const label = itemName ? `Inserted ${itemName}.` : "Inserted.";
	const { kind, canvas, leaf } = resolveInsertDestination(plugin.app, plugin.lastMainLeaf);

	if (kind === "canvas" && canvas) {
		const ok = createCanvasCard(plugin.app, blockText, canvas, canvasSize);
		if (ok && !quiet) new Notice(label);
		return ok;
	}
	if (kind === "markdown" && leaf) {
		const view = leaf.view as MarkdownView;
		if (view.getMode() !== "preview") {
			view.editor.replaceSelection("\n" + blockText);
			if (!quiet) new Notice(label);
			return true;
		}
		if (view.file) {
			void plugin.app.vault.process(view.file, (c) => c.replace(/\n*$/, "\n\n") + blockText);
			if (!quiet) new Notice(label);
			return true;
		}
	}
	new Notice(dfTranslate("ui.open.a.note.or.canvas.first"));
	return false;
}

/**
 * "Insert into where, exactly?" - a fuzzy picker over every possible insert
 * target: the last-focused note/canvas first (so Enter reproduces the old
 * one-click behavior), then other open tabs, then every note and canvas in
 * the vault (content is appended for targets without an active cursor).
 */

export interface InsertDestination {
	kind: "open-md" | "open-canvas" | "file-md" | "file-canvas";
	label: string;
	leaf?: WorkspaceLeaf;
	file: TFile | null;
}

export interface CanvasNodeSize {
	width: number;
	height: number;
}

export function listInsertDestinations(
	app: App,
	lastMainLeaf: WorkspaceLeaf | null,
): InsertDestination[] {
	const seen = new Set<string>();
	const out: InsertDestination[] = [];

	const pushLeaf = (leaf: WorkspaceLeaf, prefix: string) => {
		const view = leaf.view as unknown as { file?: TFile; canvas?: unknown };
		const file = view?.file ?? null;
		const isCanvas = Boolean(view?.canvas) || file?.extension === "canvas";
		if (!file && !isCanvas) return;
		const key = file?.path ?? `leaf:${prefix}`;
		if (seen.has(key)) return;
		seen.add(key);
		out.push({
			kind: isCanvas ? "open-canvas" : "open-md",
			label: `${prefix} ${isCanvas ? "canvas" : "note"}: ${file?.basename ?? "Untitled"}`,
			leaf,
			file,
		});
	};

	if (lastMainLeaf) pushLeaf(lastMainLeaf, "Last focused");
	for (const leaf of app.workspace?.getLeavesOfType?.("markdown") ?? []) pushLeaf(leaf, "Open");
	for (const leaf of app.workspace?.getLeavesOfType?.("canvas") ?? []) pushLeaf(leaf, "Open");

	const files = [
		...(app.vault?.getMarkdownFiles?.() ?? []),
		...(app.vault?.getFiles?.() ?? []).filter((f) => f.extension === "canvas"),
	].sort((a, b) => a.path.localeCompare(b.path));

	for (const file of files) {
		if (seen.has(file.path)) continue;
		seen.add(file.path);
		out.push({
			kind: file.extension === "canvas" ? "file-canvas" : "file-md",
			label: `${file.extension === "canvas" ? "Canvas" : "Note"}: ${file.path}`,
			leaf: undefined,
			file,
		});
	}

	return out;
}

export class DestinationPickerModal extends FuzzySuggestModal<InsertDestination> {
	private destinations: InsertDestination[];
	private onChoose: (dest: InsertDestination) => void;

	constructor(app: App, destinations: InsertDestination[], onChoose: (dest: InsertDestination) => void) {
		super(app);
		this.destinations = destinations;
		this.onChoose = onChoose;
		this.setPlaceholder(dfTranslate("ui.insert.into.which.note.or.canvas"));
	}

	getItems(): InsertDestination[] {
		return this.destinations;
	}

	getItemText(dest: InsertDestination): string {
		return dest.label;
	}

	onChooseItem(dest: InsertDestination): void {
		this.onChoose(dest);
	}
}

export async function insertTextAtDestination(
	plugin: DaggerForgePlugin,
	dest: InsertDestination,
	blockText: string,
	canvasSize: CanvasNodeSize,
): Promise<void> {
	const app = plugin.app;
	const name = dest.file?.basename ?? "target";

	if (dest.kind === "open-canvas" && dest.leaf) {
		const canvas = (dest.leaf.view as unknown as { canvas?: unknown }).canvas;
		if (canvas && createCanvasCard(app, blockText, canvas, canvasSize)) {
			new Notice(`Placed on canvas "${name}".`);
			return;
		}
	}

	if (dest.kind === "open-md" && dest.leaf) {
		const view = dest.leaf.view as MarkdownView;
		if (view.getMode() !== "preview") {
			view.editor.replaceSelection("\n" + blockText);
			new Notice(`Inserted at the cursor in "${name}".`);
			return;
		}
		// Reading mode has no cursor - fall through to appending to the file
	}

	if (!dest.file) {
		new Notice(dfTranslate("ui.could.not.resolve.the.insert.target"));
		return;
	}

	if (dest.file.extension === "canvas") {
		await app.vault.process(dest.file, (content) =>
			addTextNodeToCanvasJson(content, blockText, canvasSize),
		);
		new Notice(`Added to canvas "${name}".`);
		return;
	}

	await app.vault.process(dest.file, (content) => content.replace(/\n*$/, "\n\n") + blockText);
	new Notice(`Appended to "${name}".`);
}

/** Snapshot destinations, let the user pick, insert. The snapshot happens
 *  before the modal opens because opening it steals leaf focus. */
export function pickDestinationAndInsert(
	plugin: DaggerForgePlugin,
	blockText: string,
	canvasSize: CanvasNodeSize,
): void {
	const destinations = listInsertDestinations(plugin.app, plugin.lastMainLeaf);
	if (destinations.length === 0) {
		new Notice(dfTranslate("ui.no.notes.or.canvases.found.in.this.vault"));
		return;
	}
	new DestinationPickerModal(plugin.app, destinations, (dest) => {
		void insertTextAtDestination(plugin, dest, blockText, canvasSize);
	}).open();
}

/**
 * Appends a text node to raw `.canvas` file JSON (JsonCanvas format),
 * positioned below the existing nodes. Pure - unit-tested.
 */
export function addTextNodeToCanvasJson(
	content: string,
	text: string,
	size: CanvasNodeSize,
): string {
	let canvas: { nodes?: Array<Record<string, unknown>>; edges?: unknown[] };
	try {
		canvas = content.trim() ? JSON.parse(content) : {};
	} catch {
		canvas = {};
	}
	if (!Array.isArray(canvas.nodes)) canvas.nodes = [];
	if (!Array.isArray(canvas.edges)) canvas.edges = [];

	let x = 0;
	let y = 0;
	if (canvas.nodes.length > 0) {
		x = Math.min(...canvas.nodes.map((n) => Number(n.x) || 0));
		y = Math.max(...canvas.nodes.map((n) => (Number(n.y) || 0) + (Number(n.height) || 0))) + 40;
	}

	canvas.nodes.push({
		id: randomHexId(),
		type: "text",
		text,
		x,
		y,
		width: size.width,
		height: size.height,
	});

	return JSON.stringify(canvas, null, "\t");
}

function randomHexId(): string {
	let id = "";
	for (let i = 0; i < 16; i++) id += Math.floor(Math.random() * 16).toString(16);
	return id;
}
