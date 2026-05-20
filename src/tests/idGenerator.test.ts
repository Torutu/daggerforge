/**
 * idGenerator.test.ts
 *
 * Tests for the adversary and environment ID generation utilities.
 */

import { generateAdvUniqueId, generateEnvUniqueId } from '../utils/index';

describe('generateAdvUniqueId', () => {
    test('starts with CUA_', () => {
        expect(generateAdvUniqueId()).toMatch(/^CUA_/);
    });

    test('produces unique values', () => {
        expect(generateAdvUniqueId()).not.toBe(generateAdvUniqueId());
    });
});

describe('generateEnvUniqueId', () => {
    test('starts with CUE_', () => {
        expect(generateEnvUniqueId()).toMatch(/^CUE_/);
    });

    test('produces unique values', () => {
        expect(generateEnvUniqueId()).not.toBe(generateEnvUniqueId());
    });
});
