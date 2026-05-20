/**
 * @jest-environment jsdom
 *
 * AdvToHtml.test.ts
 *
 * Tests for buildCardHTML(). Uses jsdom because toCustomHtml() (called
 * internally for feature richContent) manipulates the DOM.
 * crypto.randomUUID is mocked so output is deterministic.
 */

import { buildCardHTML } from '../features/adversaries/AdvToHtml';
import type { Feature } from '../types/index';

const MOCK_UUID = 'test-uuid-1234-5678-abcd-efgh';

beforeAll(() => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
        writable: true,
        configurable: true,
        value: () => MOCK_UUID,
    });
});

afterAll(() => {
    delete (globalThis.crypto as any).randomUUID;
});

function baseValues(): Record<string, string> {
    return {
        name: 'Goblin Scout',
        tier: '1',
        type: 'Minion',
        desc: 'A sneaky goblin.',
        motives: 'Steal and flee',
        difficulty: '10',
        thresholdMajor: '6',
        thresholdSevere: '12',
        hp: '3',
        stress: '2',
        atk: '+2',
        weaponName: 'Dagger',
        weaponRange: 'Very Close',
        weaponDamage: '1d6+1',
        xp: '',
        count: '1',
        source: 'core',
    };
}

const NO_FEATURES: Feature[] = [];

// ── Core content ──────────────────────────────────────────────────────────────

describe('buildCardHTML — content', () => {
    test('includes the name', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES)).toContain('Goblin Scout');
    });

    test('includes tier and type in subtitle', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        expect(html).toContain('Tier 1');
        expect(html).toContain('Minion');
    });

    test('includes description', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES)).toContain('A sneaky goblin.');
    });

    test('includes motives', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES)).toContain('Steal and flee');
    });

    test('includes difficulty, thresholds, HP in stats', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        expect(html).toContain('>10 |<');
        expect(html).toContain('>6/12 |<');
        expect(html).toContain('>3 |<');
    });

    test('includes weapon name, range, damage', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        expect(html).toContain('Dagger');
        expect(html).toContain('Very Close');
        expect(html).toContain('1d6+1');
    });

    test('UUID appears on edit button and h2', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        const matches = (html.match(new RegExp(MOCK_UUID, 'g')) ?? []).length;
        expect(matches).toBeGreaterThanOrEqual(2);
    });
});

// ── Stress block ──────────────────────────────────────────────────────────────

describe('buildCardHTML — stress block', () => {
    test('includes Stress when stress is non-empty', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES)).toContain('Stress:');
    });

    test('omits Stress when stress is empty string', () => {
        const vals = { ...baseValues(), stress: '' };
        expect(buildCardHTML(vals, NO_FEATURES)).not.toContain('Stress:');
    });
});

// ── Source badge ──────────────────────────────────────────────────────────────

describe('buildCardHTML — source badge', () => {
    test('df-source-badge-core for source=core', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES)).toContain('class="df-source-badge-core"');
    });

    test('df-source-badge-custom when source is empty', () => {
        const vals = { ...baseValues(), source: '' };
        expect(buildCardHTML(vals, NO_FEATURES)).toContain('class="df-source-badge-custom"');
    });

    test('lowercases source in badge class', () => {
        const vals = { ...baseValues(), source: 'VOID' };
        expect(buildCardHTML(vals, NO_FEATURES)).toContain('class="df-source-badge-void"');
    });
});

// ── Wide mode ─────────────────────────────────────────────────────────────────

describe('buildCardHTML — wide mode', () => {
    test('adds df-card--wide when wide=true', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES, true)).toContain('df-card--wide');
    });

    test('no df-card--wide when wide=false (default)', () => {
        expect(buildCardHTML(baseValues(), NO_FEATURES, false)).not.toContain('df-card--wide');
    });
});

// ── HP / Stress tick boxes ────────────────────────────────────────────────────

describe('buildCardHTML — tickboxes', () => {
    test('generates hp=3 tickboxes for count=1', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        expect((html.match(/class="df-hp-tickbox"/g) ?? []).length).toBe(3);
    });

    test('generates stress=2 tickboxes for count=1', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        expect((html.match(/class="df-stress-tickbox"/g) ?? []).length).toBe(2);
    });

    test('multiplies tickboxes by count=3', () => {
        const vals = { ...baseValues(), count: '3' };
        const html = buildCardHTML(vals, NO_FEATURES);
        expect((html.match(/class="df-hp-tickbox"/g) ?? []).length).toBe(9);
    });

    test('generates adversary-count labels per copy', () => {
        const vals = { ...baseValues(), count: '2' };
        const html = buildCardHTML(vals, NO_FEATURES);
        expect((html.match(/class="df-adversary-count"/g) ?? []).length).toBe(2);
    });

    test('invalid count falls back to 1 copy', () => {
        const vals = { ...baseValues(), count: 'abc' };
        const html = buildCardHTML(vals, NO_FEATURES);
        expect((html.match(/class="df-hp-tickbox"/g) ?? []).length).toBe(3);
    });
});

// ── Features ──────────────────────────────────────────────────────────────────

describe('buildCardHTML — features', () => {
    test('renders feature name and type', () => {
        const features: Feature[] = [
            { name: 'Pack Tactics', type: 'Passive', cost: '', richContent: '' },
        ];
        const html = buildCardHTML(baseValues(), features);
        expect(html).toContain('Pack Tactics');
        expect(html).toContain('Passive');
    });

    test('renders feature cost when present', () => {
        const features: Feature[] = [
            { name: 'Strike', type: 'Action', cost: '2 Stress', richContent: '' },
        ];
        expect(buildCardHTML(baseValues(), features)).toContain('2 Stress');
    });

    test('richContent passes through toCustomHtml (ul→df-ul)', () => {
        const features: Feature[] = [
            { name: 'Swarm', type: 'Passive', cost: '', richContent: '<ul><li>Item</li></ul>' },
        ];
        const html = buildCardHTML(baseValues(), features);
        expect(html).toContain('df-ul');
        expect(html).not.toContain('<ul>');
    });

    test('no df-feature divs when features is empty', () => {
        const html = buildCardHTML(baseValues(), NO_FEATURES);
        expect((html.match(/class="df-feature"/g) ?? []).length).toBe(0);
    });

    test('renders multiple features', () => {
        const features: Feature[] = [
            { name: 'Alpha', type: 'Passive', cost: '', richContent: '' },
            { name: 'Beta',  type: 'Action',  cost: '1', richContent: '' },
        ];
        expect((buildCardHTML(baseValues(), features).match(/class="df-feature"/g) ?? []).length).toBe(2);
    });
});

// ── data-attributes ───────────────────────────────────────────────────────────

describe('buildCardHTML — data attributes', () => {
    test('data-type strips the parenthetical from Horde (5/HP)', () => {
        const vals = { ...baseValues(), type: 'Horde (5/HP)' };
        expect(buildCardHTML(vals, NO_FEATURES)).toContain('data-type="Horde"');
    });

    test('data-count reflects the count value', () => {
        const vals = { ...baseValues(), count: '3' };
        expect(buildCardHTML(vals, NO_FEATURES)).toContain('data-count="3"');
    });
});
