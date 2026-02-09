import { ItemView, WorkspaceLeaf, Notice, MarkdownView, setIcon } from "obsidian";
import { ADVERSARIES } from "../../../data/index";
import {
	getAdversaryCount,
	incrementAdversaryCount,
	decrementAdversaryCount,
	setAdversaryCount,
	resetAdversaryCount,
	isCanvasActive,
	createCanvasCard,
	getAvailableCanvasPosition,
	SearchEngine,
	SearchControlsUI
	} from "../../../utils/index";
import { buildCardHTML } from "../index";
import type { AdvData } from "../../../types/index";

export const Adv_View_Type = "daggerforge:adversary-view";

// AdvData keys are all strings (including tier). The browser needs tier as a
// number for sorting/filtering, and displayType to preserve the full type
// string (e.g. "Leader (Umbra-Touched)") while filtering on the base type.
interface Adversary extends AdvData {
	displayType?: string;
	isCustom?: boolean;
}

export class AdversaryView extends ItemView {
	private adversaries: Adversary[] = [];
	private lastActiveMarkdown: MarkdownView | null = null;
	private searchEngine: SearchEngine<Adversary> = new SearchEngine<Adversary>();
	private searchControlsUI: SearchControlsUI | null = null;
	private resultsDiv: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return Adv_View_Type;
	}

	getDisplayText(): string {
		return "Adversary Browser";
	}

	getIcon(): string {
		return "venetian-mask";
	}

	/**
	 * Delete a custom adversary by its unique ID
	 * @param adversary The adversary object to delete
	 */
	private async deleteCustomAdversary(adversary: Adversary): Promise<void> {
		try {
			const plugin = (this.app as any).plugins?.plugins?.['daggerforge'] as any;
			if (!plugin || !plugin.dataManager) {
				new Notice("DaggerForge plugin not found.");
				return;
			}

			const adversaryId = adversary.id;
			
			if (!adversaryId) {
				new Notice("Cannot delete adversary: missing ID.");
				return;
			}

			await plugin.dataManager.deleteAdversaryById(adversaryId);
			new Notice(`Deleted adversary: ${adversary.name}`);
			this.refresh();
		} catch (error) {
			console.error("Error deleting custom adversary:", error);
			new Notice("Failed to delete adversary.");
		}
	}

	async onOpen() {
		this.initializeView();
		this.registerEventListeners();
		this.loadAdversaryData();
	}

	public async refresh() {
		// Preserve current filters before refresh
		const currentFilters = this.searchEngine.getFilters();
		this.loadAdversaryData();
		// Restore filters and re-render results
		this.searchEngine.setFilters(currentFilters);
		this.renderResults(this.searchEngine.search());
	}

	private initializeView() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		container.createEl("h2", {
			text: "Adversary Browser",
			cls: "df-adv-title",
		});

		const counterContainer = container.createDiv({
			cls: "df-adversary-counter-container",
		});
		this.createCounterControls(counterContainer);

		this.searchControlsUI = new SearchControlsUI({
			placeholderText: "Search by name, type, or description...",
			showTypeFilter: true,
			availableTiers: ['1', '2', '3', '4'],
			availableSources: ["core", "sablewood", "umbra", "void", "custom"],
			availableTypes: ["Bruiser", "Horde",
				"Leader", "Minion", "Ranged", "Skulk", "Social", "Solo", "Standard", "Support",
				"Leader (Umbra-Touched)", "Minion (Umbra-Touched)", "Solo (Umbra-Touched)"],
			onSearchChange: (query) => this.handleSearchChange(query),
			onTierChange: (tier) => this.handleTierChange(tier),
			onSourceChange: (source) => this.handleSourceChange(source),
			onTypeChange: (type) => this.handleTypeChange(type),
			onClear: () => this.handleClearFilters(),
		});

		this.searchControlsUI.create(container);

		this.resultsDiv = container.createEl("div", {
			cls: "df-adversary-results",
		});
	}

	private registerEventListeners() {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView) {
					this.lastActiveMarkdown = view;
				}
			}),
		);
	}

	private loadCustomAdversaries(): Adversary[] {
		try {
			const plugin = (this.app as any).plugins?.plugins?.['daggerforge'] as any;
			if (!plugin || !plugin.dataManager) {
				console.warn("DaggerForge plugin or dataManager not found");
				return [];
			}

			const customAdvs: AdvData[] = plugin.dataManager.getAdversaries();
			return customAdvs.map((adv) => ({
				...adv as unknown as Adversary,
				isCustom: true,
				source: adv.source || "custom",
			}));
		} catch (error) {
			console.error("Error loading custom adversaries from DataManager:", error);
			return [];
		}
	}

	// TS doesn't allow direct cast from one type to another incompatible types without going through unknown
	private loadAdversaryData() {
		try {
			const builtIn = ADVERSARIES as unknown as Adversary[];
			const custom = this.loadCustomAdversaries();
			this.adversaries = [...builtIn, ...custom];

			this.searchEngine.setItems(this.adversaries);

			if (this.searchControlsUI) {
				const sources = this.searchEngine.getAvailableOptions("source");
				const types = this.searchEngine.getAvailableOptions("type");
				const tiers = this.searchEngine.getAvailableOptions("tier").map(t => parseInt(t, 10)).sort((a, b) => a - b);
				this.searchControlsUI.updateAvailableOptions("sources", sources);
				this.searchControlsUI.updateAvailableOptions("types", types);
				this.searchControlsUI.updateAvailableOptions("tiers", tiers);
			}

			this.renderResults(this.adversaries);
		} catch (e) {
			console.error("Error loading adversary data:", e);
			new Notice("Failed to load adversary data.");
			if (this.resultsDiv) {
				this.resultsDiv.setText("Error loading adversary data.");
			}
		}
	}

	private handleSearchChange(query: string) {
		this.searchEngine.setFilters({ query });
		this.renderResults(this.searchEngine.search());
	}

	private handleTierChange(tier: string | null) {
		this.searchEngine.setFilters({ tier });
		this.renderResults(this.searchEngine.search());
	}

	private handleSourceChange(source: string | null) {
		this.searchEngine.setFilters({ source });
		this.renderResults(this.searchEngine.search());
	}

	private handleTypeChange(type: string | null) {
		this.searchEngine.setFilters({ type });
		this.renderResults(this.searchEngine.search());
	}

	private handleClearFilters() {
		// Reset counter to 1 when clear button is clicked
		resetAdversaryCount();
		// Update the counter display
		const counterInputs = this.containerEl.querySelectorAll(".count-input");
		counterInputs.forEach((input) => {
			if (input instanceof HTMLInputElement) {
				input.value = "1";
			}
		});
	}

	private createCounterControls(container: HTMLElement): void {
		const minusBtn = container.createEl("button", {
			text: "-",
			cls: "df-adversary-counter-btn",
		});

		const counterInput = container.createEl("input", {
			attr: {
				type: "number",
				min: "1",
				value: getAdversaryCount().toString(),
				placeholder: "Count",
			},
			cls: "df-inline-input count-input",
		});

		const plusBtn = container.createEl("button", {
			text: "+",
			cls: "df-adversary-counter-btn",
		});

		minusBtn.onclick = () => {
			decrementAdversaryCount();
			counterInput.value = getAdversaryCount().toString();
		};

		plusBtn.onclick = () => {
			incrementAdversaryCount(1);
			counterInput.value = getAdversaryCount().toString();
		};

		// Select all text on focus to allow easy replacement
		counterInput.addEventListener("focus", () => {
			counterInput.select();
		});

		// Update counter in real-time as user types
		counterInput.addEventListener("input", () => {
			if (counterInput.value === "" || counterInput.value === "-") {
				return;
			}
			let value = parseInt(counterInput.value, 10);
			if (isNaN(value) || value < 1) {
				value = 1;
			}
			setAdversaryCount(value);
		});

		// Fallback for blur event to ensure final value is valid
		counterInput.addEventListener("blur", () => {
			let value = parseInt(counterInput.value, 10);
			if (isNaN(value) || value < 1) {
				value = 1;
			}
			counterInput.value = value.toString();
		});
	}

	private renderResults(adversaries: Adversary[]) {
		if (!this.resultsDiv) return;

		this.resultsDiv.empty();

		if (adversaries.length === 0) {
			this.resultsDiv.setText("No adversaries found.");
			return;
		}

		adversaries.forEach((adversary) => {
			const card = this.createAdversaryCard(adversary);
			this.resultsDiv!.appendChild(card);
		});
	}

	private createAdversaryCard(adversary: Adversary): HTMLElement {
		const card = document.createElement("div");
		card.classList.add("df-adversary-card");

		const source = adversary.source || "core";
		card.classList.add(`df-source-${source.toLowerCase()}`);

		const tier = document.createElement("p");
		tier.classList.add("df-tier-text");
		const typeDisplay = adversary.displayType || adversary.type;
		
		const sourceBadge = document.createElement("span");
		sourceBadge.classList.add(
			`df-source-badge-${source.toLowerCase()}`,
		);
		sourceBadge.textContent = `${source.toLowerCase()}`;
		
		tier.textContent = `Tier ${adversary.tier} ${typeDisplay} `;
		tier.appendChild(sourceBadge);

		card.appendChild(tier);
		if (source.toLowerCase() === "custom") {
			const deleteBtn = document.createElement("button");
			deleteBtn.classList.add("df-adv-delete-btn");
			setIcon(deleteBtn, "trash");
			deleteBtn.addEventListener("click", (e: MouseEvent) => {
				e.stopPropagation();
				this.deleteCustomAdversary(adversary);
			});
			card.appendChild(deleteBtn);
		}

		const title = document.createElement("h3");
		title.classList.add("df-title-small-padding");
		title.textContent = adversary.name || "Unnamed Adversary";
		card.appendChild(title);

		const desc = document.createElement("p");
		desc.classList.add("df-desc-small-padding");
		desc.textContent = adversary.desc || "No description available.";
		card.appendChild(desc);

		card.addEventListener("click", () =>
			this.insertAdversaryIntoNote(adversary),
		);

		return card;
	}

	private insertAdversaryIntoNote(adversary: Adversary) {
		const isCanvas = isCanvasActive(this.app);
		if (isCanvas) {
			const adversaryText = this.generateAdversaryMarkdown(adversary);
			const position = getAvailableCanvasPosition(this.app);
			
			createCanvasCard(this.app, adversaryText, {
				x: position.x,
				y: position.y,
				width: 400,
				height: 600
			});
			new Notice(`Inserted adversary ${adversary.name}.`);
			return;
		}

		const view =
			this.app.workspace.getActiveViewOfType(MarkdownView) ||
			this.lastActiveMarkdown;

		if (!view) {
			new Notice("No note or canvas is open. Click on a note to activate it.");
			return;
		}

		if (view.getMode() !== "source") {
			new Notice(
				"You must be in edit mode to insert the adversary card.",
			);
			return;
		}

		const editor = view.editor;
		if (!editor) {
			new Notice("Cannot find editor in markdown view.");
			return;
		}

		const adversaryText = this.generateAdversaryMarkdown(adversary);
		editor.replaceSelection(adversaryText);
		new Notice(`Inserted ${adversary.name}.`);
	}

	private generateAdversaryMarkdown(adversary: Adversary): string {
		const currentCount = getAdversaryCount();

		return buildCardHTML(
			{
				name: adversary.name,
				tier: adversary.tier,
				type: adversary.displayType || adversary.type,
				desc: adversary.desc,
				motives: adversary.motives,
				difficulty: adversary.difficulty,
				thresholdMajor: adversary.thresholdMajor,
				thresholdSevere: adversary.thresholdSevere,
				hp: adversary.hp,
				stress: adversary.stress ?? 0,
				atk: adversary.atk,
				weaponName: adversary.weaponName,
				weaponRange: adversary.weaponRange,
				weaponDamage: adversary.weaponDamage,
				xp: adversary.xp,
				count: String(currentCount),
				source: adversary.source || "core",
			},
			adversary.features.map(f => ({ ...f, cost: f.cost || "" })),
		);
	}
}
