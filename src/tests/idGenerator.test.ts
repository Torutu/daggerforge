/**
 * idGenerator.test.ts
 * 
 * Tests for generateAdvUniqueId() and generateEnvUniqueId().
 * Both are pure functions with no external dependencies — no mocks needed.
 * 
 * What's verified:
 *   - Correct prefix format (CUA_ vs CUE_)
 *   - Structure: prefix_timestamp_random (three segments, underscore-separated)
 *   - Timestamp segment is a valid number and roughly current
 *   - Random segment is non-empty alphanumeric
 *   - Rapid successive calls never collide
 */

import { generateAdvUniqueId, generateEnvUniqueId } from '../utils/idGenerator';

// ---------------------------------------------------------------------------
// Format & structure
// ---------------------------------------------------------------------------

describe('generateAdvUniqueId', () => {
    it('starts with CUA_ prefix', () => {
        const id = generateAdvUniqueId();
        expect(id.startsWith('CUA_')).toBe(true);
    });

    it('has exactly three underscore-separated segments', () => {
        const id = generateAdvUniqueId();
        const parts = id.split('_');
        // CUA _ <timestamp> _ <random>
        expect(parts).toHaveLength(3);
    });

    it('timestamp segment is a valid integer close to Date.now()', () => {
        const before = Date.now();
        const id = generateAdvUniqueId();
        const after = Date.now();

        const timestamp = parseInt(id.split('_')[1], 10);
        expect(isNaN(timestamp)).toBe(false);
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('random segment is non-empty and alphanumeric', () => {
        const id = generateAdvUniqueId();
        const random = id.split('_')[2];

        expect(random.length).toBeGreaterThan(0);
        // base-36 output: only lowercase letters and digits
        expect(/^[a-z0-9]+$/.test(random)).toBe(true);
    });
});

describe('generateEnvUniqueId', () => {
    it('starts with CUE_ prefix', () => {
        const id = generateEnvUniqueId();
        expect(id.startsWith('CUE_')).toBe(true);
    });

    it('has exactly three underscore-separated segments', () => {
        const id = generateEnvUniqueId();
        const parts = id.split('_');
        expect(parts).toHaveLength(3);
    });

    it('timestamp segment is a valid integer close to Date.now()', () => {
        const before = Date.now();
        const id = generateEnvUniqueId();
        const after = Date.now();

        const timestamp = parseInt(id.split('_')[1], 10);
        expect(isNaN(timestamp)).toBe(false);
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('random segment is non-empty and alphanumeric', () => {
        const id = generateEnvUniqueId();
        const random = id.split('_')[2];

        expect(random.length).toBeGreaterThan(0);
        expect(/^[a-z0-9]+$/.test(random)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Uniqueness — the only property that actually matters at runtime
// ---------------------------------------------------------------------------

describe('uniqueness', () => {
    it('generates 1000 adversary IDs with zero collisions', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            ids.add(generateAdvUniqueId());
        }
        expect(ids.size).toBe(1000);
    });

    it('generates 1000 environment IDs with zero collisions', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            ids.add(generateEnvUniqueId());
        }
        expect(ids.size).toBe(1000);
    });

    it('adversary and environment ID spaces never overlap', () => {
        const advIds = new Set<string>();
        const envIds = new Set<string>();

        for (let i = 0; i < 500; i++) {
            advIds.add(generateAdvUniqueId());
            envIds.add(generateEnvUniqueId());
        }

        // Intersection must be empty — prefixes alone guarantee this,
        // but we verify the full IDs to be explicit.
        for (const id of advIds) {
            expect(envIds.has(id)).toBe(false);
        }
    });
});
