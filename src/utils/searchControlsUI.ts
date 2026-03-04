/**
 * UI Factory for Search Controls
 *
 * Replaces single-select <select> dropdowns with multi-select checkbox panels.
 * Each filter button shows a label and a count badge of how many options are
 * selected. Clicking the button toggles an inline checkbox panel.
 *
 * WHY THE PANEL IS APPENDED TO document.body:
 * Obsidian's sidebar panes use overflow:hidden/auto on their scroll containers.
 * Any position:absolute child is clipped by that ancestor, making the panel
 * appear "behind" or invisible. By appending the panel to document.body and
 * positioning it with getBoundingClientRect() we escape all clipping contexts
 * entirely. This is the standard "portal" pattern for floating UI elements.
 *
 * Callbacks now receive string[] instead of string | null:
 *   - empty array  → no filter active (show all)
 *   - filled array → show cards matching ANY of the chosen values (OR logic)
 */

export interface SearchControlsConfig {
	placeholderText?: string;
	onSearchChange?: (query: string) => void;
	onTierChange?: (tiers: string[]) => void;
	onSourceChange?: (sources: string[]) => void;
	onTypeChange?: (types: string[]) => void;
	onClear?: () => void;
	availableTiers?: string[];
	availableSources?: string[];
	availableTypes?: string[];
	onWideCardChange?: (wide: boolean) => void;
}

/** Tracks currently selected values for each filter group. */
interface MultiSelectState {
	tiers: Set<string>;
	sources: Set<string>;
	types: Set<string>;
}

export class SearchControlsUI {
	private container: HTMLElement | null = null;
	private config: SearchControlsConfig;

	/**
	 * The currently open panel element (appended to document.body).
	 * Kept so we can close it when the user clicks elsewhere or opens another.
	 */
	private openPanel: HTMLElement | null = null;

	/** The toggle button that owns the currently open panel. */
	private openButton: HTMLButtonElement | null = null;

	/** Whether the next inserted card should use the wide layout. */
	private wideCard: boolean = false;

	private state: MultiSelectState = {
		tiers: new Set(),
		sources: new Set(),
		types: new Set(),
	};

	/**
	 * All panels created by this instance, keyed by stateKey.
	 * Stored so destroy() can remove them from document.body on cleanup.
	 */
	private panels: Map<keyof MultiSelectState, HTMLElement> = new Map();

	constructor(config: SearchControlsConfig = {}) {
		this.config = {
			placeholderText: "Search by name...",
			availableTiers: [],
			availableSources: [],
			availableTypes: [],
			...config,
		};
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	public create(parentContainer: HTMLElement): HTMLElement {
		this.container = parentContainer.createDiv({ cls: "df-search-controls" });

		const searchRow = this.container.createDiv({ cls: "df-search-row" });
		this.createSearchInput(searchRow);

		const filterRow = this.container.createDiv({ cls: "df-filter-row" });

		this.createMultiSelectFilter(filterRow, {
			label: "Tier",
			options: this.config.availableTiers ?? [],
			formatOption: (v) => `Tier ${v}`,
			stateKey: "tiers",
			onChange: (values) => this.config.onTierChange?.(values),
		});

		this.createMultiSelectFilter(filterRow, {
			label: "Source",
			options: this.config.availableSources ?? [],
			formatOption: (v) => this.capitalize(v),
			stateKey: "sources",
			onChange: (values) => this.config.onSourceChange?.(values),
		});

		this.createMultiSelectFilter(filterRow, {
			label: "Type",
			options: this.config.availableTypes ?? [],
			formatOption: (v) => v,
			stateKey: "types",
			onChange: (values) => this.config.onTypeChange?.(values),
		});

		this.createClearButton(filterRow);
		this.createWideCardToggle(filterRow);

		// Close the open panel on any click outside it
		document.addEventListener("click", this.handleOutsideClick);

		// Close the panel on any scroll anywhere in the page (capture phase
		// catches scroll events on all elements, not just window).
		// Closing on scroll feels more natural than trying to chase the button.
		window.addEventListener("scroll", this.handleScrollClose, true);

		// Reposition on resize only (window size change shifts button position)
		window.addEventListener("resize", this.handleScrollOrResize);

		return this.container;
	}

	/**
	 * Sync UI checkboxes to match provided filter values.
	 * Accepts either the old string | null shape or the new string[] shape.
	 */
	public setFilterValues(filters: {
		query?: string;
		tiers?: string[];
		sources?: string[];
		types?: string[];
		// Legacy single-value shape — still accepted, converted internally
		tier?: string | null;
		source?: string | null;
		type?: string | null;
	}): void {
		if (!this.container) return;

		if (filters.query !== undefined) {
			const searchInput = this.container.querySelector(".df-search-input") as HTMLInputElement | null;
			if (searchInput) searchInput.value = filters.query;
		}

		const tiersToSet = filters.tiers ?? (filters.tier ? [filters.tier] : []);
		const sourcesToSet = filters.sources ?? (filters.source ? [filters.source] : []);
		const typesToSet = filters.types ?? (filters.type ? [filters.type] : []);

		this.syncCheckboxState("tiers", tiersToSet);
		this.syncCheckboxState("sources", sourcesToSet);
		this.syncCheckboxState("types", typesToSet);
	}

	/** Returns whether the wide card mode is currently active. */
	public getWideCard(): boolean {
		return this.wideCard;
	}

	public updateAvailableOptions(
		filterName: "tiers" | "sources" | "types",
		options: string[]
	): void {
		if (filterName === "tiers") this.config.availableTiers = options;
		else if (filterName === "sources") this.config.availableSources = options;
		else if (filterName === "types") this.config.availableTypes = options;
	}

	/**
	 * Remove all event listeners and detach body-level panels from the DOM.
	 * Call this in the view's onClose() to prevent memory/listener leaks.
	 */
	public destroy(): void {
		document.removeEventListener("click", this.handleOutsideClick);
		window.removeEventListener("scroll", this.handleScrollClose, true);
		window.removeEventListener("resize", this.handleScrollOrResize);

		// Remove every panel we appended to document.body
		this.panels.forEach((panel) => {
			if (panel.parentElement) panel.parentElement.removeChild(panel);
		});
		this.panels.clear();
		this.openPanel = null;
		this.openButton = null;
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private createSearchInput(container: HTMLElement): void {
		const input = container.createEl("input", {
			attr: { type: "text", placeholder: this.config.placeholderText ?? "" },
			cls: "df-search-input",
		}) as HTMLInputElement;

		input.addEventListener("input", () => {
			this.config.onSearchChange?.(input.value);
		});
	}

	/**
	 * Build one multi-select filter group.
	 *
	 * The toggle button lives in the normal DOM flow (inside the filter row).
	 * The checkbox panel is appended to document.body so it is never clipped
	 * by Obsidian's overflow:hidden sidebar containers.
	 */
	private createMultiSelectFilter(
		container: HTMLElement,
		opts: {
			label: string;
			options: string[];
			formatOption: (v: string) => string;
			stateKey: keyof MultiSelectState;
			onChange: (values: string[]) => void;
		}
	): void {
		// Wrapper stays in the filter row — only used for layout of the button
		const wrapper = container.createDiv({ cls: "df-multiselect-wrapper" });
		wrapper.dataset.filterKey = opts.stateKey;

		const button = wrapper.createEl("button", {
			cls: "df-multiselect-toggle",
			attr: { "aria-haspopup": "listbox", "aria-expanded": "false" },
		}) as HTMLButtonElement;

		button.createSpan({ cls: "df-multiselect-label", text: opts.label });
		const badge = button.createSpan({ cls: "df-multiselect-badge df-multiselect-badge--hidden" });

		// Panel is created outside the normal DOM tree (body-level portal)
		const panel = document.createElement("div");
		panel.className = "df-multiselect-panel df-multiselect-panel--hidden";
		panel.dataset.filterKey = opts.stateKey;

		if (opts.options.length === 0) {
			const empty = document.createElement("span");
			empty.className = "df-multiselect-empty";
			empty.textContent = "No options";
			panel.appendChild(empty);
		}

		opts.options.forEach((value) => {
			const item = document.createElement("div");
			item.className = "df-multiselect-item";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.value = value;
			checkbox.className = "df-multiselect-checkbox";

			const label = document.createElement("label");
			label.textContent = opts.formatOption(value);
			label.className = "df-multiselect-item-label";

			item.appendChild(checkbox);
			item.appendChild(label);
			panel.appendChild(item);

			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.state[opts.stateKey].add(value);
				} else {
					this.state[opts.stateKey].delete(value);
				}
				this.updateBadge(badge, this.state[opts.stateKey].size);
				opts.onChange(Array.from(this.state[opts.stateKey]));
			});

			// Clicking the item row (not just the checkbox) should toggle it
			item.addEventListener("click", (e) => {
				if (e.target === checkbox) return; // checkbox handles its own click
				checkbox.checked = !checkbox.checked;
				checkbox.dispatchEvent(new Event("change"));
			});
		});

		// Append the panel to body so it escapes all overflow clipping
		document.body.appendChild(panel);
		this.panels.set(opts.stateKey, panel);

		button.addEventListener("click", (e) => {
			e.stopPropagation();

			const isOpen = !panel.classList.contains("df-multiselect-panel--hidden");

			// Close any other open panel first
			if (this.openPanel && this.openPanel !== panel) {
				this.closePanel(this.openPanel, this.openButton);
			}

			if (isOpen) {
				this.closePanel(panel, button);
			} else {
				this.openPanelAt(panel, button);
			}
		});

		// Stop clicks inside the panel from bubbling to the outside-click handler
		panel.addEventListener("click", (e) => e.stopPropagation());
	}

	/**
	 * Position and show a panel directly below its toggle button.
	 * Uses viewport coordinates so overflow:hidden ancestors don't matter.
	 */
	private openPanelAt(panel: HTMLElement, button: HTMLButtonElement): void {
		const rect = button.getBoundingClientRect();

		panel.style.position = "fixed";
		panel.style.top = `${rect.bottom + 4}px`;
		panel.style.left = `${rect.left}px`;
		panel.style.minWidth = `${Math.max(rect.width, 160)}px`;

		panel.classList.remove("df-multiselect-panel--hidden");
		button.setAttribute("aria-expanded", "true");

		this.openPanel = panel;
		this.openButton = button;
	}

	private closePanel(panel: HTMLElement, button: HTMLButtonElement | null): void {
		panel.classList.add("df-multiselect-panel--hidden");
		button?.setAttribute("aria-expanded", "false");

		if (this.openPanel === panel) {
			this.openPanel = null;
			this.openButton = null;
		}
	}

	/**
	 * A small checkbox labeled "Wide card" that sits in the filter row.
	 * When checked, the next inserted card gets the df-card--wide class,
	 * which removes the max-width cap on the outer section.
	 */
	private createWideCardToggle(container: HTMLElement): void {
		const wrapper = container.createDiv({ cls: "df-wide-card-wrapper" });

		const checkbox = wrapper.createEl("input", {
			attr: { type: "checkbox", id: "df-wide-card-checkbox" },
			cls: "df-wide-card-checkbox",
		}) as HTMLInputElement;

		wrapper.createEl("label", {
			text: "Wide",
			attr: { for: "df-wide-card-checkbox" },
			cls: "df-wide-card-label",
		});

		checkbox.addEventListener("change", () => {
			this.wideCard = checkbox.checked;
			this.config.onWideCardChange?.(this.wideCard);
		});
	}

	private createClearButton(container: HTMLElement): void {
		const button = container.createEl("button", {
			text: "Clear",
			cls: "df-clear-filters-btn",
		}) as HTMLButtonElement;

		button.addEventListener("click", () => {
			const searchInput = this.container?.querySelector(".df-search-input") as HTMLInputElement | null;
			if (searchInput) searchInput.value = "";

			// Uncheck all checkboxes in all body-level panels
			this.panels.forEach((panel) => {
				panel.querySelectorAll(".df-multiselect-checkbox").forEach((el) => {
					if (el instanceof HTMLInputElement) el.checked = false;
				});
			});

			this.state.tiers.clear();
			this.state.sources.clear();
			this.state.types.clear();

			this.container?.querySelectorAll(".df-multiselect-badge").forEach((el) => {
				if (el instanceof HTMLElement) this.updateBadge(el, 0);
			});

			this.config.onSearchChange?.("");
			this.config.onTierChange?.([]);
			this.config.onSourceChange?.([]);
			this.config.onTypeChange?.([]);
			this.config.onClear?.();
		});
	}

	private updateBadge(badge: HTMLElement, count: number): void {
		if (count === 0) {
			badge.textContent = "";
			badge.classList.add("df-multiselect-badge--hidden");
		} else {
			badge.textContent = String(count);
			badge.classList.remove("df-multiselect-badge--hidden");
		}
	}

	private syncCheckboxState(stateKey: keyof MultiSelectState, values: string[]): void {
		this.state[stateKey].clear();
		values.forEach(v => this.state[stateKey].add(v));

		// The panel is body-level, so look it up by the stateKey data attribute
		const panel = this.panels.get(stateKey);
		if (!panel) return;

		panel.querySelectorAll(".df-multiselect-checkbox").forEach((el) => {
			if (el instanceof HTMLInputElement) {
				el.checked = this.state[stateKey].has(el.value);
			}
		});

		// Update the badge in the inline toggle button
		const wrapperEl = this.container?.querySelector(`[data-filter-key="${stateKey}"]`);
		const badge = wrapperEl?.querySelector(".df-multiselect-badge");
		if (badge instanceof HTMLElement) {
			this.updateBadge(badge, this.state[stateKey].size);
		}
	}

	private capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	/** Close the open panel when clicking anywhere outside it. */
	private handleOutsideClick = (): void => {
		if (this.openPanel) {
			this.closePanel(this.openPanel, this.openButton);
		}
	};

	/**
	 * Close the open panel when the user scrolls the sidebar browser,
	 * but NOT when they scroll inside the panel itself to reach more options.
	 */
	private handleScrollClose = (e: Event): void => {
		if (!this.openPanel) return;
		// If the scroll happened inside the open panel, let it scroll normally
		if (this.openPanel.contains(e.target as Node)) return;
		this.closePanel(this.openPanel, this.openButton);
	};

	/** Reposition on window resize only (layout shift, not user scroll). */
	private handleScrollOrResize = (): void => {
		if (this.openPanel && this.openButton) {
			const rect = this.openButton.getBoundingClientRect();
			this.openPanel.style.top = `${rect.bottom + 4}px`;
			this.openPanel.style.left = `${rect.left}px`;
		}
	};
}
