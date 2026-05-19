import { App, Modal } from "obsidian";
import { makeDraggable } from "../../utils/makeDraggable";

// ── Icons ─────────────────────────────────────────────────────────────────────
const ZAP    = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const SLIDERS= `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>`;
const SWORDS = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/></svg>`;
const TRASH  = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
const X_SM   = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

// ── Data ──────────────────────────────────────────────────────────────────────
interface EncounterState {
	baseBP: number;
	adjustments: { value: number; reason: string }[];
	spentItems: { cost: number; label: string }[];
	pcCount: number;
}

const ADJUSTMENTS = [
	{ value: -1, label: "Less difficult / shorter" },
	{ value: -2, label: "2+ Solo adversaries" },
	{ value: -2, label: "+1d4 or +2 damage" },
	{ value:  1, label: "Lower tier adversary" },
	{ value:  1, label: "No Bruisers / Hordes / Leaders / Solos" },
	{ value:  2, label: "More dangerous / longer" },
];

const SPEND_OPTIONS = [
	{ cost: 1, label: "Minions (party size)" },
	{ cost: 1, label: "Social / Support" },
	{ cost: 2, label: "Horde / Ranged / Skulk / Standard" },
	{ cost: 3, label: "Leader" },
	{ cost: 4, label: "Bruiser" },
	{ cost: 5, label: "Solo" },
];

// ── Modal ─────────────────────────────────────────────────────────────────────
export class EncounterCalcModal extends Modal {
	private state: EncounterState = { baseBP: 0, adjustments: [], spentItems: [], pcCount: 3 };

	constructor(app: App) {
		super(app);
		this.titleEl.setText("Battle Calculator");
	}

	onOpen(): void {
		makeDraggable(this.modalEl, this.modalEl);
		this.modalEl.addClass("df-enc-modal");

		const { contentEl } = this;
		contentEl.addClass("df-enc-content");

		// ── Header row ────────────────────────────────────────────────────
		const headerRow = contentEl.createEl("div", { cls: "df-enc-header-row" });

		const pcGroup = headerRow.createEl("div", { cls: "df-enc-pc-group" });
		pcGroup.createEl("label", { cls: "df-enc-label", text: "Number of PCs" });
		const pcInput = pcGroup.createEl("input", { cls: "df-enc-pc-input" }) as HTMLInputElement;
		pcInput.type = "number";
		pcInput.min = "1";
		pcInput.max = "10";
		pcInput.value = this.state.pcCount.toString();

		const calcBtn = headerRow.createEl("button", { cls: "df-enc-calc-btn" });
		calcBtn.innerHTML = `${ZAP}<span>Calculate</span>`;

		// ── Stats bar ─────────────────────────────────────────────────────
		const statsBar = contentEl.createEl("div", { cls: "df-enc-stats" });
		const makeStatEl = (label: string, cls = "") => {
			const chip = statsBar.createEl("div", { cls: `df-enc-stat ${cls}` });
			chip.createEl("span", { cls: "df-enc-stat-label", text: label });
			const val = chip.createEl("span", { cls: "df-enc-stat-value", text: "0" });
			return val;
		};
		const svBase      = makeStatEl("Base BP");
		const svAdj       = makeStatEl("Adjustments");
		const svSpent     = makeStatEl("Spent");
		const svRemaining = makeStatEl("Remaining", "df-enc-stat--highlight");

		// ── Log columns ───────────────────────────────────────────────────
		const columnsDiv = contentEl.createEl("div", { cls: "df-enc-columns" });

		const adjCol = columnsDiv.createEl("div", { cls: "df-enc-column" });
		const adjColHead = adjCol.createEl("div", { cls: "df-enc-col-header" });
		adjColHead.innerHTML = `${SLIDERS}<span>Adjustments</span>`;
		const adjustmentsList = adjCol.createEl("div", { cls: "df-enc-log" });

		const spendCol = columnsDiv.createEl("div", { cls: "df-enc-column" });
		const spendColHead = spendCol.createEl("div", { cls: "df-enc-col-header" });
		spendColHead.innerHTML = `${SWORDS}<span>Spending</span>`;
		const spendingList = spendCol.createEl("div", { cls: "df-enc-log" });

		// ── Adjustment buttons ────────────────────────────────────────────
		const adjSection = contentEl.createEl("div", { cls: "df-enc-section" });
		const adjHead = adjSection.createEl("div", { cls: "df-enc-section-label" });
		adjHead.innerHTML = `${SLIDERS}<span>Adjust Battle Points</span>`;
		const adjGrid = adjSection.createEl("div", { cls: "df-enc-btn-grid" });
		ADJUSTMENTS.forEach(adj => {
			const btn = adjGrid.createEl("button", { cls: "df-enc-action-btn" });
			btn.setAttribute("data-adjust", adj.value.toString());
			btn.createEl("span", { cls: "df-enc-btn-label", text: adj.label });
			btn.createEl("span", {
				cls: `df-enc-badge ${adj.value > 0 ? "df-enc-badge--pos" : "df-enc-badge--neg"}`,
				text: adj.value > 0 ? `+${adj.value}` : `${adj.value}`,
			});
		});

		// ── Spend buttons ─────────────────────────────────────────────────
		const spendSection = contentEl.createEl("div", { cls: "df-enc-section" });
		const spendHead = spendSection.createEl("div", { cls: "df-enc-section-label" });
		spendHead.innerHTML = `${SWORDS}<span>Spend Battle Points</span>`;
		const spendGrid = spendSection.createEl("div", { cls: "df-enc-btn-grid" });
		SPEND_OPTIONS.forEach(opt => {
			const btn = spendGrid.createEl("button", { cls: "df-enc-action-btn" });
			btn.setAttribute("data-cost", opt.cost.toString());
			btn.createEl("span", { cls: "df-enc-btn-label", text: opt.label });
			btn.createEl("span", { cls: "df-enc-badge df-enc-badge--cost", text: `-${opt.cost}` });
		});

		// ── Footer ────────────────────────────────────────────────────────
		const footer = contentEl.createEl("div", { cls: "df-enc-footer" });
		const clearBtn = footer.createEl("button", { cls: "df-enc-clear-btn" });
		clearBtn.innerHTML = `${TRASH}<span>Clear all</span>`;

		// ── Logic ─────────────────────────────────────────────────────────
		const totals = () => {
			const adj   = this.state.adjustments.reduce((s, a) => s + a.value, 0);
			const spent = this.state.spentItems.reduce((s, i) => s + i.cost, 0);
			return { adj, spent, remaining: this.state.baseBP + adj - spent };
		};

		const updateDisplay = () => {
			// Adjustment log
			adjustmentsList.empty();
			this.state.adjustments.forEach((a, i) => {
				const row = adjustmentsList.createEl("div", { cls: "df-enc-log-row" });
				row.createEl("span", { cls: "df-enc-log-text", text: a.reason });
				row.createEl("span", {
					cls: `df-enc-log-val ${a.value >= 0 ? "df-enc-pos" : "df-enc-neg"}`,
					text: a.value >= 0 ? `+${a.value}` : `${a.value}`,
				});
				const rm = row.createEl("button", { cls: "df-enc-remove-btn" });
				rm.innerHTML = X_SM;
				rm.addEventListener("click", () => { this.state.adjustments.splice(i, 1); updateDisplay(); });
			});

			// Spending log
			spendingList.empty();
			this.state.spentItems.forEach((item, i) => {
				const row = spendingList.createEl("div", { cls: "df-enc-log-row" });
				row.createEl("span", { cls: "df-enc-log-text", text: item.label });
				row.createEl("span", { cls: "df-enc-log-val df-enc-neg", text: `-${item.cost}` });
				const rm = row.createEl("button", { cls: "df-enc-remove-btn" });
				rm.innerHTML = X_SM;
				rm.addEventListener("click", () => { this.state.spentItems.splice(i, 1); updateDisplay(); });
			});

			// Stats
			const { adj, spent, remaining } = totals();
			svBase.textContent      = this.state.baseBP.toString();
			svAdj.textContent       = adj >= 0 ? `+${adj}` : `${adj}`;
			svSpent.textContent     = spent.toString();
			svRemaining.textContent = remaining.toString();
			svRemaining.className = `df-enc-stat-value df-enc-stat-big ${remaining < 0 ? "df-enc-neg" : remaining > 0 ? "df-enc-pos" : ""}`;

			adjustmentsList.scrollTop = adjustmentsList.scrollHeight;
			spendingList.scrollTop    = spendingList.scrollHeight;
		};

		// Events
		calcBtn.addEventListener("click", () => {
			this.state.pcCount     = Number(pcInput.value);
			this.state.baseBP      = 3 * this.state.pcCount + 2;
			this.state.adjustments = [];
			this.state.spentItems  = [];
			updateDisplay();
		});

		contentEl.querySelectorAll("[data-adjust]").forEach(btn => {
			btn.addEventListener("click", () => {
				const val    = parseInt((btn as HTMLElement).dataset.adjust!);
				const reason = (btn as HTMLElement).querySelector(".df-enc-btn-label")?.textContent ?? "";
				this.state.adjustments.push({ value: val, reason });
				updateDisplay();
			});
		});

		contentEl.querySelectorAll("[data-cost]").forEach(btn => {
			btn.addEventListener("click", () => {
				const cost  = parseInt((btn as HTMLElement).dataset.cost!);
				const label = (btn as HTMLElement).querySelector(".df-enc-btn-label")?.textContent ?? "";
				this.state.spentItems.push({ cost, label });
				updateDisplay();
			});
		});

		clearBtn.addEventListener("click", () => {
			this.state = { baseBP: 0, adjustments: [], spentItems: [], pcCount: Number(pcInput.value) };
			updateDisplay();
		});

		pcInput.addEventListener("change", () => { this.state.pcCount = Number(pcInput.value); });

		updateDisplay();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** @deprecated use EncounterCalcModal */
export function openEncounterCalculator(app: App): void {
	new EncounterCalcModal(app).open();
}
