/**
 * Search Engine for DaggerForge Browsers
 * Handles filtering, sorting, and searching for cards
 */

export interface SearchFilters {
	query: string;
	tier: string | null;
	source: string | null;
	type: string | null;
}

export interface SearchableCard {
	name: string;
	tier?: string | number;
	type?: string;
	source?: string;
	desc?: string;
	[key: string]: any;
}

export class SearchEngine<T extends SearchableCard> {
	private cards: T[];
	private filters: SearchFilters = {
		query: "",
		tier: null,
		source: null,
		type: null,
	};

	constructor(cards: T[] = []) {
		this.cards = cards;
	}

	public setCards(cards: T[]): void {
		this.cards = cards;
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
		return this.cards.filter(card => this.matchesAllFilters(card));
	}

	private matchesAllFilters(card: T): boolean {
		return (
			this.matchesQuery(card) &&
			this.matchesTier(card) &&
			this.matchesSource(card) &&
			this.matchesType(card)
		);
	}

	private matchesQuery(card: T): boolean {
		if (!this.filters.query.trim()) return true;

		const query = this.filters.query.toLowerCase();
		const searchFields = [
			card.name,
			card.type,
			card.desc,
		].filter(Boolean);

		return searchFields.some((field: string) =>
			field.toLowerCase().includes(query)
		);
	}

	private matchesTier(card: T): boolean {
		if (this.filters.tier === null) return true;
		// Convert both to strings for comparison - tier can be string or number
		return String(card.tier) === String(this.filters.tier);
	}

	private matchesSource(card: T): boolean {
		if (!this.filters.source) return true;
		const cardSource = (card.source || "core").toLowerCase();
		return cardSource === this.filters.source.toLowerCase();
	}

	private matchesType(card: T): boolean {
		if (!this.filters.type) return true;
		const filterType = this.filters.type.toLowerCase();
		const cardType = (card.type || "").toLowerCase();
		const cardDisplayType = (card.displayType || "").toLowerCase();

		// Special case: "horde" filter matches both "horde" and "horde (hp/x)"
		if (filterType === "horde") {
			return cardType === "horde" || cardType.startsWith("horde (");
		}

		return cardType === filterType || cardDisplayType === filterType;
	}

	public getAvailableOptions(filterName: keyof SearchFilters): string[] {
		const options = new Set<string>();

		this.cards.forEach((card: T) => {
			if (filterName === "tier" && card.tier !== undefined) {
				options.add(String(card.tier));
			} else if (filterName === "source") {
				options.add(card.source || "core");
			} else if (filterName === "type") {
				if (card.type) {
					options.add(card.type);
				}
				if ((card as any).displayType) {
					options.add((card as any).displayType);
				}
			}
		});

		return Array.from(options)
			.filter((opt: string) => opt !== "")
			.sort();
	}
}
