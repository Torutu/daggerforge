/**
 * searchEngine.test.ts
 *
 * Tests for search and filter functionality.
 * Filters use arrays: tiers, sources, types (OR logic within each group, AND across).
 */

import { SearchEngine } from '../utils/searchEngine';

const CARDS = [
    { name: 'Fire Drake', tier: '1', type: 'Solo',    source: 'core', desc: 'A dragon' },
    { name: 'Ice Golem',  tier: '2', type: 'Bruiser', source: 'void', desc: 'A giant' },
    { name: 'Goblin',     tier: '1', type: 'Minion',  source: 'core', desc: 'Small creature' },
];

function engine() {
    return new SearchEngine(CARDS);
}

describe('Text search', () => {
    test('finds cards by name', () => {
        const results = engine().search();
        expect(results).toHaveLength(3);
    });

    test('query="fire" returns Fire Drake', () => {
        const e = engine();
        e.setFilters({ query: 'fire' });
        const results = e.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    test('query="creature" returns Goblin (desc match)', () => {
        const e = engine();
        e.setFilters({ query: 'creature' });
        const results = e.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Goblin');
    });
});

describe('Tier filter', () => {
    test('tier=1 returns 2 cards', () => {
        const e = engine();
        e.setFilters({ tiers: ['1'] });
        expect(e.search()).toHaveLength(2);
    });

    test('tier=2 returns 1 card', () => {
        const e = engine();
        e.setFilters({ tiers: ['2'] });
        expect(e.search()).toHaveLength(1);
    });

    test('tiers=[1,2] returns all 3 cards (OR logic)', () => {
        const e = engine();
        e.setFilters({ tiers: ['1', '2'] });
        expect(e.search()).toHaveLength(3);
    });
});

describe('Source filter', () => {
    test('source=core returns 2 cards', () => {
        const e = engine();
        e.setFilters({ sources: ['core'] });
        expect(e.search()).toHaveLength(2);
    });

    test('sources=[core,void] returns all 3 cards (OR logic)', () => {
        const e = engine();
        e.setFilters({ sources: ['core', 'void'] });
        expect(e.search()).toHaveLength(3);
    });
});

describe('Type filter', () => {
    test('type=Solo returns Fire Drake', () => {
        const e = engine();
        e.setFilters({ types: ['Solo'] });
        const results = e.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    test('types=[Solo,Minion] returns 2 cards (OR logic)', () => {
        const e = engine();
        e.setFilters({ types: ['Solo', 'Minion'] });
        expect(e.search()).toHaveLength(2);
    });
});

describe('Combined filters (AND across groups)', () => {
    test('tiers=[1] AND sources=[core] returns 2 cards', () => {
        const e = engine();
        e.setFilters({ tiers: ['1'], sources: ['core'] });
        expect(e.search()).toHaveLength(2);
    });

    test('tiers=[1] AND types=[Solo,Minion] returns 2 cards', () => {
        const e = engine();
        e.setFilters({ tiers: ['1'], types: ['Solo', 'Minion'] });
        expect(e.search()).toHaveLength(2);
    });
});

describe('Clear filters', () => {
    test('clearFilters restores all cards', () => {
        const e = engine();
        e.setFilters({ tiers: ['1'] });
        e.clearFilters();
        expect(e.search()).toHaveLength(3);
    });
});
