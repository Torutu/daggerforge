/**
 * searchEngine.test.ts
 * 
 * Tests for search and filter functionality
 * Filters now use arrays: tiers, sources, types (OR logic within each group)
 */

import { SearchEngine } from '../utils/searchEngine';

const CARDS = [
    { name: 'Fire Drake', tier: '1', type: 'Solo', source: 'core', desc: 'A dragon' },
    { name: 'Ice Golem', tier: '2', type: 'Bruiser', source: 'void', desc: 'A giant' },
    { name: 'Goblin', tier: '1', type: 'Minion', source: 'core', desc: 'Small creature' },
];

const testResults: string[] = [];

function logResult(testName: string, expected: any, actual: any, passed: boolean) {
    testResults.push(`Test: ${testName}`);
    testResults.push(`  Expected: ${expected}`);
    testResults.push(`  Actual:   ${actual}`);
    testResults.push(`  Result:   ${passed ? 'PASS' : 'FAIL'}`);
    testResults.push('');
}

afterAll(() => {
    console.log(`
========================================
SEARCH ENGINE TEST RESULTS
========================================

${testResults.join('\n')}`);
});

describe('Search by name', () => {
    it('finds cards by name', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ query: 'fire' });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Find cards by name (query="fire")', '1 card', `${actual} card`, actual === 1);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    it('finds by description', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ query: 'creature' });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Find by description (query="creature")', '1 card (Goblin)', `${actual} card`, actual === 1);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Goblin');
    });
});

describe('Filter by tier (single)', () => {
    it('filters to tier 1 only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tiers: ['1'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Filter by tier 1', '2 cards (Fire Drake, Goblin)', `${actual} cards`, actual === 2);
        
        expect(results).toHaveLength(2);
    });

    it('filters to tier 2 only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tiers: ['2'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Filter by tier 2', '1 card (Ice Golem)', `${actual} card`, actual === 1);
        
        expect(results).toHaveLength(1);
    });
});

describe('Multi-select tier filter', () => {
    it('returns cards matching any selected tier', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tiers: ['1', '2'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Tier 1 OR 2', '3 cards (all)', `${actual} cards`, actual === 3);
        
        expect(results).toHaveLength(3);
    });
});

describe('Filter by source (single)', () => {
    it('filters to core source only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ sources: ['core'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Filter by source (core)', '2 cards (Fire Drake, Goblin)', `${actual} cards`, actual === 2);
        
        expect(results).toHaveLength(2);
    });
});

describe('Multi-select source filter', () => {
    it('returns cards matching any selected source', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ sources: ['core', 'void'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Source core OR void', '3 cards (all)', `${actual} cards`, actual === 3);
        
        expect(results).toHaveLength(3);
    });
});

describe('Filter by type (single)', () => {
    it('filters to Solo type only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ types: ['Solo'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Filter by type (Solo)', '1 card (Fire Drake)', `${actual} card`, actual === 1);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });
});

describe('Multi-select type filter', () => {
    it('returns cards matching any selected type', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ types: ['Solo', 'Minion'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('Type Solo OR Minion', '2 cards (Fire Drake, Goblin)', `${actual} cards`, actual === 2);
        
        expect(results).toHaveLength(2);
    });
});

describe('Multiple filter groups combined', () => {
    it('applies AND logic across groups (tier AND source)', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tiers: ['1'], sources: ['core'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('tiers=[1] AND sources=[core]', '2 cards (Fire Drake, Goblin)', `${actual} cards`, actual === 2);
        
        expect(results).toHaveLength(2);
    });

    it('narrows with multi-select across groups', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        // tier 1 AND (Solo OR Minion) → Fire Drake + Goblin
        engine.setFilters({ tiers: ['1'], types: ['Solo', 'Minion'] });
        
        const results = engine.search();
        const actual = results.length;
        logResult('tiers=[1] AND types=[Solo,Minion]', '2 cards', `${actual} cards`, actual === 2);
        
        expect(results).toHaveLength(2);
    });
});

describe('Clear filters', () => {
    it('shows all cards when filters are cleared', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tiers: ['1'] });
        engine.clearFilters();
        
        const results = engine.search();
        const actual = results.length;
        logResult('Clear filters', '3 cards (all)', `${actual} cards`, actual === 3);
        
        expect(results).toHaveLength(3);
    });
});
