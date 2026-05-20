/**
 * searchEngineFacets.test.ts
 *
 * Tests for SearchEngine.getFacetCounts() — cross-filter counting.
 * Pure logic, no DOM. Runs in the default node environment.
 */

import { SearchEngine } from '../utils/searchEngine';

const CARDS = [
    { name: 'Fire Drake',   tier: '1', type: 'Solo',        source: 'core', desc: 'A dragon' },
    { name: 'Goblin',       tier: '1', type: 'Minion',      source: 'core', desc: 'A goblin' },
    { name: 'Ice Golem',    tier: '2', type: 'Bruiser',     source: 'void', desc: 'A golem' },
    { name: 'Shadow Drake', tier: '2', type: 'Solo',        source: 'core', desc: 'Shadow dragon' },
    { name: 'Swarm',        tier: '3', type: 'Horde (3/HP)', source: 'void', desc: 'Insects' },
];

function engine(cards = CARDS) {
    return new SearchEngine(cards);
}

// ── No active filters ─────────────────────────────────────────────────────────

describe('getFacetCounts — no filters', () => {
    test('tier counts are correct', () => {
        const counts = engine().getFacetCounts('tiers');
        expect(counts['1']).toBe(2);
        expect(counts['2']).toBe(2);
        expect(counts['3']).toBe(1);
    });

    test('source counts are correct', () => {
        const counts = engine().getFacetCounts('sources');
        expect(counts['core']).toBe(3);
        expect(counts['void']).toBe(2);
    });

    test('type counts normalise "Horde (3/HP)" to "Horde"', () => {
        const counts = engine().getFacetCounts('types');
        expect(counts['Solo']).toBe(2);
        expect(counts['Minion']).toBe(1);
        expect(counts['Bruiser']).toBe(1);
        expect(counts['Horde']).toBe(1);
        expect(counts['Horde (3/HP)']).toBeUndefined();
    });
});

// ── With active filters (cross-filter) ───────────────────────────────────────

describe('getFacetCounts — with active filters', () => {
    test('type=Solo: tier counts reflect only Solo cards', () => {
        const eng = engine();
        eng.setFilters({ types: ['Solo'] });
        const counts = eng.getFacetCounts('tiers');
        expect(counts['1']).toBe(1); // Fire Drake
        expect(counts['2']).toBe(1); // Shadow Drake
        expect(counts['3']).toBeUndefined();
    });

    test('source=void: tier counts reflect only void cards', () => {
        const eng = engine();
        eng.setFilters({ sources: ['void'] });
        const counts = eng.getFacetCounts('tiers');
        expect(counts['2']).toBe(1); // Ice Golem
        expect(counts['3']).toBe(1); // Swarm
        expect(counts['1']).toBeUndefined();
    });

    test('tier=1: source counts reflect only tier-1 cards', () => {
        const eng = engine();
        eng.setFilters({ tiers: ['1'] });
        const counts = eng.getFacetCounts('sources');
        expect(counts['core']).toBe(2); // Fire Drake + Goblin
        expect(counts['void']).toBeUndefined();
    });

    test('source=core + tier=1: type counts are {Solo:1, Minion:1}', () => {
        const eng = engine();
        eng.setFilters({ sources: ['core'], tiers: ['1'] });
        const counts = eng.getFacetCounts('types');
        expect(counts['Solo']).toBe(1);
        expect(counts['Minion']).toBe(1);
        expect(counts['Bruiser']).toBeUndefined();
    });

    test('text query "drake": tier counts reflect only matching cards', () => {
        const eng = engine();
        eng.setFilters({ query: 'drake' });
        const counts = eng.getFacetCounts('tiers');
        expect(counts['1']).toBe(1); // Fire Drake
        expect(counts['2']).toBe(1); // Shadow Drake
        expect(counts['3']).toBeUndefined();
    });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('getFacetCounts — edge cases', () => {
    test('empty dataset returns empty objects for all dimensions', () => {
        const eng = new SearchEngine([]);
        expect(eng.getFacetCounts('tiers')).toEqual({});
        expect(eng.getFacetCounts('sources')).toEqual({});
        expect(eng.getFacetCounts('types')).toEqual({});
    });

    test('dimension being counted is always excluded from its own filter', () => {
        // Even with type filter active, getFacetCounts("types") counts ALL types
        // that pass the OTHER filters (no type filter applied to itself)
        const eng = engine();
        eng.setFilters({ types: ['Solo'] });
        const counts = eng.getFacetCounts('types');
        // With source=all and tier=all, all types from all cards should appear
        expect(counts['Solo']).toBeGreaterThan(0);
        expect(counts['Minion']).toBeGreaterThan(0);
    });
});
