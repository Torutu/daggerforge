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

// ── Countdown state ───────────────────────────────────────────────────────────

const COUNTDOWN_PREFIX      = "df-env-countdown:";
const COUNTDOWN_OPEN_PREFIX = "df-env-countdown-open:";

function getEnvCardId(section: HTMLElement): string | null {
	return section.closest<HTMLElement>(".df-env-card-outer")
		?.querySelector<HTMLElement>(".df-env-name")?.id ?? null;
}

function updateCountdownDisplay(section: HTMLElement): void {
	const ticks = Array.from(section.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
	const count = ticks.filter(t => t.checked).length;
	const el = section.querySelector<HTMLElement>(".df-env-countdown-current");
	if (el) el.textContent = String(count);
}

export function saveCountdownState(section: HTMLElement): void {
	const id = getEnvCardId(section);
	if (!id) return;
	const ticks = Array.from(section.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
	const state = ticks.map(t => t.checked ? "1" : "0").join("");
	store.setItem(COUNTDOWN_PREFIX + id, state);
}

export function restoreCountdownState(card: HTMLElement): void {
	const id = getCardId(card);
	if (!id) return;
	const section = card.querySelector<HTMLElement>(".df-env-countdown-section");
	if (!section) return;

	// Restore collapse state (default: expanded — no key means open)
	const isCollapsed = store.getItem(COUNTDOWN_OPEN_PREFIX + id) === "0";
	section.classList.toggle("df-env-countdown--collapsed", isCollapsed);

	// Restore tick state
	const stored = store.getItem(COUNTDOWN_PREFIX + id);
	if (stored) {
		const ticks = Array.from(section.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
		for (let i = 0; i < ticks.length && i < stored.length; i++) {
			ticks[i].checked = stored[i] === "1";
		}
	}
	updateCountdownDisplay(section);
}

export function handleCountdownClick(evt: MouseEvent): void {
	const target = evt.target as HTMLElement;

	// Toggle collapse
	const toggleBtn = target.closest<HTMLButtonElement>(".df-env-countdown-toggle-btn");
	if (toggleBtn) {
		const section = toggleBtn.closest<HTMLElement>(".df-env-countdown-section");
		if (!section) return;
		section.classList.toggle("df-env-countdown--collapsed");
		const id = getEnvCardId(section);
		if (id) store.setItem(COUNTDOWN_OPEN_PREFIX + id, section.classList.contains("df-env-countdown--collapsed") ? "0" : "1");
		return;
	}

	// Plus — check next unchecked tick
	const plusBtn = target.closest<HTMLButtonElement>(".df-env-countdown-plus");
	if (plusBtn) {
		const section = plusBtn.closest<HTMLElement>(".df-env-countdown-section");
		if (!section) return;
		const ticks = Array.from(section.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
		const next = ticks.find(t => !t.checked);
		if (next) { next.checked = true; updateCountdownDisplay(section); saveCountdownState(section); }
		return;
	}

	// Minus — uncheck last checked tick
	const minusBtn = target.closest<HTMLButtonElement>(".df-env-countdown-minus");
	if (minusBtn) {
		const section = minusBtn.closest<HTMLElement>(".df-env-countdown-section");
		if (!section) return;
		const ticks = Array.from(section.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick")).reverse();
		const last = ticks.find(t => t.checked);
		if (last) { last.checked = false; updateCountdownDisplay(section); saveCountdownState(section); }
		return;
	}
}

export function handleCountdownTickChange(evt: Event): void {
	const cb = evt.target as HTMLInputElement;
	if (!cb.classList.contains("df-env-countdown-tick")) return;
	const section = cb.closest<HTMLElement>(".df-env-countdown-section");
	if (!section) return;
	updateCountdownDisplay(section);
	saveCountdownState(section);
}
