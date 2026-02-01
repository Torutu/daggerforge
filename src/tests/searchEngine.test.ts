/**
 * searchEngine.test.ts
 * 
 * Simple tests for the search filter.
 * Each test shows one way to search or filter items.
 */

import { SearchEngine } from '../utils/searchEngine';

// Test items to search through
const ITEMS = [
    { name: 'Fire Drake', tier: '1', type: 'Solo', source: 'core', desc: 'A dragon' },
    { name: 'Ice Golem', tier: '2', type: 'Bruiser', source: 'void', desc: 'A giant' },
    { name: 'Goblin', tier: '1', type: 'Minion', source: 'core', desc: 'Small creature' },
];

describe('Search by name', () => {
    it('finds items by name', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ query: 'fire' });
        
        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });

    it('finds multiple items', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ query: 'creature' });
        
        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Goblin');
    });
});

describe('Filter by tier', () => {
    it('filters to tier 1 only', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ tier: '1' });
        
        const results = engine.search();
        expect(results).toHaveLength(2);  // Fire Drake and Goblin
    });

    it('filters to tier 2 only', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ tier: '2' });
        
        const results = engine.search();
        expect(results).toHaveLength(1);  // Ice Golem
    });
});

describe('Filter by source', () => {
    it('filters to core source only', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ source: 'core' });
        
        const results = engine.search();
        expect(results).toHaveLength(2);  // Fire Drake and Goblin
    });
});

describe('Filter by type', () => {
    it('filters to Solo type only', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ type: 'Solo' });
        
        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Fire Drake');
    });
});

describe('Multiple filters at once', () => {
    it('can combine tier and source filters', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ tier: '1', source: 'core' });
        
        const results = engine.search();
        expect(results).toHaveLength(2);  // Fire Drake and Goblin
    });
});

describe('Clear filters', () => {
    it('shows all items when filters are cleared', () => {
        const engine = new SearchEngine();
        engine.setItems(ITEMS);
        engine.setFilters({ tier: '1' });
        
        engine.clearFilters();
        
        const results = engine.search();
        expect(results).toHaveLength(3);  // All items
    });
});
