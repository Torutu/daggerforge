import { rollDice } from "..";
import type DaggerForgePlugin from "../../../main";

let floatingWindowContainer: HTMLDivElement | null = null;
const diceLog: string[] = [];

export function openDiceRoller(plugin: DaggerForgePlugin) {
    // Cleanup previous instance
    if (floatingWindowContainer) {
        floatingWindowContainer.remove();
        floatingWindowContainer = null;
    }

    const container = document.createElement("div");
    floatingWindowContainer = container;
    container.classList.add("df-bg-floating-window");
    
    const header = container.createEl("div", { cls: "df-floating-header" });
    header.createEl("span", { text: "Dice roller" });
    const closeBtn = header.createEl("button", { text: "✖", cls: "df-close-btn" });

    const body = container.createEl("div", { cls: "df-dice-roll-body" });
    const logContainer = body.createEl("div", { cls: "df-log-container" });

    body.createEl("p", { text: "Roll count:", cls: "df-label" });
    const countInput = body.createEl("input", { cls: "df-roll-count" }) as HTMLInputElement;
    countInput.type = "number";
    countInput.min = "1";
    countInput.value = "1";

    body.createEl("p", { text: "Add dice to queue:", cls: "df-label" });
    
    const diceButtonsDiv = body.createEl("div", { cls: "df-dice-buttons" });
    const diceSides = ["4", "6", "8", "10", "12", "20", "100"];
    diceSides.forEach(sides => {
        const btn = diceButtonsDiv.createEl("button", {
            text: `d${sides}`,
            cls: "df-dice-btn"
        });
        btn.setAttribute("data-sides", sides);
    });

    const queueContainer = body.createEl("div", { cls: "df-dice-queue" });
    const rollBtn = body.createEl("button", { text: "Roll All", cls: "df-roll-btn" });
    const clearLogBtn = body.createEl("button", { text: "Clear Log", cls: "df-clear-log-btn" });

    document.body.appendChild(container);

    const diceQueue: string[] = [];

    /**************/
    /* Drag logic */
    /**************/
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const dragStyle = document.createElement("style");
    document.head.appendChild(dragStyle);

    header.addEventListener("mousedown", (e: MouseEvent) => {
        isDragging = true;
        header.classList.add("df-grab-cursor-active");
        container.classList.add("df-dragging");

        const rect = container.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

    });

    window.addEventListener("mousemove", (e: MouseEvent) => {
        if (!isDragging) return;

        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;

        container.classList.add("df-bg-floating-window");

        container.style.setProperty('--df-left', `${newLeft}px`);
        container.style.setProperty('--df-top', `${newTop}px`);
    });

    window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove("df-dragging");
        header.classList.remove("df-grab-cursor-active");
    });

    const onClose = () => {
        container.remove();
        floatingWindowContainer = null;
    };

    closeBtn.addEventListener("click", onClose);

    // --- Update log ---
    function updateLog() {
        logContainer.empty();
        diceLog.forEach(line => {
            logContainer.createEl("p", { text: line });
        });
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // --- Update queue display ---
    function updateQueue() {
        queueContainer.empty();
        diceQueue.forEach((expr, idx) => {
            const div = queueContainer.createEl("div");
            div.createEl("span", { text: expr + " " });
            const removeBtn = div.createEl("button", { text: "x" });
            removeBtn.addEventListener("click", () => {
                diceQueue.splice(idx, 1);
                updateQueue();
            });
        });
    }

    // --- Dice buttons ---
    container.querySelectorAll(".df-dice-btn").forEach(btn => {
        const onClick = () => {
            const sides = Number((btn as HTMLElement).dataset.sides);
            const count = Number(countInput.value) || 1;
            const diceExpr = `${count}d${sides}`;
            diceQueue.push(diceExpr);
            updateQueue();
        };
        btn.addEventListener("click", onClick);
    });

    // --- Roll button ---
    const onRoll = () => {
        if (diceQueue.length === 0) return;
        const expression = diceQueue.join(" + ");
        const result = rollDice(expression);
        diceLog.push(`${expression} -> ${result.details} = ${result.total}`);
        updateLog();
        diceQueue.length = 0;
        updateQueue();
    };
    rollBtn.addEventListener("click", onRoll);

    // --- Clear log button ---
    const onClearLog = () => {
        diceLog.length = 0;
        updateLog();
    };
    clearLogBtn.addEventListener("click", onClearLog);

    updateLog();
}
