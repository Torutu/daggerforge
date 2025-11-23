let encounterWindowContainer: HTMLDivElement | null = null;

interface EncounterState {
    baseBP: number;
    adjustments: { value: number; reason: string }[];
    spentItems: { cost: number; label: string }[];
    pcCount: number;
}

let encounterState: EncounterState = {
    baseBP: 0,
    adjustments: [],
    spentItems: [],
    pcCount: 3
};

export function openEncounterCalculator() {

    if (encounterWindowContainer) {
        encounterWindowContainer.remove();
        encounterWindowContainer = null;
    }

    const container = document.createElement("div");
    encounterWindowContainer = container;
    container.classList.add("df-bg-floating-window");

    container.innerHTML = `
        <div class="df-floating-header">
            Battle guide
            <button id="df-encounter-close" class="df-close-btn">✖</button>
        </div>
        <div class="df-floating-body df-encounter-body">
            <!-- Player input -->
            <div class="df-encounter-inputs">
                <label>Number of PCs:</label>
                <input type="number" id="df-pc-count" min="1" value="${encounterState.pcCount}" />
                <button id="df-calc-base">Calculate Base BP</button>
            </div>

            <!-- Two columns -->
            <div class="df-encounter-columns">
                <!-- Left: Adjustments -->
                <div class="df-adjustments-column">
                    <div class="df-sticky-header">Adjusting Battle Points</div>
                    <div id="df-adjustments-list" class="df-scrollable-list"></div>
                    <p>Total Adjustments: <span id="df-adjustments-total">0</span></p>
                </div>

                <!-- Right: Spending -->
                <div class="df-spending-column">
                    <div class="df-sticky-header">Spending Battle Points</div>
                    <div id="df-spending-list" class="df-scrollable-list"></div>
                    <p>Remaining BP: <span id="df-remaining-bp">0</span></p>
                </div>
            </div>


            <!-- Adjustment Buttons -->
            <div class="df-encounter-buttons">
                <h5 class="df-bg-h5" >Adjust BP:</h5>
                    <div class="df-bg-button-container">
                    <button class="df-bg-button" data-adjust="-1">Less difficult/shorter (-1)</button>
                    <button class="df-bg-button" data-adjust="-2">2+ Solo adversaries (-2)</button>
                    <button class="df-bg-button" data-adjust="-2">+1d4 or +2 damage (-2)</button>
                    <button class="df-bg-button" data-adjust="+1">Lower tier adversary (+1)</button>
                    <button class="df-bg-button" data-adjust="+1">No Bruisers/Hordes/Leaders/Solos (+1)</button>
                    <button class="df-bg-button" data-adjust="+2">More dangerous/longer (+2)</button>
                    </div>
            </div>

            <!-- Spending Buttons -->
            <div class="df-encounter-buttons">
                <h5 class="df-bg-h5">Spend BP:</h5>
                    <div class="df-bg-button-container">
                    <button class="df-bg-button" data-cost="1">Minions (Party size) [-1]</button>
                    <button class="df-bg-button" data-cost="1">Social / Support [-1]</button>
                    <button class="df-bg-button" data-cost="2">Horde / Ranged / Skulk / Standard [-2]</button>
                    <button class="df-bg-button" data-cost="3">Leader [-3]</button>
                    <button class="df-bg-button" data-cost="4">Bruiser [-4]</button>
                    <button class="df-bg-button" data-cost="5">Solo [-5]</button>
                    </div>
            </div>

            <!-- Clear Log Button -->
            <div class="df-encounter-buttons">
                <button id="df-clear-encounter-log" class="df-clear-log-btn">Clear Log</button>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    container.querySelector("#df-encounter-close")!.addEventListener("click", () => {
        container.remove();
        encounterWindowContainer = null;
    });

    const header = container.querySelector(".df-floating-header") as HTMLElement;
    let isDragging = false, offsetX = 0, offsetY = 0;

    header.onmousedown = (e) => {
        isDragging = true;
        offsetX = e.clientX - container.offsetLeft;
        offsetY = e.clientY - container.offsetTop;
        header.style.cursor = "grabbing";
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        container.style.left = e.clientX - offsetX + "px";
        container.style.top = e.clientY - offsetY + "px";
        container.style.transform = "";
    };
    document.onmouseup = () => {
        isDragging = false;
        header.style.cursor = "grab";
    };

    // --- Elements ---
    const pcInput = container.querySelector("#df-pc-count") as HTMLInputElement;
    const adjustmentsList = container.querySelector("#df-adjustments-list")!;
    const adjustmentsTotal = container.querySelector("#df-adjustments-total")!;
    const spendingList = container.querySelector("#df-spending-list")!;
    const remainingBP = container.querySelector("#df-remaining-bp")!;
    const clearLogBtn = container.querySelector("#df-clear-encounter-log")!;

    // --- Helper functions ---
    function calculateTotals() {
        const totalAdj = encounterState.adjustments.reduce((sum, a) => sum + a.value, 0);
        const totalSpent = encounterState.spentItems.reduce((sum, item) => sum + item.cost, 0);
        return { totalAdj, totalSpent, remaining: encounterState.baseBP + totalAdj - totalSpent };
    }

    function updateDisplay() {
        adjustmentsList.innerHTML = "";
        encounterState.adjustments.forEach(adj => {
            const div = document.createElement("div");
            div.textContent = `${adj.reason} → ${adj.value > 0 ? "+" : ""}${adj.value}`;
            adjustmentsList.appendChild(div);
        });

        spendingList.innerHTML = "";
        encounterState.spentItems.forEach(item => {
            const div = document.createElement("div");
            div.textContent = `${item.label} → ${item.cost} BP`;
            spendingList.appendChild(div);
        });

        const { totalAdj, remaining } = calculateTotals();
        adjustmentsTotal.textContent = totalAdj.toString();
        remainingBP.textContent = remaining.toString();

        adjustmentsList.scrollTop = adjustmentsList.scrollHeight;
        spendingList.scrollTop = spendingList.scrollHeight;
    }

    container.querySelector("#df-calc-base")!.addEventListener("click", () => {
        encounterState.pcCount = Number(pcInput.value);
        encounterState.baseBP = 3 * encounterState.pcCount + 2;
        encounterState.adjustments = [];
        encounterState.spentItems = [];
        updateDisplay();
    });

    container.querySelectorAll("[data-adjust]").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = parseInt((btn as HTMLElement).dataset.adjust!);
            const reason = (btn as HTMLElement).textContent!;
            
            encounterState.adjustments.push({ value: val, reason });
            updateDisplay();
        });
    });

    container.querySelectorAll("[data-cost]").forEach(btn => {
        btn.addEventListener("click", () => {
            let cost = parseInt((btn as HTMLElement).dataset.cost!);
            let label = (btn as HTMLElement).textContent!;

            const { remaining } = calculateTotals();
            if (remaining >= cost) {
                encounterState.spentItems.push({ cost, label });
                updateDisplay();
            } else {
                alert("Not enough Battle Points!");
            }
        });
    });

    clearLogBtn.addEventListener("click", () => {
        encounterState = {
            baseBP: 0,
            adjustments: [],
            spentItems: [],
            pcCount: Number(pcInput.value)
        };
        updateDisplay();
    });

    pcInput.addEventListener("change", () => {
        encounterState.pcCount = Number(pcInput.value);
    });

    updateDisplay();
}
