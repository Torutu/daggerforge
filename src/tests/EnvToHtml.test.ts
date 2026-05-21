/**
 * @jest-environment jsdom
 *
 * EnvToHtml.test.ts
 *
 * Tests for envToHtml(). Uses jsdom for the toCustomHtml transform.
 * crypto.randomUUID is mocked for deterministic output.
 */

import { envToHtml } from '../features/environments/EnvToHtml';
import type { EnvironmentData } from '../types/index';

const MOCK_UUID = 'env-uuid-5678-abcd-efgh-ijkl';

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

function baseEnv(): EnvironmentData {
    return {
        id: 'CUE_001',
        name: 'Whispering Bog',
        tier: '2',
        type: 'Exploration',
        desc: 'A fog-laden marshland.',
        impulse: 'Drag under, confuse',
        difficulty: '12',
        potentialAdversaries: 'Bog Witch, Swamp Serpent',
        source: 'core',
        features: [],
    };
}

// ── Core content ──────────────────────────────────────────────────────────────

describe('envToHtml — content', () => {
    test('includes the name', () => {
        expect(envToHtml(baseEnv())).toContain('Whispering Bog');
    });

    test('includes tier and type', () => {
        const html = envToHtml(baseEnv());
        expect(html).toContain('Tier 2');
        expect(html).toContain('Exploration');
    });

    test('includes description', () => {
        expect(envToHtml(baseEnv())).toContain('A fog-laden marshland.');
    });

    test('includes impulse', () => {
        expect(envToHtml(baseEnv())).toContain('Drag under, confuse');
    });

    test('includes difficulty', () => {
        expect(envToHtml(baseEnv())).toContain('12');
    });

    test('includes potential adversaries', () => {
        const html = envToHtml(baseEnv());
        expect(html).toContain('Bog Witch');
        expect(html).toContain('Swamp Serpent');
    });

    test('UUID appears on edit button and name div', () => {
        const html = envToHtml(baseEnv());
        const matches = (html.match(new RegExp(MOCK_UUID, 'g')) ?? []).length;
        expect(matches).toBeGreaterThanOrEqual(2);
    });
});

// ── Source badge ──────────────────────────────────────────────────────────────

describe('envToHtml — source badge', () => {
    test('df-source-badge-core for source=core', () => {
        expect(envToHtml(baseEnv())).toContain('class="df-source-badge-core"');
    });

    test('defaults to core when source is undefined', () => {
        const env = { ...baseEnv(), source: undefined };
        expect(envToHtml(env)).toContain('class="df-source-badge-core"');
    });

    test('lowercases source in badge class', () => {
        const env = { ...baseEnv(), source: 'VOID' };
        expect(envToHtml(env)).toContain('class="df-source-badge-void"');
    });
});

// ── Wide mode ─────────────────────────────────────────────────────────────────

describe('envToHtml — wide mode', () => {
    test('adds df-card--wide when wide=true', () => {
        expect(envToHtml(baseEnv(), true)).toContain('df-card--wide');
    });

    test('no df-card--wide when wide=false (default)', () => {
        expect(envToHtml(baseEnv())).not.toContain('df-card--wide');
    });
});

// ── Features ──────────────────────────────────────────────────────────────────

describe('envToHtml — features', () => {
    test('renders feature name and type', () => {
        const env = {
            ...baseEnv(),
            features: [{ name: 'Quicksand', type: 'Hazard', cost: undefined, richContent: '', questions: [] }],
        };
        const html = envToHtml(env);
        expect(html).toContain('Quicksand');
        expect(html).toContain('Hazard');
    });

    test('renders cost span with df-env-feat-cost when cost is set', () => {
        const env = {
            ...baseEnv(),
            features: [{ name: 'Fog', type: 'Action', cost: '3 Fear', richContent: '', questions: [] }],
        };
        const html = envToHtml(env);
        expect(html).toContain('3 Fear');
        expect(html).toContain('df-env-feat-cost');
    });

    test('omits cost span when cost is absent', () => {
        const env = {
            ...baseEnv(),
            features: [{ name: 'Mist', type: 'Passive', cost: undefined, richContent: '', questions: [] }],
        };
        expect(envToHtml(env)).not.toContain('df-env-feat-cost');
    });

    test('renders questions when present', () => {
        const env = {
            ...baseEnv(),
            features: [{
                name: 'Oracle',
                type: 'Passive',
                cost: undefined,
                richContent: '',
                questions: ['What do you see?', 'What do you fear?'],
            }],
        };
        const html = envToHtml(env);
        expect(html).toContain('What do you see?');
        expect(html).toContain('What do you fear?');
        expect(html).toContain('df-env-question');
    });

    test('omits questions block when questions is empty', () => {
        const env = {
            ...baseEnv(),
            features: [{ name: 'Mire', type: 'Hazard', cost: undefined, richContent: '', questions: [] }],
        };
        expect(envToHtml(env)).not.toContain('df-env-questions');
    });

    test('richContent passes through toCustomHtml (ul→df-ul)', () => {
        const env = {
            ...baseEnv(),
            features: [{
                name: 'Thorns',
                type: 'Passive',
                cost: undefined,
                richContent: '<ul><li>Entangle</li></ul>',
                questions: [],
            }],
        };
        const html = envToHtml(env);
        expect(html).toContain('df-ul');
        expect(html).not.toContain('<ul>');
    });

    test('no df-feature divs when features is empty', () => {
        expect((envToHtml(baseEnv()).match(/class="df-feature"/g) ?? []).length).toBe(0);
    });
});

// ── Countdowns — explicit ─────────────────────────────────────────────────────

describe('envToHtml — explicit countdowns', () => {
    test('renders countdown section when countdowns are present', () => {
        const env = { ...baseEnv(), countdowns: [{ name: 'Storm', max: 6 }] };
        const html = envToHtml(env);
        expect(html).toContain('df-env-countdown');
        expect(html).toContain('df-env-countdown-collapse-btn');
    });

    test('no countdown section when countdowns is empty', () => {
        expect(envToHtml(baseEnv())).not.toContain('df-env-countdown-collapse-btn');
    });

    test('renders correct data attributes on clock div', () => {
        const env = { ...baseEnv(), countdowns: [{ name: 'Storm', max: 6 }] };
        const html = envToHtml(env);
        expect(html).toContain('data-countdown-name="Storm"');
        expect(html).toContain('data-max="6"');
        expect(html).toContain('data-countdown-idx="0"');
    });

    test('generates correct number of tick inputs', () => {
        const env = { ...baseEnv(), countdowns: [{ name: 'Flood', max: 4 }] };
        const html = envToHtml(env);
        expect((html.match(/class="df-env-countdown-tick"/g) ?? []).length).toBe(4);
    });

    test('renders minus and plus buttons inside the header', () => {
        const env = { ...baseEnv(), countdowns: [{ name: 'Flood', max: 4 }] };
        const html = envToHtml(env);
        expect(html).toContain('df-env-countdown-minus');
        expect(html).toContain('df-env-countdown-plus');
        expect(html).toContain('df-env-countdown-header');
    });

    test('tickboxes div is separate from the header', () => {
        const env = { ...baseEnv(), countdowns: [{ name: 'Flood', max: 4 }] };
        const html = envToHtml(env);
        expect(html).toContain('df-env-countdown-tickboxes');
        expect(html).not.toContain('df-env-countdown-controls');
    });

    test('badge shows 0/max', () => {
        const env = { ...baseEnv(), countdowns: [{ name: 'Tide', max: 8 }] };
        const html = envToHtml(env);
        expect(html).toContain('df-env-countdown-current">0<');
        expect(html).toContain('/8');
    });

    test('renders multiple clocks with incrementing idx', () => {
        const env = {
            ...baseEnv(),
            countdowns: [
                { name: 'Storm', max: 4 },
                { name: 'Flood', max: 6 },
            ],
        };
        const html = envToHtml(env);
        expect(html).toContain('data-countdown-idx="0"');
        expect(html).toContain('data-countdown-idx="1"');
    });
});

// ── Countdowns — parsed from features ────────────────────────────────────────

describe('envToHtml — countdown parsing from features', () => {
    test('feature with "Countdown (12)" auto-generates a clock', () => {
        const env = {
            ...baseEnv(),
            features: [{
                name: 'Rising Tide',
                type: 'Passive',
                cost: undefined,
                richContent: '<p>Countdown (12) until disaster.</p>',
                questions: [],
            }],
        };
        const html = envToHtml(env);
        expect(html).toContain('data-countdown-name="Rising Tide"');
        expect(html).toContain('data-max="12"');
    });

    test('extracts number from "countdown (loop 4)"', () => {
        const env = {
            ...baseEnv(),
            features: [{
                name: 'Patrol',
                type: 'Passive',
                cost: undefined,
                richContent: '<p>countdown (loop 4) before alarm.</p>',
                questions: [],
            }],
        };
        const html = envToHtml(env);
        expect(html).toContain('data-max="4"');
    });

    test('explicit countdowns are not duplicated by feature parsing', () => {
        const env = {
            ...baseEnv(),
            countdowns: [{ name: 'Storm', max: 6 }],
            features: [{
                name: 'Storm',
                type: 'Passive',
                cost: undefined,
                richContent: '<p>Countdown (6)</p>',
                questions: [],
            }],
        };
        const html = envToHtml(env);
        expect((html.match(/data-countdown-name="Storm"/g) ?? []).length).toBe(1);
    });

    test('feature without countdown pattern generates no clock', () => {
        const env = {
            ...baseEnv(),
            features: [{
                name: 'Fog',
                type: 'Passive',
                cost: undefined,
                richContent: '<p>Reduces visibility.</p>',
                questions: [],
            }],
        };
        expect(envToHtml(env)).not.toContain('df-env-countdown-collapse-btn');
    });
});
