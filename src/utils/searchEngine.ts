/**
 * Search Engine for DaggerForge Browsers
 * Handles fuzzy text search, dropdown filtering, and relevance-ranked results.
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
	[key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Fuzzy scorer
// ---------------------------------------------------------------------------

/**
 * Score how well `query` matches `text` using character-sequence matching.
 *
 * Every character of the query must appear in the text in order for the
 * function to return a positive score. The score is higher when:
 *   - matched characters are consecutive (rewards "blksm" → "Blacksmith")
 *   - the first match starts near the beginning of the text
 *
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
			// First character matched — record position for start-of-word bonus
			if (firstMatchIndex === -1) firstMatchIndex = textIndex;

			// Consecutive characters in the text score progressively higher
			consecutiveBonus = queryIndex > 0 && t[textIndex - 1] === q[queryIndex - 1]
				? consecutiveBonus + 1
				: 0;

			score += 1 + consecutiveBonus;
			queryIndex++;
		}
		textIndex++;
	}

	// All query characters must have matched
	if (queryIndex < q.length) return 0;

	// Penalise matches that start far into the string
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
		this.filters = { query: "", tier: null, source: null, type: null };
	}

	/**
	 * Return cards that pass all dropdown filters, ordered by fuzzy relevance
	 * when a text query is active, or in original order otherwise.
	 */
	public search(): T[] {
		const query = this.filters.query.trim();

		// Apply dropdown filters first (exact-match, cheap)
		const filtered = this.cards.filter(card =>
			this.matchesTier(card) &&
			this.matchesSource(card) &&
			this.matchesType(card)
		);

		if (!query) return filtered;

		// Score each card; discard those with no fuzzy match
		const scored = filtered
			.map(card => ({ card, score: bestFieldScore(card, query) }))
			.filter(entry => entry.score > 0);

		// Sort descending by score so the best match is at the top
		scored.sort((a, b) => b.score - a.score);

		return scored.map(entry => entry.card);
	}

	private matchesTier(card: T): boolean {
		if (this.filters.tier === null) return true;
		return String(card.tier) === String(this.filters.tier);
	}

	private matchesSource(card: T): boolean {
		if (!this.filters.source) return true;
		return (card.source || "core").toLowerCase() === this.filters.source.toLowerCase();
	}

	private matchesType(card: T): boolean {
		if (!this.filters.type) return true;
		const filterType = this.filters.type.toLowerCase();
		const cardType = (String(card.type ?? "")).toLowerCase();
		const cardDisplayType = (String((card as Record<string, unknown>).displayType ?? "")).toLowerCase();

		// "horde" filter must also match "horde (hp/x)" variants
		if (filterType === "horde") {
			return cardType === "horde" || cardType.startsWith("horde (");
		}

		return cardType === filterType || cardDisplayType === filterType;
	}

	public getAvailableOptions(filterName: keyof SearchFilters): string[] {
		const options = new Set<string>();

		for (const card of this.cards) {
			if (filterName === "tier" && card.tier !== undefined) {
				options.add(String(card.tier));
			} else if (filterName === "source") {
				options.add(card.source || "core");
			} else if (filterName === "type") {
				if (card.type) options.add(String(card.type));
				const dt = (card as Record<string, unknown>).displayType;
				if (dt) options.add(String(dt));
			}
		}

		return Array.from(options).filter(opt => opt !== "").sort();
	}
}
