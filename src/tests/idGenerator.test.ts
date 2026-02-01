/**
 * idGenerator.test.ts
 * 
 * Simple tests for ID generation.
 * Each test checks one thing about the generated IDs.
 */

import { generateAdvUniqueId, generateEnvUniqueId } from '../utils/idGenerator';

describe('Adversary IDs', () => {
    it('starts with CUA_', () => {
        const id = generateAdvUniqueId();
        expect(id.startsWith('CUA_')).toBe(true);
    });

    it('creates different IDs each time', () => {
        const id1 = generateAdvUniqueId();
        const id2 = generateAdvUniqueId();
        expect(id1).not.toBe(id2);
    });
});

describe('Environment IDs', () => {
    it('starts with CUE_', () => {
        const id = generateEnvUniqueId();
        expect(id.startsWith('CUE_')).toBe(true);
    });

    it('creates different IDs each time', () => {
        const id1 = generateEnvUniqueId();
        const id2 = generateEnvUniqueId();
        expect(id1).not.toBe(id2);
    });
});
