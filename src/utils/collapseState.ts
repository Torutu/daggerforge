const COLLAPSE_PREFIX = "df-adv-collapse:";
const TICK_PREFIX     = "df-adv-ticks:";
const WIDE_PREFIX     = "df-card-wide:";

// Use localStorage so tick/collapse/wide state survives Obsidian restarts.
const store = localStorage;

function getCardId(card: HTMLElement): string | null {
	return (card.querySelector<HTMLElement>("h2") ?? card.querySelector<HTMLElement>(".df-env-name"))?.id ?? null;
}

function getTickboxes(card: HTMLElement): HTMLInputElement[] {
	return Array.from(card.querySelectorAll<HTMLInputElement>(
		".df-hp-tickbox, .df-stress-tickbox"
	));
}

// ── Collapse state ────────────────────────────────────────────────────────────
// Default is COLLAPSED. CSS handles it via :not(.df-expanded).
// We only store a key when the user EXPANDS (deviates from default).

export function saveCollapseState(card: HTMLElement): void {
	const id = getCardId(card);
	if (!id) return;
	if (card.classList.contains("df-expanded")) {
		store.setItem(COLLAPSE_PREFIX + id, "1");
	} else {
		store.removeItem(COLLAPSE_PREFIX + id);
	}
}

export function restoreCollapseState(card: HTMLElement): void {
	if (!card.classList.contains("df-card-outer")) return;
	const id = getCardId(card);
	if (!id) return;
	const shouldExpand = store.getItem(COLLAPSE_PREFIX + id) === "1";
	if (card.classList.contains("df-expanded") !== shouldExpand) {
		card.classList.toggle("df-expanded", shouldExpand);
	}
}

// ── Tick (checkbox) state ─────────────────────────────────────────────────────

export function saveTickState(card: HTMLElement): void {
	const id = getCardId(card);
	if (!id) return;
	const boxes = getTickboxes(card);
	if (boxes.length === 0) return;
	const state = boxes.map(cb => cb.checked ? "1" : "0").join("");
	store.setItem(TICK_PREFIX + id, state);
}

export function restoreTickState(card: HTMLElement): void {
	if (!card.classList.contains("df-card-outer")) return;
	const id = getCardId(card);
	if (!id) return;
	const stored = store.getItem(TICK_PREFIX + id);
	if (!stored) return;
	const boxes = getTickboxes(card);
	for (let i = 0; i < boxes.length && i < stored.length; i++) {
		boxes[i].checked = stored[i] === "1";
	}
}

export function handleTickChange(evt: Event): void {
	const cb = evt.target as HTMLInputElement;
	if (!cb.classList.contains("df-hp-tickbox") && !cb.classList.contains("df-stress-tickbox")) return;
	const card = cb.closest<HTMLElement>(".df-card-outer");
	if (!card) return;
	saveTickState(card);
}

// ── Wide state ────────────────────────────────────────────────────────────────

export function saveWideState(card: HTMLElement): void {
	const id = getCardId(card);
	if (!id) return;
	if (card.classList.contains("df-card--wide")) {
		store.setItem(WIDE_PREFIX + id, "1");
	} else {
		store.removeItem(WIDE_PREFIX + id);
	}
}

export function restoreWideState(card: HTMLElement): void {
	const id = getCardId(card);
	if (!id) return;
	if (store.getItem(WIDE_PREFIX + id) === "1") {
		card.classList.add("df-card--wide");
	}
}

export function handleWideToggleClick(evt: MouseEvent): void {
	const btn = (evt.target as HTMLElement).closest<HTMLButtonElement>(".df-wide-toggle-btn");
	if (!btn) return;
	const card = btn.closest<HTMLElement>(".df-card-outer, .df-env-card-outer");
	if (!card) return;
	card.classList.toggle("df-card--wide");
	saveWideState(card);
}
