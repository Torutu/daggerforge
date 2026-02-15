/**
 * idGenerator.test.ts
 * 
 * Tests for ID generation utility
 */

import { generateAdvUniqueId, generateEnvUniqueId } from '../utils/index';

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
ID GENERATOR TEST RESULTS
========================================

${testResults.join('\n')}`);
});

describe('Adversary IDs', () => {
    it('starts with CUA_', () => {
        const id = generateAdvUniqueId();
        const expected = 'CUA_';
        const actual = id.substring(0, 4);

        logResult('Adversary ID prefix', `ID starts with "${expected}"`, `ID: ${id}`, actual === expected);

        expect(id.startsWith('CUA_')).toBe(true);
    });

    it('creates different IDs each time', () => {
        const id1 = generateAdvUniqueId();
        const id2 = generateAdvUniqueId();
        const passed = (id1 !== id2);

        logResult('Adversary IDs are unique', 'IDs should be different', `ID1: ${id1}, ID2: ${id2}`, passed);

        expect(id1).not.toBe(id2);
    });
});

describe('Environment IDs', () => {
    it('starts with CUE_', () => {
        const id = generateEnvUniqueId();
        const expected = 'CUE_';
        const actual = id.substring(0, 4);

        logResult('Environment ID prefix', `ID starts with "${expected}"`, `ID: ${id}`, actual === expected);

        expect(id.startsWith('CUE_')).toBe(true);
    });

    it('creates different IDs each time', () => {
        const id1 = generateEnvUniqueId();
        const id2 = generateEnvUniqueId();
        const passed = (id1 !== id2);

        logResult('Environment IDs are unique', 'IDs should be different', `ID1: ${id1}, ID2: ${id2}`, passed);

        expect(id1).not.toBe(id2);
    });
});
