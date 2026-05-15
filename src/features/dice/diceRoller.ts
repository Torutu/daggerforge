import { App, Modal } from "obsidian";
import { rollDice } from "../index";
import { makeDraggable } from "../../utils/makeDraggable";

// ── Icons ─────────────────────────────────────────────────────────────────────
const PLAY    = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const DICE    = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M12 12h.01"/><path d="M16 16h.01"/><path d="M8 16h.01"/></svg>`;
const HISTORY = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`;
const TRASH   = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
const X_SM    = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

const DICE_SIDES = ["4", "6", "8", "10", "12", "20", "100"];

const diceLog: string[] = [];

export class DiceRollerModal extends Modal {
	constructor(app: App) {
		super(app);
		this.titleEl.setText("Dice Roller");
	}

	onOpen(): void {
		makeDraggable(this.modalEl, this.titleEl);
		this.modalEl.addClass("df-dr-modal");

		const { contentEl } = this;
		contentEl.addClass("df-dr-content");

		// ── Controls row ──────────────────────────────────────────────────
		const controls = contentEl.createEl("div", { cls: "df-dr-controls" });

		const countGroup = controls.createEl("div", { cls: "df-dr-count-group" });
		countGroup.createEl("label", { cls: "df-dr-label", text: "Count" });
		const countInput = countGroup.createEl("input", { cls: "df-dr-count-input" }) as HTMLInputElement;
		countInput.type = "number";
		countInput.min = "1";
		countInput.max = "99";
		countInput.value = "1";

		const rollBtn = controls.createEl("button", { cls: "df-dr-roll-btn" });
		rollBtn.innerHTML = `${PLAY}<span>Roll All</span>`;

		// ── Dice grid ─────────────────────────────────────────────────────
		const diceSection = contentEl.createEl("div", { cls: "df-dr-section" });
		const diceSectionLabel = diceSection.createEl("div", { cls: "df-dr-section-label" });
		diceSectionLabel.innerHTML = `${DICE}<span>Select dice</span>`;

		const diceGrid = diceSection.createEl("div", { cls: "df-dr-dice-grid" });
		DICE_SIDES.forEach(sides => {
			const btn = diceGrid.createEl("button", { cls: "df-dr-die-btn" });
			btn.setAttribute("data-sides", sides);
			btn.createEl("span", { cls: "df-dr-die-label", text: `d${sides}` });
		});

		// ── Queue ─────────────────────────────────────────────────────────
		const queueSection = contentEl.createEl("div", { cls: "df-dr-queue-section" });
		const queueHeader = queueSection.createEl("div", { cls: "df-dr-queue-header" });
		queueHeader.createEl("span", { cls: "df-dr-section-label-text", text: "Queue" });
		const queueContainer = queueSection.createEl("div", { cls: "df-dr-queue" });

		// ── Log ───────────────────────────────────────────────────────────
		const logSection = contentEl.createEl("div", { cls: "df-dr-log-section" });
		const logHeader = logSection.createEl("div", { cls: "df-dr-log-header" });
		const logTitle = logHeader.createEl("div", { cls: "df-dr-section-label" });
		logTitle.innerHTML = `${HISTORY}<span>Roll History</span>`;
		const clearBtn = logHeader.createEl("button", { cls: "df-dr-clear-btn" });
		clearBtn.innerHTML = TRASH;
		clearBtn.setAttribute("title", "Clear history");

		const logContainer = logSection.createEl("div", { cls: "df-dr-log" });

		// ── Logic ─────────────────────────────────────────────────────────
		const diceQueue: string[] = [];

		const updateLog = () => {
			logContainer.empty();
			[...diceLog].reverse().forEach(line => {
				const row = logContainer.createEl("div", { cls: "df-dr-log-row" });
				const [expr, rest] = line.split(" -> ");
				row.createEl("span", { cls: "df-dr-log-expr", text: expr });
				if (rest) row.createEl("span", { cls: "df-dr-log-result", text: `→ ${rest}` });
			});
		};

		const updateQueue = () => {
			queueContainer.empty();
			if (diceQueue.length === 0) {
				queueContainer.createEl("span", { cls: "df-dr-queue-empty", text: "No dice added yet" });
				return;
			}
			diceQueue.forEach((expr, idx) => {
				const chip = queueContainer.createEl("div", { cls: "df-dr-queue-chip" });
				chip.createEl("span", { text: expr });
				const rm = chip.createEl("button", { cls: "df-dr-chip-remove" });
				rm.innerHTML = X_SM;
				rm.addEventListener("click", () => { diceQueue.splice(idx, 1); updateQueue(); });
			});
		};

		diceGrid.querySelectorAll(".df-dr-die-btn").forEach(btn => {
			btn.addEventListener("click", () => {
				const sides = Number((btn as HTMLElement).dataset.sides);
				const count = Number(countInput.value) || 1;
				diceQueue.push(`${count}d${sides}`);
				updateQueue();
			});
		});

		rollBtn.addEventListener("click", () => {
			if (diceQueue.length === 0) return;
			const expression = diceQueue.join(" + ");
			const result = rollDice(expression);
			const details = `[${result.parts.map(p => p.value).join(", ")}]`;
			diceLog.push(`${expression} -> ${details} = ${result.total}`);
			updateLog();
			diceQueue.length = 0;
			updateQueue();
		});

		clearBtn.addEventListener("click", () => { diceLog.length = 0; updateLog(); });

		updateLog();
		updateQueue();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** @deprecated use DiceRollerModal */
export function openDiceRoller(app: App): void {
	new DiceRollerModal(app).open();
}
