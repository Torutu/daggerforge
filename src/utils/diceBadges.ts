import { rollDice } from "../features/dice/dice";

// ─── Dice token scanning (no regex) ────────────────────────────────────────
//
// A dice expression has the shape:
//   [digits] "d" digits [ ("+" | "-") digits ]
//
// Examples:  1d6   2d8+4   3d4-1   d12   1d6+2   2d10-3
//
// The scanner walks a string one character at a time and returns every
// { start, end } span that contains a valid dice expression.
// "end" is the exclusive index (i.e. text.slice(start, end) is the token).

interface Span {
	start: number;
	end: number;
}

function isDigit(ch: string): boolean {
	return ch >= "0" && ch <= "9";
}

function isLetter(ch: string): boolean {
	const lower = ch.toLowerCase();
	return lower >= "a" && lower <= "z";
}

/**
 * Returns all dice expression spans found in `text`, in order.
 * Uses only character-by-character inspection — no regex.
 */
function findDiceSpans(text: string): Span[] {
	const spans: Span[] = [];
	let i = 0;

	while (i < text.length) {
		if (!isDigit(text[i]) && text[i].toLowerCase() !== "d") {
			i++;
			continue;
		}

		const tokenStart = i;

		// Consume optional leading digits (the count)
		while (i < text.length && isDigit(text[i])) {
			i++;
		}

		// Must have a "d" or "D" next
		if (i >= text.length || text[i].toLowerCase() !== "d") {
			i++;
			continue;
		}
		i++; // consume the "d"

		// Must have at least one digit for the die size
		if (i >= text.length || !isDigit(text[i])) {
			continue;
		}
		while (i < text.length && isDigit(text[i])) {
			i++;
		}

		// Optional modifier (+N or -N)
		if (
			i < text.length &&
			(text[i] === "+" || text[i] === "-") &&
			i + 1 < text.length &&
			isDigit(text[i + 1])
		) {
			i++;
			while (i < text.length && isDigit(text[i])) {
				i++;
			}
		}

		// Character after token must not be a letter (e.g. "d20rpg" is not a token)
		if (i < text.length && isLetter(text[i])) {
			continue;
		}

		// Character before token must not be a letter
		if (tokenStart > 0 && isLetter(text[tokenStart - 1])) {
			continue;
		}

		spans.push({ start: tokenStart, end: i });
	}

	return spans;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Walk every text node inside `section` and replace any dice expression
 * with a <button class="df-inline-dice-btn" data-dice="2d6+4">.
 *
 * The click handler lives on document (registered in main.ts via
 * registerDomEvent) and reads data-dice — so no addEventListener is needed
 * here and nothing is lost when the HTML is serialized and re-rendered.
 *
 * Safe to call multiple times — already-processed nodes are skipped.
 */
export function attachDiceBadges(section: HTMLElement): void {
	const textNodes = collectDiceTextNodes(section);
	textNodes.forEach(splitNodeIntoBadges);
}

/**
 * Converts a card HTML string so that all dice expressions are already
 * <button data-dice="1d6"> tags before the string is written to the note.
 *
 * The buttons work because handleDiceBtnClick (registered on document in
 * main.ts) reads data-dice on every click — no addEventListener needed,
 * so nothing is lost when the HTML is serialized into the source file.
 */
export function injectDiceBadgesIntoHtml(html: string): string {
	const wrapper = document.createElement("div");
	wrapper.innerHTML = html;
	wrapper
		.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
		.forEach((section) => attachDiceBadges(section));
	return wrapper.innerHTML;
}

/**
 * The delegated click handler for all dice buttons.
 * Register this once on document in main.ts via registerDomEvent so it
 * survives plugin unload cleanup automatically.
 *
 * Usage in main.ts:
 *   this.registerDomEvent(document, "click", handleDiceBtnClick);
 */
export function handleDiceBtnClick(evt: MouseEvent): void {
	const target = evt.target as HTMLElement;
	const btn = target.closest<HTMLButtonElement>(".df-inline-dice-btn");
	if (!btn) return;

	evt.stopPropagation();

	const expression = btn.getAttribute("data-dice");
	if (!expression) return;

	showRollResult(btn, expression);
}

// ─── Text-node collection ────────────────────────────────────────────────────

function collectDiceTextNodes(root: HTMLElement): Text[] {
	const results: Text[] = [];

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode(node) {
			// Skip nodes already inside one of our buttons
			if ((node.parentElement as HTMLElement | null)?.closest(".df-inline-dice-btn")) {
				return NodeFilter.FILTER_REJECT;
			}
			const spans = findDiceSpans(node.nodeValue ?? "");
			return spans.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
		},
	});

	let node = walker.nextNode();
	while (node) {
		results.push(node as Text);
		node = walker.nextNode();
	}

	return results;
}

// ─── Node splitting ──────────────────────────────────────────────────────────

function splitNodeIntoBadges(node: Text): void {
	const parent = node.parentNode;
	if (!parent) return;

	const text = node.nodeValue ?? "";
	const spans = findDiceSpans(text);
	if (spans.length === 0) return;

	const fragment = document.createDocumentFragment();
	let cursor = 0;

	for (const span of spans) {
		if (span.start > cursor) {
			fragment.appendChild(document.createTextNode(text.slice(cursor, span.start)));
		}
		fragment.appendChild(buildDiceButton(text.slice(span.start, span.end)));
		cursor = span.end;
	}

	if (cursor < text.length) {
		fragment.appendChild(document.createTextNode(text.slice(cursor)));
	}

	parent.replaceChild(fragment, node);
}

// ─── Button factory ──────────────────────────────────────────────────────────

/**
 * Builds a dice button that carries its expression in data-dice.
 * No addEventListener — the delegated handler on document does the work.
 */
function buildDiceButton(expression: string): HTMLButtonElement {
	const btn = document.createElement("button");
	btn.className = "df-inline-dice-btn";
	btn.setAttribute("type", "button");
	btn.setAttribute("aria-label", `Roll ${expression}`);
	btn.setAttribute("data-dice", expression);
	btn.textContent = expression;
	return btn;
}

// ─── Roll result tooltip ─────────────────────────────────────────────────────

function showRollResult(anchor: HTMLButtonElement, expression: string): void {
	anchor.querySelector(".df-inline-dice-result")?.remove();

	const { total, details } = rollDice(expression);

	const tooltip = document.createElement("span");
	tooltip.className = "df-inline-dice-result";
	tooltip.textContent = `${total} ${details}`;
	anchor.appendChild(tooltip);

	window.setTimeout(() => tooltip.remove(), 2500);
}
