import { rollDice } from "./dice";

let floatingWindowContainer: HTMLDivElement | null = null;
const diceLog: string[] = [];

export function openDiceRoller() {
    if (floatingWindowContainer) {
        floatingWindowContainer.remove();
        floatingWindowContainer = null;
    }

    const container = document.createElement("div");
    floatingWindowContainer = container;
    container.classList.add("df-floating-window");
    container.innerHTML = `
        <div class="df-floating-header">
            Dice roller
            <button id="df-close-btn" class="df-close-btn">✖</button>
        </div>
        <div class="df-dice-roll-body">
            <div id="df-log-container" class="df-log-container"></div>

            <p class="df-label">Roll count:</p>
            <input type="number" min="1" value="1" id="df-roll-count" class="df-roll-count" />

            <p class="df-label">Add dice to queue:</p>
            <div class="df-dice-buttons">
                <button class="df-dice-btn" data-sides="4">d4</button>
                <button class="df-dice-btn" data-sides="6">d6</button>
                <button class="df-dice-btn" data-sides="8">d8</button>
                <button class="df-dice-btn" data-sides="10">d10</button>
                <button class="df-dice-btn" data-sides="12">d12</button>
                <button class="df-dice-btn" data-sides="20">d20</button>
                <button class="df-dice-btn" data-sides="100">d100</button>
            </div>

            <div id="df-dice-queue" class="df-dice-queue"></div>
            <button id="df-roll-btn" class="df-roll-btn">Roll All</button>
            <button id="df-clear-log-btn" class="df-clear-log-btn">Clear Log</button>
        </div>
    `;

    document.body.appendChild(container);

    const logContainer = container.querySelector("#df-log-container") as HTMLDivElement;
    const queueContainer = container.querySelector("#df-dice-queue") as HTMLDivElement;
    const countInput = container.querySelector("#df-roll-count") as HTMLInputElement;
    const rollBtn = container.querySelector("#df-roll-btn") as HTMLButtonElement;
    const clearLogBtn = container.querySelector("#df-clear-log-btn") as HTMLButtonElement;
    const closeBtn = container.querySelector("#df-close-btn") as HTMLButtonElement;

    const diceQueue: string[] = [];

    // --- Drag logic ---
    let offsetX = 0, offsetY = 0, isDragging = false;
    const header = container.querySelector(".df-floating-header") as HTMLElement;
    header.onmousedown = (e) => {
        isDragging = true;
        container.style.transform = "none";
        offsetX = e.clientX - container.offsetLeft;
        offsetY = e.clientY - container.offsetTop;
        header.style.cursor = "grabbing";
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        container.style.left = e.clientX - offsetX + "px";
        container.style.top = e.clientY - offsetY + "px";
        container.style.transform = "translate(0, 0)";
    };
    document.onmouseup = () => {
        isDragging = false;
        header.style.cursor = "grab";
    };

    closeBtn.addEventListener("click", () => {
        container.remove();
        floatingWindowContainer = null;
    });

    // --- Update log ---
    function updateLog() {
        logContainer.innerHTML = "";
        diceLog.forEach(line => {
            const p = document.createElement("p");
            p.textContent = line;
            logContainer.appendChild(p);
        });
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // --- Update queue display ---
    function updateQueue() {
        queueContainer.innerHTML = "";
        diceQueue.forEach((expr, idx) => {
            const div = document.createElement("div");
            div.textContent = expr + " ";
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "x";
            removeBtn.onclick = () => {
                diceQueue.splice(idx, 1);
                updateQueue();
            };
            div.appendChild(removeBtn);
            queueContainer.appendChild(div);
        });
    }

    // --- Dice buttons ---
    container.querySelectorAll(".df-dice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const sides = Number((btn as HTMLElement).dataset.sides);
            const count = Number(countInput.value) || 1;
            const diceExpr = `${count}d${sides}`;
            diceQueue.push(diceExpr);
            updateQueue();
        });
    });

    // --- Roll button ---
    rollBtn.addEventListener("click", () => {
        if (diceQueue.length === 0) return;
        const expression = diceQueue.join(" + ");
        const result = rollDice(expression);
        diceLog.push(`${expression} -> ${result.details} = ${result.total}`);
        updateLog();
        diceQueue.length = 0;
        updateQueue();
    });

    // --- Clear log button ---
    clearLogBtn.addEventListener("click", () => {
        diceLog.length = 0;
        updateLog();
    });

    updateLog();
}
