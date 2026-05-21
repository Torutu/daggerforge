import { rollDice } from "../features/dice/dice";
import { attachKeywordColors } from "./keywordBadges";
import { saveCollapseState, restoreCollapseState, restoreTickState, restoreWideState, restoreCountdownState, handleTickChange, getCardId, updateCountdownDisplay } from "./collapseState";
export { handleTickChange };

const COUNTDOWN_PREFIX = "df-env-countdown:";
const MINUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>`;
const PLUS_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
const RESET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`;

function applyRolledClock(clock: HTMLElement, name: string, total: number, originalDice?: string): void {
	clock.setAttribute("data-max", String(total));
	clock.removeAttribute("data-dice-max");

	if (originalDice) clock.setAttribute("data-original-dice", originalDice);

	const isLoop = clock.dataset.loop === "true";
	const resetBtn = isLoop
		? `<button class="df-env-countdown-reset-btn" aria-label="Reset">${RESET_SVG}</button>`
		: "";

	const header = clock.querySelector(".df-env-countdown-header");
	if (header) {
		header.innerHTML =
			`<button class="df-env-countdown-minus" aria-label="Decrease">${MINUS_SVG}</button>` +
			`<span class="df-env-countdown-name-label">${name}</span>` +
			`<span class="df-env-countdown-badge"><span class="df-env-countdown-current">0</span>/${total}</span>` +
			`<button class="df-env-countdown-plus" aria-label="Increase">${PLUS_SVG}</button>` +
			resetBtn;
	}

	clock.querySelector(".df-env-countdown-dice-roll")?.remove();

	if (!clock.querySelector(".df-env-countdown-tickboxes")) {
		const tickboxes = document.createElement("div");
		tickboxes.className = "df-env-countdown-tickboxes";
		for (let i = 0; i < total; i++) {
			const tick = document.createElement("input");
			tick.type = "checkbox";
			tick.className = "df-env-countdown-tick";
			tickboxes.appendChild(tick);
		}
		clock.appendChild(tickboxes);
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
		localStorage.setItem(`${COUNTDOWN_PREFIX}${id}:${idx}`, "0".repeat(total));
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

		const header = clock.querySelector(".df-env-countdown-header");
		if (header) {
			header.innerHTML =
				`<span class="df-env-countdown-name-label">${name}</span>` +
				`<span class="df-env-countdown-badge">${originalDice}</span>`;
		}

		clock.querySelector(".df-env-countdown-tickboxes")?.remove();

		const rollBtn = document.createElement("button");
		rollBtn.className = "df-env-countdown-dice-roll";
		rollBtn.dataset.diceExpr = originalDice;
		rollBtn.setAttribute("aria-label", `Roll ${originalDice}`);
		rollBtn.textContent = `Roll ${originalDice}`;
		clock.appendChild(rollBtn);

		if (id) localStorage.removeItem(`${COUNTDOWN_PREFIX}${id}:${idx}`);
	} else {
		// Loop, no dice: just reset ticks to 0
		clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick")
			.forEach(t => { t.checked = false; });
		updateCountdownDisplay(clock);

		const max = Number(clock.getAttribute("data-max") ?? "0");
		if (id) localStorage.setItem(`${COUNTDOWN_PREFIX}${id}:${idx}`, "0".repeat(max));
	}

	notify(`${name}: reset`);
}

export function restoreRolledDiceCountdowns(section: HTMLElement): void {
	const id = getCardId(section);
	if (!id) return;

	section.querySelectorAll<HTMLElement>(".df-env-countdown[data-dice-max]").forEach(clock => {
		const idx   = clock.getAttribute("data-countdown-idx") ?? "0";
		const stored = localStorage.getItem(`${COUNTDOWN_PREFIX}${id}:${idx}`);
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
			const parent = node.parentElement as HTMLElement | null;
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

	const { total, parts } = rollDice(expression);

	const partsHtml = parts.map((p) => {
		if (!p.isModifier) return String(p.value);
		const cls = p.value >= 0 ? "df-dice-part-pos" : "df-dice-part-neg";
		const label = p.value > 0 ? `+${p.value}` : String(p.value);
		return `<span class="${cls}">${label}</span>`;
	}).join(", ");

	const tooltip = document.createElement("span");
	tooltip.className = "df-inline-dice-result";
	tooltip.innerHTML = `${total} [${partsHtml}]`;
	anchor.appendChild(tooltip);

	const btnRect = anchor.getBoundingClientRect();
	const btnCenter = btnRect.left + btnRect.width / 2;
	if (btnCenter < window.innerWidth / 2) {
		tooltip.style.left = "0";
		tooltip.style.transform = "none";
	} else {
		tooltip.style.left = "auto";
		tooltip.style.right = "0";
		tooltip.style.transform = "none";
	}

	window.setTimeout(() => tooltip.remove(), _tooltipMs);
}
