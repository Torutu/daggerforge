/**
 * Search Engine for DaggerForge Browsers
 * Handles fuzzy text search, multi-select dropdown filtering, and relevance-ranked results.
 *
 * Filters for tier, source, and type are now string arrays.
 * An empty array means "no filter" (show all). A non-empty array means
 * "show cards that match ANY of the selected values" (OR logic).
 */

export interface SearchFilters {
	query: string;
	tiers: string[];   // empty = all
	sources: string[]; // empty = all
	types: string[];   // empty = all
}

export interface SearchableCard {
	name: string;
	tier?: string | number;
	type?: string;
	source?: string;
	desc?: string;
	[key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Fuzzy scorer
// ---------------------------------------------------------------------------

/**
 * Score how well `query` matches `text` using character-sequence matching.
 * Returns 0 when the query is not a subsequence of the text (no match).
 */
function fuzzyScore(text: string, query: string): number {
	const t = text.toLowerCase();
	const q = query.toLowerCase();

	let score = 0;
	let textIndex = 0;
	let queryIndex = 0;
	let consecutiveBonus = 0;
	let firstMatchIndex = -1;

	while (textIndex < t.length && queryIndex < q.length) {
		if (t[textIndex] === q[queryIndex]) {
			if (firstMatchIndex === -1) firstMatchIndex = textIndex;

			consecutiveBonus = queryIndex > 0 && t[textIndex - 1] === q[queryIndex - 1]
				? consecutiveBonus + 1
				: 0;

			score += 1 + consecutiveBonus;
			queryIndex++;
		}
		textIndex++;
	}

	if (queryIndex < q.length) return 0;

	const startPenalty = firstMatchIndex === -1 ? 0 : firstMatchIndex * 0.1;
	return Math.max(0, score - startPenalty);
}

/**
 * Return the best fuzzy score across a set of fields.
 * Name is weighted 2× because it is the primary identifier.
 */
function bestFieldScore(card: SearchableCard, query: string): number {
	const nameScore = fuzzyScore(card.name ?? "", query) * 2;
	const typeScore = fuzzyScore(String(card.type ?? ""), query);
	const descScore = fuzzyScore(String(card.desc ?? ""), query);
	return Math.max(nameScore, typeScore, descScore);
}

// ---------------------------------------------------------------------------
// Search Engine
// ---------------------------------------------------------------------------

export class SearchEngine<T extends SearchableCard> {
	private cards: T[] = [];
	private filters: SearchFilters = {
		query: "",
		tiers: [],
		sources: [],
		types: [],
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
		this.filters = { query: "", tiers: [], sources: [], types: [] };
	}

	/**
	 * Return cards that pass all filters, ordered by fuzzy relevance
	 * when a text query is active, or in original order otherwise.
	 */
	public search(): T[] {
		const query = this.filters.query.trim();

		const filtered = this.cards.filter(card =>
			this.matchesTier(card) &&
			this.matchesSource(card) &&
			this.matchesType(card)
		);

		if (!query) return filtered;

		const scored = filtered
			.map(card => ({ card, score: bestFieldScore(card, query) }))
			.filter(entry => entry.score > 0);

		scored.sort((a, b) => b.score - a.score);

		return scored.map(entry => entry.card);
	}

	/** Empty array = match all. Non-empty = match any selected tier. */
	private matchesTier(card: T): boolean {
		if (this.filters.tiers.length === 0) return true;
		return this.filters.tiers.includes(String(card.tier));
	}

	/** Empty array = match all. Non-empty = match any selected source. */
	private matchesSource(card: T): boolean {
		if (this.filters.sources.length === 0) return true;
		const cardSource = (card.source || "core").toLowerCase();
		return this.filters.sources.some(s => s.toLowerCase() === cardSource);
	}

	/** Empty array = match all. Non-empty = match any selected type. */
	private matchesType(card: T): boolean {
		if (this.filters.types.length === 0) return true;

		const cardType = (String(card.type ?? "")).toLowerCase();
		const cardDisplayType = (String((card as Record<string, unknown>).displayType ?? "")).toLowerCase();

		return this.filters.types.some(filterType => {
			const ft = filterType.toLowerCase();
			// "horde" also matches "horde (hp/x)" variants
			if (ft === "horde") {
				return cardType === "horde" || cardType.startsWith("horde (");
			}
			return cardType === ft || cardDisplayType === ft;
		});
	}

	public getAvailableOptions(filterName: keyof SearchFilters): string[] {
		const options = new Set<string>();

		for (const card of this.cards) {
			if (filterName === "tiers" && card.tier !== undefined) {
				options.add(String(card.tier));
			} else if (filterName === "sources") {
				options.add(card.source || "core");
			} else if (filterName === "types") {
				if (card.type) options.add(String(card.type));
				const dt = (card as Record<string, unknown>).displayType;
				if (dt) options.add(String(dt));
			}
		}

		return Array.from(options).filter(opt => opt !== "").sort();
	}
}
