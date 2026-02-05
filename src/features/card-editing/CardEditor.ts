import { App, MarkdownView, Notice } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { EnvironmentModal, extractEnvironmentData } from "../environments/index";
import { extractCardData, TextInputModal } from "../adversaries/index";
import type { AdvData } from "../../types/index";

function refreshBrowserView(plugin: DaggerForgePlugin, viewType: string): void {
	const leaf = plugin.app.workspace.getLeavesOfType(viewType)[0];
	if (!leaf) return;
	
	const view = leaf.view as { refresh?: () => void };
	view.refresh?.();
}

// Markdown Section Boundary Detection
// Cards live inside <section> blocks in the raw markdown source. To replace
// one we need its exact character range so we can splice in new HTML.

function findIdAttribute(content: string, id: string): number {
	return content.indexOf(`id="${id}"`);
}

/**
 * Walk backward from searchFrom to find a <section> whose class contains
 * df-card-outer. Adversary edit buttons sit several nesting levels deep —
 * intermediate sections (stats, features) would be found first if we just
 * took the nearest one.
 */
function findOuterCardSection(content: string, searchFrom: number): number {
	let pos = searchFrom;

	while (pos > 0) {
		const sectionStart = content.lastIndexOf("<section", pos - 1);
		if (sectionStart === -1) break;

		const classPos = content.indexOf('class="', sectionStart);
		if (classPos !== -1 && classPos < searchFrom) {
			const classEnd = content.indexOf('"', classPos + 7);
			if (content.substring(classPos + 7, classEnd).includes("df-card-outer")) {
				return sectionStart;
			}
		}

		pos = sectionStart;
	}

	return -1;
}

/**
 * Count nested open/close <section> pairs starting from an opening tag to
 * find its matching </section>. Returns the index immediately after the
 * closing tag, or -1 if the structure is malformed.
 */
function findMatchingSectionEnd(content: string, openTagIndex: number): number {
	let depth = 1;
	let pos = openTagIndex + 8; // skip past '<section'

	while (depth > 0 && pos < content.length) {
		const nextOpen = content.indexOf("<section", pos);
		const nextClose = content.indexOf("</section>", pos);

		if (nextClose === -1) return -1;

		if (nextOpen !== -1 && nextOpen < nextClose) {
			depth++;
			pos = nextOpen + 8;
		} else {
			depth--;
			pos = nextClose + 10;
		}
	}

	return depth === 0 ? pos : -1;
}

/**
 * Locate the full <section> block that contains the element with the given id.
 *
 * adv cards need the ancestor search (df-card-outer); env cards have the id on
 * or directly inside the outer section so the nearest preceding <section> works.
 */
function findCardSectionBounds(
	content: string,
	cardId: string,
	cardType: "adv" | "env",
): { startIndex: number; endIndex: number } {
	const idPos = findIdAttribute(content, cardId);
	if (idPos === -1) return { startIndex: -1, endIndex: -1 };

	const sectionStart =
		cardType === "adv"
			? findOuterCardSection(content, idPos)
			: content.lastIndexOf("<section", idPos);

	if (sectionStart === -1) return { startIndex: -1, endIndex: -1 };

	return {
		startIndex: sectionStart,
		endIndex: findMatchingSectionEnd(content, sectionStart),
	};
}

// Card Element & Name Resolution

const CARD_OUTER_SELECTOR: Record<string, string> = {
	adv: ".df-card-outer",
	env: ".df-env-card-outer",
};

function findCardElement(button: HTMLElement, cardType: string): HTMLElement | null {
	return button.closest(CARD_OUTER_SELECTOR[cardType] ?? "");
}

function getCardName(cardElement: HTMLElement, cardType: string): string {
	if (cardType === "env") {
		return cardElement.querySelector(".df-env-name")?.textContent?.trim() ?? "(unknown environment)";
	}
	return cardElement.querySelector("h2")?.textContent?.trim() ?? "(unknown adversary)";
}

// Markdown Card Replacement 
// Re-locates the card by id at call time (not at modal-open time) so that any
// edits the user made while the modal was open are accounted for.

async function replaceCardInMarkdown(
	plugin: DaggerForgePlugin,
	cardId: string,
	cardType: "adv" | "env",
	newHTML: string,
): Promise<boolean> {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return false;

	const content = view.editor.getValue();
	const { startIndex, endIndex } = findCardSectionBounds(content, cardId, cardType);
	if (startIndex === -1 || endIndex === -1) return false;

	const updated = content.substring(0, startIndex) + newHTML + content.substring(endIndex);
	view.editor.setValue(updated);

	if (view.file) {
		await plugin.app.vault.modify(view.file, updated);
	}

	return true;
}

// Canvas Card DOM Mutation
// Canvas cards are live DOM nodes — there is no source text to splice. We
// parse the new HTML, find the inner container, and swap its children in place.

function replaceCardInCanvas(
	cardElement: HTMLElement,
	newHTML: string,
	innerSelector: string,
): void {
	const parsed = new DOMParser().parseFromString(newHTML, "text/html");
	const newInner = parsed.querySelector(innerSelector);
	const existingInner = cardElement.querySelector(innerSelector);

	if (newInner && existingInner) {
		existingInner.innerHTML = "";
		newInner.childNodes.forEach((node) => existingInner.appendChild(node.cloneNode(true)));
	} else {
		// Fallback: replace the card's children entirely.
		cardElement.innerHTML = "";
		parsed.body.childNodes.forEach((node) => cardElement.appendChild(node.cloneNode(true)));
	}

	// Force Obsidian's canvas renderer to repaint this node.
	cardElement.classList.add("df-canvas-force-rerender");
	requestAnimationFrame(() => {
		cardElement.classList.remove("df-canvas-force-rerender");
		cardElement.classList.add("df-canvas-normal-opacity");
	});
}

// ─── Markdown Edit Flows ───────────────────────────────────────────────────

async function editAdversaryInMarkdown(
	cardElement: HTMLElement,
	cardId: string,
	cardName: string,
	plugin: DaggerForgePlugin,
): Promise<void> {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) {
		new Notice("Please open a markdown note first.");
		return;
	}

	const { startIndex, endIndex } = findCardSectionBounds(view.editor.getValue(), cardId, "adv");
	if (startIndex === -1 || endIndex === -1) {
		new Notice("Could not find card in markdown.");
		return;
	}

	const cardData = extractCardData(cardElement);
	const modal = new TextInputModal(plugin, view.editor, cardElement, cardData);

	modal.onEditUpdate = async (newHTML: string, newData: AdvData) => {
		const replaced = await replaceCardInMarkdown(plugin, cardId, "adv", newHTML);
		if (!replaced) {
			new Notice("Could not find card in markdown for update.");
			return;
		}

		try {
			await plugin.dataManager.addAdversary(newData);
			new Notice(`Updated adversary: ${cardName}`);
		} catch (error) {
			console.error("Error saving adversary:", error);
			new Notice("Error saving adversary. Check console for details.");
		}

		refreshBrowserView(plugin, "adversary-view");
	};

	modal.open();
}

async function editEnvironmentInMarkdown(
	cardElement: HTMLElement,
	cardId: string,
	cardName: string,
	plugin: DaggerForgePlugin,
): Promise<void> {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) {
		new Notice("Please open a markdown note first.");
		return;
	}

	const { startIndex, endIndex } = findCardSectionBounds(view.editor.getValue(), cardId, "env");
	if (startIndex === -1 || endIndex === -1) {
		new Notice("Could not find environment card in markdown.");
		return;
	}

	const envData = extractEnvironmentData(cardElement, cardName);
	const modal = new EnvironmentModal(plugin, view.editor, envData);

	modal.onEditUpdate = async (newHTML: string) => {
		const replaced = await replaceCardInMarkdown(plugin, cardId, "env", newHTML);
		if (!replaced) {
			new Notice("Could not find environment card in markdown for update.");
			return;
		}

	refreshBrowserView(plugin, "environment-view");
	};

	modal.open();
}

// Canvas Edit Flows

function editAdversaryInCanvas(
	cardElement: HTMLElement,
	cardName: string,
	plugin: DaggerForgePlugin,
): void {
	const cardData = extractCardData(cardElement);
	const modal = new TextInputModal(plugin, null, cardElement, cardData);

	modal.onEditUpdate = async (newHTML: string, newData: AdvData) => {
		try {
			replaceCardInCanvas(cardElement, newHTML, ".df-card-inner");
			await plugin.dataManager.addAdversary(newData);
			new Notice(`Updated adversary: ${cardName}`);
		} catch (error) {
			console.error("Error updating adversary:", error);
			new Notice("Error updating adversary. Check console for details.");
		}

		refreshBrowserView(plugin, "adversary-view");
	};

	modal.open();
}

function editEnvironmentInCanvas(
	cardElement: HTMLElement,
	cardName: string,
	plugin: DaggerForgePlugin,
): void {
	const envData = extractEnvironmentData(cardElement, cardName);
	// EnvironmentModal now accepts Editor | null — no cast needed.
	const modal = new EnvironmentModal(plugin, null, envData);

	modal.onEditUpdate = async (newHTML: string) => {
		try {
			replaceCardInCanvas(cardElement, newHTML, ".df-env-card-inner");
		} catch (error) {
			console.error("Error updating environment:", error);
			new Notice("Error updating environment. Check console for details.");
		}

		refreshBrowserView(plugin, "environment-view");
	};

	modal.open();
}

/**
 * Handle an edit click on a card inside a markdown note. Resolves the card
 * element and routes to the type-specific markdown edit flow.
 */
export const onEditClick = (
	evt: Event,
	cardType: "adv" | "env",
	plugin: DaggerForgePlugin,
): void => {
	evt.stopPropagation();

	const button = evt.target as HTMLElement;
	const cardElement = findCardElement(button, cardType);
	if (!cardElement) {
		new Notice("Could not find card element!");
		return;
	}

	const cardId = button.id;
	if (!cardId) {
		new Notice("Edit button missing ID!");
		return;
	}

	const cardName = getCardName(cardElement, cardType);

	if (cardType === "adv") {
		editAdversaryInMarkdown(cardElement, cardId, cardName, plugin);
	} else {
		editEnvironmentInMarkdown(cardElement, cardId, cardName, plugin);
	}
};

/**
 * Document-level click handler registered via registerDomEvent() in main.ts.
 *
 * Detects clicks on card edit buttons, determines whether the active view is
 * canvas or markdown, and routes to the appropriate edit path. Switches
 * markdown views into source mode if they are currently in preview.
 */
export async function handleCardEditClick(
	evt: MouseEvent,
	app: App,
	plugin?: DaggerForgePlugin,
): Promise<void> {
	const target = evt.target as HTMLElement;
	if (!target) return;

	const cardType = resolveCardType(target);
	if (!cardType) return;

	if (!plugin) {
		new Notice("Plugin instance not available for editing.");
		return;
	}

	const activeLeaf = app.workspace.activeLeaf;
	const isCanvas = activeLeaf?.view?.getViewType?.() === "canvas";

	if (isCanvas) {
		evt.stopPropagation();
		handleCanvasEdit(target, cardType, plugin);
		return;
	}

	await handleMarkdownEdit(evt, app, cardType, plugin);
}

function resolveCardType(target: HTMLElement): "adv" | "env" | null {
	if (target.matches(".df-env-edit-button")) return "env";
	if (target.closest(".df-adv-edit-button")) return "adv";
	return null;
}

function handleCanvasEdit(
	target: HTMLElement,
	cardType: "adv" | "env",
	plugin: DaggerForgePlugin,
) {
	const cardElement = findCardElement(target, cardType);
	if (!cardElement) {
		new Notice("Could not find card element!");
		return;
	}

	const cardName = getCardName(cardElement, cardType);

	if (cardType === "adv") {
		editAdversaryInCanvas(cardElement, cardName, plugin);
	} else {
		editEnvironmentInCanvas(cardElement, cardName, plugin);
	}
}

async function handleMarkdownEdit(
	evt: Event,
	app: App,
	cardType: "adv" | "env",
	plugin: DaggerForgePlugin,
) {
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return;

	// Switch to source mode if in preview — the editor API isn't available
	// in preview mode.
	if (view.getMode() !== "source") {
		const state = view.leaf.view.getState();
		state.mode = "source";
		await view.leaf.setViewState({ type: "markdown", state });
	}

	onEditClick(evt, cardType, plugin);
}
