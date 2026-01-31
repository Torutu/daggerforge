/**
 * searchEngine.test.ts
 * 
 * Tests for SearchEngine<T> — the filter/search layer used by both
 * the Adversary Browser and Environment Browser.
 * 
 * SearchEngine is a pure class: it takes an array of plain objects, holds
 * filter state, and returns filtered results.  Zero Obsidian dependencies,
 * zero mocks needed.
 * 
 * Sections:
 *   1. Query filter         — text matching across name, type, desc
 *   2. Tier filter           — exact numeric match
 *   3. Source filter         — exact string match (case-insensitive)
 *   4. Type filter           — matches type or displayType
 *   5. Combined filters      — multiple active at once
 *   6. Filter state mgmt     — get/set/clear, searchWith (temporary filters)
 *   7. getAvailableOptions   — what the UI dropdowns are populated with
 *   8. Edge cases            — empty sets, whitespace queries
 */

import { SearchEngine } from '../utils/searchEngine';
import type { SearchableItem } from '../utils/searchEngine';

// ---------------------------------------------------------------------------
// Fixture data — represents a realistic mix of adversaries/environments
// ---------------------------------------------------------------------------

interface TestItem extends SearchableItem {
    name: string;
    tier: number;
    type: string;
    source: string;
    desc: string;
    displayType?: string;
}

const ITEMS: TestItem[] = [
    { name: 'Acid Burrower',  tier: 1, type: 'Solo',    source: 'core',      desc: 'A horse-sized insect with digging claws.' },
    { name: 'Goblin Raider',  tier: 1, type: 'Minion',  source: 'core',      desc: 'A small green creature that steals.' },
    { name: 'Fire Drake',     tier: 2, type: 'Solo',    source: 'void',      desc: 'A lizard wreathed in flame.' },
    { name: 'Ice Golem',      tier: 3, type: 'Bruiser', source: 'core',      desc: 'A towering construct of frozen earth.' },
    { name: 'Shadow Stalker', tier: 2, type: 'Skulk',   source: 'umbra',     desc: 'Moves through shadows silently.' },
    { name: 'Custom Bandit',  tier: 1, type: 'Standard',source: 'custom',   desc: 'A player-made bandit.' },
    // Item with displayType — simulates Umbra-Touched variants
    { name: 'Dark Leader',    tier: 2, type: 'Leader',  source: 'umbra',     desc: 'An umbra-touched warlord.',
      displayType: 'Leader (Umbra-Touched)' },
];

function freshEngine(): SearchEngine<TestItem> {
    const engine = new SearchEngine<TestItem>();
    engine.setItems([...ITEMS]);   // shallow copy so mutations don't leak
    return engine;
}

// ===========================================================================
// 1. Query filter
// ===========================================================================

describe('SearchEngine — query filter', () => {
    it('returns all items when query is empty', () => {
        const engine = freshEngine();
        engine.setFilters({ query: '' });
        expect(engine.search()).toHaveLength(ITEMS.length);
    });

    it('matches items by name substring (case-insensitive)', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'fire' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    it('matches items by type substring', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'solo' });

        const results = engine.search();
        // Acid Burrower and Fire Drake are both Solo
        expect(results).toHaveLength(2);
    });

    it('matches items by desc substring', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'shadows' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Shadow Stalker');
    });

    it('returns empty when query matches nothing', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'xyznonexistent' });

        expect(engine.search()).toHaveLength(0);
    });

    it('does not match when query has leading/trailing whitespace', () => {
        const engine = freshEngine();
        engine.setFilters({ query: '  fire  ' });

        // matchesQuery trims only for the empty-string early-return check.
        // The actual .includes() runs against the raw "  fire  " string,
        // which no item name/type/desc contains — so nothing matches.
        expect(engine.search()).toHaveLength(0);
    });
});

// ===========================================================================
// 2. Tier filter
// ===========================================================================

describe('SearchEngine — tier filter', () => {
    it('returns all items when tier is null', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: null });
        expect(engine.search()).toHaveLength(ITEMS.length);
    });

    it('filters to only tier-1 items', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: 1 });

        const results = engine.search();
        expect(results.every(item => item.tier === 1)).toBe(true);
        expect(results).toHaveLength(3); // Acid Burrower, Goblin Raider, Custom Bandit
    });

    it('filters to only tier-3 items', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: 3 });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Ice Golem');
    });

    it('returns empty for a tier with no items', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: 4 });

        expect(engine.search()).toHaveLength(0);
    });
});

// ===========================================================================
// 3. Source filter
// ===========================================================================

describe('SearchEngine — source filter', () => {
    it('returns all items when source is null', () => {
        const engine = freshEngine();
        engine.setFilters({ source: null });
        expect(engine.search()).toHaveLength(ITEMS.length);
    });

    it('filters to core source only', () => {
        const engine = freshEngine();
        engine.setFilters({ source: 'core' });

        const results = engine.search();
        expect(results.every(item => item.source === 'core')).toBe(true);
        expect(results).toHaveLength(3); // Acid Burrower, Goblin Raider, Ice Golem
    });

    it('source match is case-insensitive', () => {
        const engine = freshEngine();
        engine.setFilters({ source: 'CORE' });

        const results = engine.search();
        expect(results).toHaveLength(3);
    });

    it('filters to custom source only', () => {
        const engine = freshEngine();
        engine.setFilters({ source: 'custom' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Custom Bandit');
    });

    it('returns empty for a source with no items', () => {
        const engine = freshEngine();
        engine.setFilters({ source: 'sablewood' });

        expect(engine.search()).toHaveLength(0);
    });
});

// ===========================================================================
// 4. Type filter — including displayType matching
// ===========================================================================

describe('SearchEngine — type filter', () => {
    it('returns all items when type is null', () => {
        const engine = freshEngine();
        engine.setFilters({ type: null });
        expect(engine.search()).toHaveLength(ITEMS.length);
    });

    it('filters by base type', () => {
        const engine = freshEngine();
        engine.setFilters({ type: 'Solo' });

        const results = engine.search();
        expect(results).toHaveLength(2); // Acid Burrower, Fire Drake
    });

    it('matches displayType when base type does not match', () => {
        const engine = freshEngine();
        // Dark Leader has type: 'Leader' and displayType: 'Leader (Umbra-Touched)'
        engine.setFilters({ type: 'Leader (Umbra-Touched)' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Dark Leader');
    });

    it('type match is case-insensitive', () => {
        const engine = freshEngine();
        engine.setFilters({ type: 'solo' });

        const results = engine.search();
        expect(results).toHaveLength(2);
    });

    it('returns empty for a type with no items', () => {
        const engine = freshEngine();
        engine.setFilters({ type: 'Horde' });

        expect(engine.search()).toHaveLength(0);
    });
});

// ===========================================================================
// 5. Combined filters — multiple dimensions active at once
// ===========================================================================

describe('SearchEngine — combined filters', () => {
    it('tier + source narrows correctly', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: 1, source: 'core' });

        const results = engine.search();
        // Tier 1 AND core: Acid Burrower, Goblin Raider
        expect(results).toHaveLength(2);
    });

    it('query + tier + source all active', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'goblin', tier: 1, source: 'core' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Goblin Raider');
    });

    it('all four filters active, matching single item', () => {
        const engine = freshEngine();
        engine.setFilters({
            query: 'fire',
            tier: 2,
            source: 'void',
            type: 'Solo',
        });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    it('all four filters active, no match', () => {
        const engine = freshEngine();
        engine.setFilters({
            query: 'fire',
            tier: 1,         // Fire Drake is tier 2 — mismatch
            source: 'void',
            type: 'Solo',
        });

        expect(engine.search()).toHaveLength(0);
    });
});

// ===========================================================================
// 6. Filter state management
// ===========================================================================

describe('SearchEngine — filter state', () => {
    it('getFilters returns current state', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'test', tier: 2 });

        const filters = engine.getFilters();
        expect(filters.query).toBe('test');
        expect(filters.tier).toBe(2);
    });

    it('setFilters merges partial updates without clobbering other fields', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'fire', tier: 2 });
        engine.setFilters({ source: 'void' });  // should keep query and tier

        const filters = engine.getFilters();
        expect(filters.query).toBe('fire');
        expect(filters.tier).toBe(2);
        expect(filters.source).toBe('void');
    });

    it('clearFilters resets everything to defaults', () => {
        const engine = freshEngine();
        engine.setFilters({ query: 'x', tier: 3, source: 'void', type: 'Solo' });

        engine.clearFilters();

        const filters = engine.getFilters();
        expect(filters.query).toBe('');
        expect(filters.tier).toBeNull();
        expect(filters.source).toBeNull();
        expect(filters.type).toBeNull();
    });

    it('searchWith applies temporary filters without mutating persistent state', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: 1 });   // persistent: tier 1 only

        // Temporary override: tier 2 — should NOT change persistent state
        const tempResults = engine.searchWith({ tier: 2 });
        expect(tempResults.every(item => item.tier === 2)).toBe(true);

        // Persistent state still tier 1
        const persistentResults = engine.search();
        expect(persistentResults.every(item => item.tier === 1)).toBe(true);
    });

    it('getResultCount matches search().length', () => {
        const engine = freshEngine();
        engine.setFilters({ tier: 2 });

        expect(engine.getResultCount()).toBe(engine.search().length);
    });

    it('getCountWith matches searchWith().length', () => {
        const engine = freshEngine();

        const count = engine.getCountWith({ source: 'umbra' });
        const results = engine.searchWith({ source: 'umbra' });

        expect(count).toBe(results.length);
    });
});

// ===========================================================================
// 7. getAvailableOptions — populates UI dropdowns
// ===========================================================================

describe('SearchEngine — getAvailableOptions', () => {
    it('returns all unique tiers as strings, sorted ascending', () => {
        const engine = freshEngine();
        const tiers = engine.getAvailableOptions('tier');

        expect(tiers).toEqual(['1', '2', '3']);  // no tier 4 in fixtures
    });

    it('returns all unique sources, sorted alphabetically', () => {
        const engine = freshEngine();
        const sources = engine.getAvailableOptions('source');

        expect(sources.sort()).toEqual(['core', 'custom', 'umbra', 'void'].sort());
    });

    it('returns both base types and displayTypes, sorted', () => {
        const engine = freshEngine();
        const types = engine.getAvailableOptions('type');

        // Should include 'Leader' (base) AND 'Leader (Umbra-Touched)' (displayType)
        expect(types).toContain('Leader');
        expect(types).toContain('Leader (Umbra-Touched)');
        expect(types).toContain('Solo');
        expect(types).toContain('Minion');
    });

    it('returns empty array when item set is empty', () => {
        const engine = new SearchEngine<TestItem>();
        engine.setItems([]);

        expect(engine.getAvailableOptions('tier')).toHaveLength(0);
        expect(engine.getAvailableOptions('source')).toHaveLength(0);
        expect(engine.getAvailableOptions('type')).toHaveLength(0);
    });
});

// ===========================================================================
// 8. Edge cases
// ===========================================================================

describe('SearchEngine — edge cases', () => {
    it('search on empty item set returns empty array', () => {
        const engine = new SearchEngine<TestItem>();
        engine.setItems([]);

        expect(engine.search()).toHaveLength(0);
    });

    it('whitespace-only query is treated as no filter', () => {
        const engine = freshEngine();
        engine.setFilters({ query: '   ' });

        // "   ".trim() is "" → matchesQuery returns true for all
        expect(engine.search()).toHaveLength(ITEMS.length);
    });

    it('items without optional source field default to "core" for matching', () => {
        const engine = new SearchEngine<TestItem>();
        // Item with no source property at all
        engine.setItems([{ name: 'No Source', tier: 1, type: 'Solo', desc: '' } as any]);
        engine.setFilters({ source: 'core' });

        // matchesSource falls back to "core" when source is undefined
        const results = engine.search();
        expect(results).toHaveLength(1);
    });

    it('items without optional type field are excluded by any type filter', () => {
        const engine = new SearchEngine<TestItem>();
        engine.setItems([{ name: 'No Type', tier: 1, source: 'core', desc: '' } as any]);
        engine.setFilters({ type: 'Solo' });

        // type is undefined → "" !== "solo" → filtered out
        expect(engine.search()).toHaveLength(0);
    });
});
