let encounterWindowContainer: HTMLDivElement | null = null;
let cleanupListeners: (() => void)[] = [];

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
        cleanupListeners.forEach(cleanup => cleanup());
        cleanupListeners = [];
    }

    const container = document.createElement("div");
    encounterWindowContainer = container;
    container.classList.add("df-bg-floating-window");

    const header = container.createEl("div", { cls: "df-floating-header" });
    header.createEl("span", { text: "Battle guide" });
    const closeBtn = header.createEl("button", { text: "✖", cls: "df-close-btn" });
    const body = container.createEl("div", { cls: "df-floating-body df-encounter-body" });

    /************************/
    /* Player input section */
    /************************/
    const inputsDiv = body.createEl("div", { cls: "df-encounter-inputs" });
    inputsDiv.createEl("label", { text: "Number of PCs:" });
    const pcInput = inputsDiv.createEl("input") as HTMLInputElement;
    pcInput.type = "number";
    pcInput.min = "1";
    pcInput.value = encounterState.pcCount.toString();
    const calcBtn = inputsDiv.createEl("button", { text: "Calculate base BP" });
    const columnsDiv = body.createEl("div", { cls: "df-encounter-columns" });

    /**************************/
    /* Left side: Adjustments */
    /**************************/
    const adjColumn = columnsDiv.createEl("div", { cls: "df-adjustments-column" });
    adjColumn.createEl("div", { text: "Adjusting Battle Points", cls: "df-sticky-header" });
    const adjustmentsList = adjColumn.createEl("div", { cls: "df-scrollable-list" });
    const adjTotal = adjColumn.createEl("p");
    adjTotal.createEl("span", { text: "Total Adjustments: " });
    adjTotal.createEl("span", { text: "0" });

    /************************/
    /* Right side: Spending */
    /************************/
    const spendColumn = columnsDiv.createEl("div", { cls: "df-spending-column" });
    spendColumn.createEl("div", { text: "Spending Battle Points", cls: "df-sticky-header" });
    const spendingList = spendColumn.createEl("div", { cls: "df-scrollable-list" });
    const remainingBP = spendColumn.createEl("p");
    remainingBP.createEl("span", { text: "Remaining BP: " });
    remainingBP.createEl("span", { text: "0" });

    /********************/
    /*Adjustment buttons*/
    /********************/
    const adjButtonsDiv = body.createEl("div", { cls: "df-encounter-buttons" });
    adjButtonsDiv.createEl("h5", { text: "Adjust BP:", cls: "df-bg-h5" });
    const adjBtnContainer = adjButtonsDiv.createEl("div", { cls: "df-bg-button-container" });
    
    const adjustments = [
        { value: -1, label: "Less difficult/shorter (-1)" },
        { value: -2, label: "2+ Solo adversaries (-2)" },
        { value: -2, label: "+1d4 or +2 damage (-2)" },
        { value: 1, label: "Lower tier adversary (+1)" },
        { value: 1, label: "No Bruisers/Hordes/Leaders/Solos (+1)" },
        { value: 2, label: "More dangerous/longer (+2)" },
    ];
    
    adjustments.forEach(adj => {
        const btn = adjBtnContainer.createEl("button", { text: adj.label, cls: "df-bg-button" });
        btn.setAttribute("data-adjust", adj.value.toString());
    });

    /********************/
    /* Spending buttons */
    /********************/
    const spendButtonsDiv = body.createEl("div", { cls: "df-encounter-buttons" });
    spendButtonsDiv.createEl("h5", { text: "Spend BP:", cls: "df-bg-h5" });
    const spendBtnContainer = spendButtonsDiv.createEl("div", { cls: "df-bg-button-container" });
    
    const spendOptions = [
        { cost: 1, label: "Minions (Party size) [-1]" },
        { cost: 1, label: "Social / Support [-1]" },
        { cost: 2, label: "Horde / Ranged / Skulk / Standard [-2]" },
        { cost: 3, label: "Leader [-3]" },
        { cost: 4, label: "Bruiser [-4]" },
        { cost: 5, label: "Solo [-5]" },
    ];
    
    spendOptions.forEach(opt => {
        const btn = spendBtnContainer.createEl("button", { text: opt.label, cls: "df-bg-button" });
        btn.setAttribute("data-cost", opt.cost.toString());
    });

    /********************/
    /* Clear log button */
    /********************/
    const clearDiv = body.createEl("div", { cls: "df-encounter-buttons" });
    const clearLogBtn = clearDiv.createEl("button", { text: "Clear Log", cls: "df-clear-log-btn" });

    document.body.appendChild(container);

    /*****************/
    /* Close handler */
    /*****************/
    const onClose = () => {
        container.remove();
        encounterWindowContainer = null;
        cleanupListeners.forEach(cleanup => cleanup());
        cleanupListeners = [];
    };
    closeBtn.addEventListener("click", onClose);
    cleanupListeners.push(() => closeBtn.removeEventListener("click", onClose));

    /**************/
    /* Drag logic */
    /**************/
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Create a <style> tag to hold dynamic positions
    const dragStyle = document.createElement("style");
    document.head.appendChild(dragStyle);

    header.addEventListener("mousedown", (e: MouseEvent) => {
        isDragging = true;
        container.classList.add("df-dragging");
        header.classList.add("df-grab-cursor-active");

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


    /********************/
    /* Helper functions */
    /********************/
    function calculateTotals() {
        const totalAdj = encounterState.adjustments.reduce((sum, a) => sum + a.value, 0);
        const totalSpent = encounterState.spentItems.reduce((sum, item) => sum + item.cost, 0);
        return { totalAdj, totalSpent, remaining: encounterState.baseBP + totalAdj - totalSpent };
    }

    function updateDisplay() {
        adjustmentsList.empty();
        encounterState.adjustments.forEach(adj => {
            adjustmentsList.createEl("div", { text: `${adj.reason} → ${adj.value > 0 ? "+" : ""}${adj.value}` });
        });

        spendingList.empty();
        encounterState.spentItems.forEach(item => {
            spendingList.createEl("div", { text: `${item.label} → ${item.cost} BP` });
        });

        const { totalAdj, remaining } = calculateTotals();
        const adjTotalSpan = adjTotal.querySelector("span:last-child");
        if (adjTotalSpan) adjTotalSpan.textContent = totalAdj.toString();
        
        const remainingSpan = remainingBP.querySelector("span:last-child");
        if (remainingSpan) remainingSpan.textContent = remaining.toString();

        adjustmentsList.scrollTop = adjustmentsList.scrollHeight;
        spendingList.scrollTop = spendingList.scrollHeight;
    }

    const onCalcBase = () => {
        encounterState.pcCount = Number(pcInput.value);
        encounterState.baseBP = 3 * encounterState.pcCount + 2;
        encounterState.adjustments = [];
        encounterState.spentItems = [];
        updateDisplay();
    };
    calcBtn.addEventListener("click", onCalcBase);

    /**********************/
    /* Adjustment buttons */
    /**********************/
    container.querySelectorAll("[data-adjust]").forEach(btn => {
        const onClick = () => {
            const val = parseInt((btn as HTMLElement).dataset.adjust!);
            const reason = (btn as HTMLElement).textContent!;
            encounterState.adjustments.push({ value: val, reason });
            updateDisplay();
        };
        btn.addEventListener("click", onClick);
    });

    /********************/
    /* Spending buttons */
    /********************/
    container.querySelectorAll("[data-cost]").forEach(btn => {
        const onClick = () => {
            const cost = parseInt((btn as HTMLElement).dataset.cost!);
            const label = (btn as HTMLElement).textContent!;

            const { remaining } = calculateTotals();
            if (remaining >= cost) {
                encounterState.spentItems.push({ cost, label });
                updateDisplay();
            } else {
                alert("Not enough Battle Points!");
            }
        };
        btn.addEventListener("click", onClick);
    });

    const onClearLog = () => {
        encounterState = {
            baseBP: 0,
            adjustments: [],
            spentItems: [],
            pcCount: Number(pcInput.value)
        };
        updateDisplay();
    };
    clearLogBtn.addEventListener("click", onClearLog);

    const onPcChange = () => {
        encounterState.pcCount = Number(pcInput.value);
    };
    pcInput.addEventListener("change", onPcChange);

    updateDisplay();
}
