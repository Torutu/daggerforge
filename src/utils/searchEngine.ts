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
	tier: string | null;
	source: string | null;
	type: string | null;
}

export interface SearchableItem {
	name: string;
	tier?: string | number;
	type?: string;
	source?: string;
	desc?: string;
	[key: string]: any;
}

// Just like C++ templates, T is a TypeScript generic
// this allows one class to be used with different types
export class SearchEngine<T extends SearchableItem = SearchableItem> {
	private items: T[] = [];
	private filters: SearchFilters = {
		query: "",
		tier: null,
		source: null,
		type: null,
	};

	constructor(items: T[] = []) {
		this.items = items;
	}

	public setItems(items: T[]): void {
		this.items = items;
	}

	public setFilters(filters: Partial<SearchFilters>): void {
		this.filters = { ...this.filters, ...filters };
	}

	public getFilters(): SearchFilters {
		return { ...this.filters };
	}

	public clearFilters(): void {
		this.filters = {
			query: "",
			tier: null,
			source: null,
			type: null,
		};
	}

	public search(): T[] {
		return this.items.filter((item: T) => this.matchesAllFilters(item));
	}

	private matchesAllFilters(item: T): boolean {
		return (
			this.matchesQuery(item) &&
			this.matchesTier(item) &&
			this.matchesSource(item) &&
			this.matchesType(item)
		);
	}

	private matchesQuery(item: T): boolean {
		if (!this.filters.query.trim()) return true;

		const query = this.filters.query.toLowerCase();
		const searchFields = [
			item.name,
			item.type,
			item.desc,
		].filter(Boolean);

		return searchFields.some((field: string) =>
			field.toLowerCase().includes(query)
		);
	}

	private matchesTier(item: T): boolean {
		if (this.filters.tier === null) return true;
		// Convert both to strings for comparison - tier can be string or number
		return String(item.tier) === String(this.filters.tier);
	}

	private matchesSource(item: T): boolean {
		if (!this.filters.source) return true;
		const itemSource = (item.source || "core").toLowerCase();
		return itemSource === this.filters.source.toLowerCase();
	}

	private matchesType(item: T): boolean {
		if (!this.filters.type) return true;
		const filterType = this.filters.type.toLowerCase();
		const itemType = (item.type || "").toLowerCase();
		const itemDisplayType = (item.displayType || "").toLowerCase();

		// Special case: "horde" filter matches both "horde" and "horde (hp/x)"
		if (filterType === "horde") {
			return itemType === "horde" || itemType.startsWith("horde (");
		}

		return itemType === filterType || itemDisplayType === filterType;
	}

	public getAvailableOptions(filterName: keyof SearchFilters): string[] {
		const options = new Set<string>();

		this.items.forEach((item: T) => {
			if (filterName === "tier" && item.tier !== undefined) {
				options.add(String(item.tier));
			} else if (filterName === "source") {
				options.add(item.source || "core");
			} else if (filterName === "type") {
				if (item.type) {
					options.add(item.type);
				}
				if ((item as any).displayType) {
					options.add((item as any).displayType);
				}
			}
		});

		return Array.from(options)
			.filter((opt: string) => opt !== "")
			.sort();
	}
}
