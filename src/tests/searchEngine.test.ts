/**
 * searchEngine.test.ts
 * 
 * Tests for search and filter functionality
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
        const expected = 1;
        const actual = results.length;
        
        logResult('Find cards by name (query="fire")', `${expected} card`, `${actual} card`, actual === expected);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    it('finds multiple cards', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ query: 'creature' });
        
        const results = engine.search();
        const expected = 1;
        const actual = results.length;
        
        logResult('Find by description (query="creature")', `${expected} card (Goblin)`, `${actual} card`, actual === expected);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Goblin');
    });
});

describe('Filter by tier', () => {
    it('filters to tier 1 only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tier: '1' });
        
        const results = engine.search();
        const expected = 2;
        const actual = results.length;
        
        logResult('Filter by tier 1', `${expected} cards (Fire Drake, Goblin)`, `${actual} cards`, actual === expected);
        
        expect(results).toHaveLength(2);
    });

    it('filters to tier 2 only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tier: '2' });
        
        const results = engine.search();
        const expected = 1;
        const actual = results.length;
        
        logResult('Filter by tier 2', `${expected} card (Ice Golem)`, `${actual} card`, actual === expected);
        
        expect(results).toHaveLength(1);
    });
});

describe('Filter by source', () => {
    it('filters to core source only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ source: 'core' });
        
        const results = engine.search();
        const expected = 2;
        const actual = results.length;
        
        logResult('Filter by source (core)', `${expected} cards (Fire Drake, Goblin)`, `${actual} cards`, actual === expected);
        
        expect(results).toHaveLength(2);
    });
});

describe('Filter by type', () => {
    it('filters to Solo type only', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ type: 'Solo' });
        
        const results = engine.search();
        const expected = 1;
        const actual = results.length;
        
        logResult('Filter by type (Solo)', `${expected} card (Fire Drake)`, `${actual} card`, actual === expected);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });
});

describe('Multiple filters at once', () => {
    it('can combine tier and source filters', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tier: '1', source: 'core' });
        
        const results = engine.search();
        const expected = 2;
        const actual = results.length;
        
        logResult('Multiple filters (tier=1, source=core)', `${expected} cards (Fire Drake, Goblin)`, `${actual} cards`, actual === expected);
        
        expect(results).toHaveLength(2);
    });
});

describe('Clear filters', () => {
    it('shows all cards when filters are cleared', () => {
        const engine = new SearchEngine();
        engine.setCards(CARDS);
        engine.setFilters({ tier: '1' });
        engine.clearFilters();
        
        const results = engine.search();
        const expected = 3;
        const actual = results.length;
        
        logResult('Clear filters', `${expected} cards (all cards)`, `${actual} cards`, actual === expected);
        
        expect(results).toHaveLength(3);
    });
});
