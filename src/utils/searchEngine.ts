/**
 * Advanced Search Engine for DaggerForge Browsers
 * Handles filtering, sorting, and searching for items
 *
 * Type System:
 * - Adversaries: Solo, Minion, Horde, Boss, etc.
 * - Environments: Social, Traversal, Combat, Discovery, etc.
 *
 * Source System (versions/tags on cards):
 * - core: Base DaggerForge content
 * - void: Additional content (expansions)
 * - custom: User-created content
 */

export interface SearchFilters {
	query: string;
	tier: number | null;
	source: string | null;
	type: string | null;
}

export interface SearchableItem {
	name: string;
	tier?: number;
	type?: string;
	source?: string;
	desc?: string;
	[key: string]: any;
}

export class SearchEngine {
	private items: SearchableItem[] = [];
	private filters: SearchFilters = {
		query: "",
		tier: null,
		source: null,
		type: null,
	};

	constructor(items: SearchableItem[] = []) {
		this.items = items;
	}

	/**
	 * Set items to search through
	 */
	public setItems(items: SearchableItem[]): void {
		this.items = items;
	}

	/**
	 * Update search filters
	 */
	public setFilters(filters: Partial<SearchFilters>): void {
		this.filters = { ...this.filters, ...filters };
	}

	/**
	 * Get current filters
	 */
	public getFilters(): SearchFilters {
		return { ...this.filters };
	}

	/**
	 * Clear all filters
	 */
	public clearFilters(): void {
		this.filters = {
			query: "",
			tier: null,
			source: null,
			type: null,
		};
	}

	/**
	 * Perform search with current filters
	 */
	public search(): SearchableItem[] {
		return this.items.filter((item: SearchableItem) => this.matchesAllFilters(item));
	}

	/**
	 * Search with specific filters (doesn't modify internal state)
	 */
	public searchWith(filters: Partial<SearchFilters>): SearchableItem[] {
		const oldFilters = this.filters;
		this.filters = { ...this.filters, ...filters };
		const results = this.search();
		this.filters = oldFilters;
		return results;
	}

	/**
	 * Check if item matches all active filters
	 */
	private matchesAllFilters(item: SearchableItem): boolean {
		return (
			this.matchesQuery(item) &&
			this.matchesTier(item) &&
			this.matchesSource(item) &&
			this.matchesType(item)
		);
	}

	/**
	 * Text search in name, type, and description
	 */
	private matchesQuery(item: SearchableItem): boolean {
		if (!this.filters.query.trim()) return true;

		const query = this.filters.query.toLowerCase();
		const searchFields = [
			item.name,
			item.type,
			item.desc,
		].filter(Boolean);

		return searchFields.some((field: any) =>
			field.toLowerCase().includes(query)
		);
	}

	/**
	 * Filter by tier
	 */
	private matchesTier(item: SearchableItem): boolean {
		if (this.filters.tier === null) return true;
		return item.tier === this.filters.tier;
	}

	/**
	 * Filter by source/version
	 */
	private matchesSource(item: SearchableItem): boolean {
		if (!this.filters.source) return true;
		const itemSource = (item.source || "core").toLowerCase();
		return itemSource === this.filters.source.toLowerCase();
	}

	/**
	 * Filter by type (for adversaries: Bruiser, Solo, etc. or environments: Exploration, Combat, etc.)
	 */
	private matchesType(item: SearchableItem): boolean {
		if (!this.filters.type) return true;
		return (item.type || "").toLowerCase() === this.filters.type.toLowerCase();
	}

	/**
	 * Get available options for a filter
	 */
	public getAvailableOptions(filterName: keyof SearchFilters): string[] {
		const options = new Set<string>();

		this.items.forEach((item: SearchableItem) => {
			if (filterName === "tier" && item.tier !== undefined) {
				options.add(String(item.tier));
			} else if (filterName === "source") {
				options.add(item.source || "core");
			} else if (filterName === "type") {
				options.add(item.type || "");
			}
		});

		return Array.from(options)
			.filter((opt: string) => opt !== "")
			.sort();
	}

	/**
	 * Get count of results for current filters
	 */
	public getResultCount(): number {
		return this.search().length;
	}

	/**
	 * Get count of results for specific filters
	 */
	public getCountWith(filters: Partial<SearchFilters>): number {
		return this.searchWith(filters).length;
	}
}
