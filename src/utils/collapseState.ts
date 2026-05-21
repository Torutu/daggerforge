const COLLAPSE_PREFIX = "df-adv-collapse:";
const TICK_PREFIX     = "df-adv-ticks:";
const WIDE_PREFIX     = "df-card-wide:";

// Use localStorage so tick/collapse/wide state survives Obsidian restarts.
// Lazy accessor so the module loads safely in Node (test) environments.
const store = {
	getItem:    (k: string)         => localStorage.getItem(k),
	setItem:    (k: string, v: string) => localStorage.setItem(k, v),
	removeItem: (k: string)         => localStorage.removeItem(k),
};

export function getCardId(card: HTMLElement): string | null {
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
	const isHp     = cb.classList.contains("df-hp-tickbox");
	const isStress = cb.classList.contains("df-stress-tickbox");
	if (!isHp && !isStress) return;

	const row  = cb.closest<HTMLElement>(".df-hp-tickboxes, .df-stress-tickboxes");
	const card = cb.closest<HTMLElement>(".df-card-outer");
	if (!row || !card) return;

	const cls   = isHp ? ".df-hp-tickbox" : ".df-stress-tickbox";
	const ticks = Array.from(row.querySelectorAll<HTMLInputElement>(cls));
	const i     = ticks.indexOf(cb);

	let newFill: number;
	if (cb.checked) {
		newFill = i + 1;
	} else {
		const anyAfterChecked = ticks.slice(i + 1).some(t => t.checked);
		newFill = anyAfterChecked ? i + 1 : i;
	}

	ticks.forEach((t, idx) => { t.checked = idx < newFill; });
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

export function updateCountdownDisplay(clock: HTMLElement): void {
	const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
	const count = ticks.filter(t => t.checked).length;
	const el = clock.querySelector<HTMLElement>(".df-env-countdown-current");
	if (el) el.textContent = String(count);
}

function saveClockState(clock: HTMLElement, cardId: string): void {
	const idx = clock.getAttribute("data-countdown-idx") ?? "0";
	const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
	store.setItem(`${COUNTDOWN_PREFIX}${cardId}:${idx}`, ticks.map(t => t.checked ? "1" : "0").join(""));
}

export function restoreCountdownState(card: HTMLElement): void {
	const id = getCardId(card);
	if (!id) return;

	// Restore collapse state (default: expanded)
	const isCollapsed = store.getItem(COUNTDOWN_OPEN_PREFIX + id) === "0";
	card.classList.toggle("df-countdown-collapsed", isCollapsed);

	// Restore each clock's tick state (dice-based clocks are handled separately)
	card.querySelectorAll<HTMLElement>(".df-env-countdown").forEach(clock => {
		if (clock.hasAttribute("data-dice-max")) return;
		const idx = clock.getAttribute("data-countdown-idx") ?? "0";
		const stored = store.getItem(`${COUNTDOWN_PREFIX}${id}:${idx}`);
		if (stored) {
			const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
			for (let i = 0; i < ticks.length && i < stored.length; i++) {
				ticks[i].checked = stored[i] === "1";
			}
		}
		updateCountdownDisplay(clock);
	});
}

export function handleCountdownClick(evt: MouseEvent): void {
	const target = evt.target as HTMLElement;

	// Collapse button — toggles all countdowns on the card
	const collapseBtn = target.closest<HTMLButtonElement>(".df-env-countdown-collapse-btn");
	if (collapseBtn) {
		const card = collapseBtn.closest<HTMLElement>(".df-env-card-outer");
		if (!card) return;
		card.classList.toggle("df-countdown-collapsed");
		const id = getCardId(card);
		if (id) store.setItem(COUNTDOWN_OPEN_PREFIX + id, card.classList.contains("df-countdown-collapsed") ? "0" : "1");
		return;
	}

	// Plus — advance to next unchecked tick
	const plusBtn = target.closest<HTMLButtonElement>(".df-env-countdown-plus");
	if (plusBtn) {
		const clock = plusBtn.closest<HTMLElement>(".df-env-countdown");
		const card  = plusBtn.closest<HTMLElement>(".df-env-card-outer, .df-card-outer");
		if (!clock || !card) return;
		const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
		const next = ticks.find(t => !t.checked);
		if (next) { next.checked = true; updateCountdownDisplay(clock); saveClockState(clock, getCardId(card) ?? ""); }
		return;
	}

	// Minus — uncheck the last filled tick
	const minusBtn = target.closest<HTMLButtonElement>(".df-env-countdown-minus");
	if (minusBtn) {
		const clock = minusBtn.closest<HTMLElement>(".df-env-countdown");
		const card  = minusBtn.closest<HTMLElement>(".df-env-card-outer, .df-card-outer");
		if (!clock || !card) return;
		const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick")).reverse();
		const last = ticks.find(t => t.checked);
		if (last) { last.checked = false; updateCountdownDisplay(clock); saveClockState(clock, getCardId(card) ?? ""); }
		return;
	}
}

export function handleCountdownTickChange(evt: Event): void {
	const cb = evt.target as HTMLInputElement;
	if (!cb.classList.contains("df-env-countdown-tick")) return;
	const clock = cb.closest<HTMLElement>(".df-env-countdown");
	const card  = cb.closest<HTMLElement>(".df-env-card-outer, .df-card-outer");
	if (!clock || !card) return;

	const ticks = Array.from(clock.querySelectorAll<HTMLInputElement>(".df-env-countdown-tick"));
	const i = ticks.indexOf(cb);

	// Fill-bar logic:
	// - Click unchecked tick N → fill 0..N
	// - Click checked tick N → if it was the tip (nothing after it checked), shrink to N-1;
	//   otherwise trim everything after N, keeping 0..N filled
	let newFill: number;
	if (cb.checked) {
		newFill = i + 1;
	} else {
		const anyAfterChecked = ticks.slice(i + 1).some(t => t.checked);
		newFill = anyAfterChecked ? i + 1 : i;
	}

	ticks.forEach((t, idx) => { t.checked = idx < newFill; });
	updateCountdownDisplay(clock);
	saveClockState(clock, getCardId(card) ?? "");
}
