import { App, Modal, setIcon } from "obsidian";
import { rollDice } from "../index";
import { makeDraggable } from "../../utils/makeDraggable";
import { setIconLabel } from "../../utils/iconLabel";

const DICE_SIDES = ["4", "6", "8", "10", "12", "20", "100"];

const diceLog: string[] = [];

export class DiceRollerModal extends Modal {
	constructor(app: App) {
		super(app);
		this.titleEl.setText("Dice roller");
	}

	onOpen(): void {
		makeDraggable(this.modalEl, this.modalEl);
		this.modalEl.addClass("df-dr-modal");

		const { contentEl } = this;
		contentEl.addClass("df-dr-content");

		// ── Controls row ──────────────────────────────────────────────────
		const controls = contentEl.createDiv({ cls: "df-dr-controls" });

		const countGroup = controls.createDiv({ cls: "df-dr-count-group" });
		countGroup.createEl("label", { cls: "df-dr-label", text: "Count" });
		const countInput = countGroup.createEl("input", { cls: "df-dr-count-input" });
		countInput.type = "number";
		countInput.min = "1";
		countInput.max = "99";
		countInput.value = "1";

		const rollBtn = controls.createEl("button", { cls: "df-dr-roll-btn" });
		setIconLabel(rollBtn, "play", "Roll All");

		// ── Dice grid ─────────────────────────────────────────────────────
		const diceSection = contentEl.createDiv({ cls: "df-dr-section" });
		const diceSectionLabel = diceSection.createDiv({ cls: "df-dr-section-label" });
		setIconLabel(diceSectionLabel, "dice-5", "Select dice");

		const diceGrid = diceSection.createDiv({ cls: "df-dr-dice-grid" });
		DICE_SIDES.forEach(sides => {
			const btn = diceGrid.createEl("button", { cls: "df-dr-die-btn" });
			btn.setAttribute("data-sides", sides);
			btn.createSpan({ cls: "df-dr-die-label", text: `d${sides}` });
		});

		// ── Queue ─────────────────────────────────────────────────────────
		const queueSection = contentEl.createDiv({ cls: "df-dr-queue-section" });
		const queueHeader = queueSection.createDiv({ cls: "df-dr-queue-header" });
		queueHeader.createSpan({ cls: "df-dr-section-label-text", text: "Queue" });
		const queueContainer = queueSection.createDiv({ cls: "df-dr-queue" });

		// ── Log ───────────────────────────────────────────────────────────
		const logSection = contentEl.createDiv({ cls: "df-dr-log-section" });
		const logHeader = logSection.createDiv({ cls: "df-dr-log-header" });
		const logTitle = logHeader.createDiv({ cls: "df-dr-section-label" });
		setIconLabel(logTitle, "history", "Roll History");
		const clearBtn = logHeader.createEl("button", { cls: "df-dr-clear-btn" });
		setIcon(clearBtn, "trash");
		clearBtn.setAttribute("title", "Clear history");

		const logContainer = logSection.createDiv({ cls: "df-dr-log" });

		// ── Logic ─────────────────────────────────────────────────────────
		const diceQueue: string[] = [];

		const updateLog = () => {
			logContainer.empty();
			[...diceLog].reverse().forEach(line => {
				const row = logContainer.createDiv({ cls: "df-dr-log-row" });
				const [expr, rest] = line.split(" -> ");
				row.createSpan({ cls: "df-dr-log-expr", text: expr });
				if (rest) row.createSpan({ cls: "df-dr-log-result", text: `→ ${rest}` });
			});
		};

		const updateQueue = () => {
			queueContainer.empty();
			if (diceQueue.length === 0) {
				queueContainer.createSpan({ cls: "df-dr-queue-empty", text: "No dice added yet" });
				return;
			}
			diceQueue.forEach((expr, idx) => {
				const chip = queueContainer.createDiv({ cls: "df-dr-queue-chip" });
				chip.createSpan({ text: expr });
				const rm = chip.createEl("button", { cls: "df-dr-chip-remove" });
				setIcon(rm, "x");
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
