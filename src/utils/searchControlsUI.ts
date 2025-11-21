/**
 * UI Factory for Search Controls
 * Creates consistent search UI elements for both adversary and environment browsers
 */

export interface SearchControlsConfig {
	placeholderText?: string;
	showTypeFilter?: boolean;
	onSearchChange?: (query: string) => void;
	onTierChange?: (tier: number | null) => void;
	onSourceChange?: (source: string | null) => void;
	onTypeChange?: (type: string | null) => void;
	onClear?: () => void;
	availableTiers?: number[];
	availableSources?: string[];
	availableTypes?: string[];
}

export class SearchControlsUI {
	private container: HTMLElement | null = null;
	private config: SearchControlsConfig;

	constructor(config: SearchControlsConfig = {}) {
		this.config = {
			placeholderText: "Search by name...",
			showTypeFilter: false,
			availableTiers: [1, 2, 3, 4],
			availableSources: [],
			availableTypes: [],
			...config,
		};
	}

	/**
	 * Create the entire search controls UI
	 */
	public create(parentContainer: HTMLElement): HTMLElement {
		this.container = parentContainer.createDiv({
			cls: "df-search-controls",
		});

		// Create main row with search box
		const searchRow = this.container.createDiv({
			cls: "df-search-row",
		});

		this.createSearchInput(searchRow);

		// Create filter row
		const filterRow = this.container.createDiv({
			cls: "df-filter-row",
		});

		this.createTierFilter(filterRow);
		this.createSourceFilter(filterRow);
		if (this.config.showTypeFilter) {
			this.createTypeFilter(filterRow);
		}

		this.createClearButton(filterRow);

		return this.container;
	}

	/**
	 * Create search input field
	 */
	private createSearchInput(container: HTMLElement): HTMLInputElement {
		const input = container.createEl("input", {
			attr: {
				type: "text",
				placeholder: this.config.placeholderText || "",
			},
			cls: "df-search-input",
		}) as HTMLInputElement;

		if (this.config.onSearchChange) {
			input.addEventListener("input", () => {
				this.config.onSearchChange?.(input.value);
			});
		}

		return input;
	}

	/**
	 * Create tier filter dropdown
	 */
	private createTierFilter(container: HTMLElement): HTMLSelectElement {
		const wrapper = container.createDiv({
			cls: "df-filter-wrapper",
		});

		wrapper.createEl("label", {
			// text: "Tier:",
			cls: "df-filter-label",
		});

		const select = wrapper.createEl("select", {
			cls: "df-tier-filter",
		}) as HTMLSelectElement;

		// All option
		const allOption = document.createElement("option");
		allOption.value = "";
		allOption.textContent = "All Tiers";
		select.appendChild(allOption);

		// Tier options
		if (this.config.availableTiers) {
			this.config.availableTiers.forEach((tier: number) => {
				const option = document.createElement("option");
				option.value = String(tier);
				option.textContent = `Tier ${tier}`;
				select.appendChild(option);
			});
		}

		if (this.config.onTierChange) {
			select.addEventListener("change", () => {
				const value = select.value ? parseInt(select.value, 10) : null;
				this.config.onTierChange?.(value);
			});
		}

		return select;
	}

	/**
	 * Create source/version filter dropdown
	 */
	private createSourceFilter(container: HTMLElement): HTMLSelectElement {
		const wrapper = container.createDiv({
			cls: "df-filter-wrapper",
		});

		wrapper.createEl("label", {
			// text: "Source:",
			cls: "df-filter-label",
		});

		const select = wrapper.createEl("select", {
			cls: "df-source-filter",
		}) as HTMLSelectElement;

		// All option
		const allOption = document.createElement("option");
		allOption.value = "";
		allOption.textContent = "All Sources";
		select.appendChild(allOption);

		// Source options
		if (this.config.availableSources && this.config.availableSources.length > 0) {
			this.config.availableSources.forEach((source: string) => {
				const option = document.createElement("option");
				option.value = source;
				const label = source.charAt(0).toUpperCase() + source.slice(1);
				option.textContent = label;
				select.appendChild(option);
			});
		}

		if (this.config.onSourceChange) {
			select.addEventListener("change", () => {
				const value = select.value || null;
				this.config.onSourceChange?.(value);
			});
		}

		return select;
	}

	/**
	 * Create type filter dropdown (optional)
	 */
	private createTypeFilter(container: HTMLElement): HTMLSelectElement {
		const wrapper = container.createDiv({
			cls: "df-filter-wrapper",
		});

		wrapper.createEl("label", {
			// text: "Type:",
			cls: "df-filter-label",
		});

		const select = wrapper.createEl("select", {
			cls: "df-type-filter",
		}) as HTMLSelectElement;

		// All option
		const allOption = document.createElement("option");
		allOption.value = "";
		allOption.textContent = "All Types";
		select.appendChild(allOption);

		// Type options
		if (this.config.availableTypes && this.config.availableTypes.length > 0) {
			this.config.availableTypes.forEach((type: string) => {
				const option = document.createElement("option");
				option.value = type;
				option.textContent = type;
				select.appendChild(option);
			});
		}

		if (this.config.onTypeChange) {
			select.addEventListener("change", () => {
				const value = select.value || null;
				this.config.onTypeChange?.(value);
			});
		}

		return select;
	}

	/**
	 * Create clear filters button
	 */
	private createClearButton(container: HTMLElement): HTMLButtonElement {
		const button = container.createEl("button", {
			text: "Clear",
			cls: "df-clear-filters-btn",
		}) as HTMLButtonElement;

		button.addEventListener("click", () => {
			// Reset all inputs
			const inputs = this.container?.querySelectorAll("input, select");
			inputs?.forEach((el: Element) => {
				if (el instanceof HTMLInputElement) {
					el.value = "";
				} else if (el instanceof HTMLSelectElement) {
					el.value = "";
				}
			});

			// Trigger change events
			this.config.onSearchChange?.("")
			this.config.onTierChange?.(null);
			this.config.onSourceChange?.(null);
			this.config.onTypeChange?.(null);
			// Trigger clear callback for counter reset
			this.config.onClear?.();
		});

		return button;
	}

	/**
	 * Update available options for filters
	 */
	public updateAvailableOptions(
		filterName: "tiers" | "sources" | "types",
		options: (string | number)[]
	): void {
		if (filterName === "tiers") {
			this.config.availableTiers = options as number[];
		} else if (filterName === "sources") {
			this.config.availableSources = options as string[];
		} else if (filterName === "types") {
			this.config.availableTypes = options as string[];
		}
	}
}
