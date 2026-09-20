import { setIcon } from "obsidian";
import { rollDice } from "../features/dice/dice";
import { attachKeywordColors } from "./keywordBadges";
import { saveCollapseState, restoreCollapseState, restoreTickState, restoreWideState, restoreCountdownState, handleTickChange, getCardId, updateCountdownDisplay, store } from "./collapseState";
import { serializeChildren } from "./richContentTransform";
export { handleTickChange };

const COUNTDOWN_PREFIX = "df-env-countdown:";

/** Creates a `<button>` with an icon, appended into `parent`. */
function makeIconButton(parent: HTMLElement, cls: string, label: string, icon: string): HTMLButtonElement {
	const btn = parent.createEl("button", { cls, attr: { "aria-label": label } });
	setIcon(btn, icon);
	return btn;
}

/** Builds the minus/name/badge/plus(/reset) header row from real DOM nodes,
 *  so a countdown's name (user-authored, can arrive from an imported or
 *  shared record) is always inserted as text - never as HTML. */
function buildCountdownHeader(header: HTMLElement, name: string, total: number, isLoop: boolean): void {
	header.empty();

	makeIconButton(header, "df-env-countdown-minus", "Decrease", "minus");
	header.createSpan({ cls: "df-env-countdown-name-label", text: name });

	const badge = header.createSpan({ cls: "df-env-countdown-badge" });
	badge.createSpan({ cls: "df-env-countdown-current", text: "0" });
	badge.appendText(`/${total}`);

	makeIconButton(header, "df-env-countdown-plus", "Increase", "plus");

	if (isLoop) {
		makeIconButton(header, "df-env-countdown-reset-btn", "Reset", "undo-2");
	}
}

function applyRolledClock(clock: HTMLElement, name: string, total: number, originalDice?: string): void {
	clock.setAttribute("data-max", String(total));
	clock.removeAttribute("data-dice-max");

	if (originalDice) clock.setAttribute("data-original-dice", originalDice);

	const isLoop = clock.dataset.loop === "true";

	const header = clock.querySelector<HTMLElement>(".df-env-countdown-header");
	if (header) buildCountdownHeader(header, name, total, isLoop);

	clock.querySelector(".df-env-countdown-dice-roll")?.remove();

	if (!clock.querySelector(".df-env-countdown-tickboxes")) {
		const tickboxes = clock.createDiv({ cls: "df-env-countdown-tickboxes" });
		for (let i = 0; i < total; i++) {
			tickboxes.createEl("input", { cls: "df-env-countdown-tick", attr: { type: "checkbox" } });
		}
	}
}

export function handleCountdownDiceRoll(
	evt: MouseEvent,
	notify: (msg: string) => void,
): void {
	const btn = (evt.target as HTMLElement).closest<HTMLButtonElement>(".df-env-countdown-dice-roll");
	if (!btn) return;
	const clock = btn.closest<HTMLElement>(".df-env-countdown");
	const card  = btn.closest<HTMLElement>(".df-env-card-outer, .df-card-outer");
	if (!clock || !card) return;

	const expr = btn.dataset.diceExpr ?? "1d6";
	const { total, parts } = rollDice(expr);
	const name = clock.getAttribute("data-countdown-name") ?? "Countdown";
	const rolls = parts.filter(p => !p.isModifier).map(p => Math.abs(p.value));

	notify(`${name}: rolled ${expr} → [${rolls.join(", ")}] = ${total}`);

	applyRolledClock(clock, name, total, expr);

	// Persist so we can restore after page reload
	const id = getCardId(card) ?? "";
	if (id) {
		const idx = clock.getAttribute("data-countdown-idx") ?? "0";
		store.setItem(`${COUNTDOWN_PREFIX}${id}:${idx}`, "0".repeat(total));
	}
}

export function handleCountdownReset(
	evt: MouseEvent,
	notify: (msg: string) => void,
): void {
	const btn = (evt.target as HTMLElement).closest<HTMLButtonElement>(".df-env-countdown-reset-btn");
	if (!btn) return;
	const clock = btn.closest<HTMLElement>(".df-env-countdown");
	const card  = btn.closest<HTMLElement>(".df-env-card-outer, .df-card-outer");
	if (!clock || !card) return;

	const name = clock.getAttribute("data-countdown-name") ?? "Countdown";
	const originalDice = clock.getAttribute("data-original-dice");
	const id  = getCardId(card) ?? "";
	const idx = clock.getAttribute("data-countdown-idx") ?? "0";

	if (originalDice) {
		// Loop + dice: restore pre-roll state
		clock.removeAttribute("data-max");
		clock.removeAttribute("data-original-dice");
		clock.setAttribute("data-dice-max", originalDice);

		const header = clock.querySelector<HTMLElement>(".df-env-countdown-header");
		if (header) {
			header.empty();
			header.createSpan({ cls: "df-env-countdown-name-label", text: name });
			header.createSpan({ cls: "df-env-countdown-badge", text: originalDice });
		}

		clock.querySelector(".df-env-countdown-tickboxes")?.remove();

		clock.createEl("button", {
			cls: "df-env-countdown-dice-roll",
			text: `Roll ${originalDice}`,
			attr: { "data-dice-expr": originalDice, "aria-label": `Roll ${originalDice}` },
		});

		if (id) store.removeItem(`${COUNTDOWN_PREFIX}${id}:${idx}`);
	} else {
		// Loop, no dice: just reset ticks to 0
		clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick")
			.forEach(t => { t.checked = false; });
		updateCountdownDisplay(clock);

		const max = Number(clock.getAttribute("data-max") ?? "0");
		if (id) store.setItem(`${COUNTDOWN_PREFIX}${id}:${idx}`, "0".repeat(max));
	}

	notify(`${name}: reset`);
}

export function restoreRolledDiceCountdowns(section: HTMLElement): void {
	const id = getCardId(section);
	if (!id) return;

	section.querySelectorAll<HTMLElement>(".df-env-countdown[data-dice-max]").forEach(clock => {
		const idx   = clock.getAttribute("data-countdown-idx") ?? "0";
		const stored = store.getItem(`${COUNTDOWN_PREFIX}${id}:${idx}`);
		if (!stored) return;

		const name  = clock.getAttribute("data-countdown-name") ?? "Countdown";
		const total = stored.length;
		const originalDice = clock.getAttribute("data-dice-max") ?? undefined;

		applyRolledClock(clock, name, total, originalDice);

		const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
		for (let i = 0; i < ticks.length && i < stored.length; i++) {
			ticks[i].checked = stored[i] === "1";
		}
		updateCountdownDisplay(clock);
	});
}

let _tooltipMs = 2500;
export function setDiceTooltipDuration(ms: number): void { _tooltipMs = ms; }

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
 * Uses only character-by-character inspection - no regex.
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
 * registerDomEvent) and reads data-dice - so no addEventListener is needed
 * here and nothing is lost when the HTML is serialized and re-rendered.
 *
 * Safe to call multiple times - already-processed nodes are skipped.
 */
export function attachDiceBadges(section: HTMLElement): void {
	const textNodes = collectDiceTextNodes(section);
	textNodes.forEach(splitNodeIntoBadges);
	attachKeywordColors(section);
	restoreCollapseState(section);
	restoreTickState(section);
	restoreWideState(section);
	restoreCountdownState(section);
	restoreRolledDiceCountdowns(section);
}

/**
 * Converts a card HTML string so that all dice expressions are already
 * <button data-dice="1d6"> tags before the string is written to the note.
 *
 * The buttons work because handleDiceBtnClick (registered on document in
 * main.ts) reads data-dice on every click - no addEventListener needed,
 * so nothing is lost when the HTML is serialized into the source file.
 */
export function injectDiceBadgesIntoHtml(html: string): string {
	// DOMParser to read, serializeChildren to write back out - no direct
	// markup-string property is used on either side (see CLAUDE.md).
	const wrapper = new DOMParser().parseFromString(html, "text/html").body;
	wrapper
		.querySelectorAll<HTMLElement>(".df-card-outer, .df-env-card-outer")
		.forEach((section) => attachDiceBadges(section));
	return serializeChildren(wrapper);
}

/**
 * The delegated click handler for all dice buttons.
 * Register this once on document in main.ts via registerDomEvent so it
 * survives plugin unload cleanup automatically.
 *
 * Usage in main.ts:
 *   this.registerDomEvent(document, "click", handleDiceBtnClick);
 */
export function handleCollapseClick(evt: MouseEvent): void {
	const btn = (evt.target as HTMLElement).closest<HTMLButtonElement>(".df-adv-collapse-btn");
	if (!btn) return;
	const card = btn.closest<HTMLElement>(".df-card-outer");
	if (!card) return;
	card.classList.toggle("df-expanded");
	saveCollapseState(card);
}

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
			const parent = node.parentElement;
			// Skip nodes already inside one of our buttons or countdown sections
			if (parent?.closest(".df-inline-dice-btn, .df-env-countdown-badge, .df-env-countdown-dice-roll")) {
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

// node stays in the tree as a positional cursor - every replacement piece is
// inserted with node.before(...), preserving order, then node itself is
// removed. This avoids a DocumentFragment (which is not an HTMLElement and
// so has no createEl of its own) while still doing the whole splice as one
// pass through the original text.
function splitNodeIntoBadges(node: Text): void {
	const parent = node.parentElement;
	if (!parent) return;

	const text = node.nodeValue ?? "";
	const spans = findDiceSpans(text);
	if (spans.length === 0) return;

	let cursor = 0;

	for (const span of spans) {
		if (span.start > cursor) {
			node.before(document.createTextNode(text.slice(cursor, span.start)));
		}
		node.before(buildDiceButton(parent, text.slice(span.start, span.end)));
		cursor = span.end;
	}

	if (cursor < text.length) {
		node.before(document.createTextNode(text.slice(cursor)));
	}

	node.remove();
}

// ─── Button factory ──────────────────────────────────────────────────────────

/**
 * Builds a dice button that carries its expression in data-dice, appended
 * (temporarily - the caller repositions it with Node.before()) to `parent`.
 * No addEventListener - the delegated handler on document does the work.
 */
function buildDiceButton(parent: HTMLElement, expression: string): HTMLButtonElement {
	return parent.createEl("button", {
		cls: "df-inline-dice-btn",
		text: expression,
		attr: {
			type: "button",
			"aria-label": `Roll ${expression}`,
			"data-dice": expression,
		},
	});
}

// ─── Roll result tooltip ─────────────────────────────────────────────────────

function showRollResult(anchor: HTMLButtonElement, expression: string): void {
	anchor.querySelector(".df-inline-dice-result")?.remove();

	const { total, parts } = rollDice(expression);

	const tooltip = anchor.createSpan({ cls: "df-inline-dice-result" });
	tooltip.appendText(`${total} [`);
	parts.forEach((p, i) => {
		if (i > 0) tooltip.appendText(", ");
		if (!p.isModifier) {
			tooltip.appendText(String(p.value));
			return;
		}
		const cls = p.value >= 0 ? "df-dice-part-pos" : "df-dice-part-neg";
		const label = p.value > 0 ? `+${p.value}` : String(p.value);
		tooltip.createSpan({ cls, text: label });
	});
	tooltip.appendText("]");

	const btnRect = anchor.getBoundingClientRect();
	const btnCenter = btnRect.left + btnRect.width / 2;
	if (btnCenter < window.innerWidth / 2) {
		tooltip.setCssProps({ left: "0", transform: "none" });
	} else {
		tooltip.setCssProps({ left: "auto", right: "0", transform: "none" });
	}

	window.setTimeout(() => tooltip.remove(), _tooltipMs);
}
