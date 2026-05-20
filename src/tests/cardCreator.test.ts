/**
 * @jest-environment jsdom
 *
 * cardCreator.test.ts
 *
 * Tests for the adversary and environment creator/editor modals.
 *
 * Strategy: bypass form rendering entirely. Both modals store their inputs
 * in `this.inputs` (a dict of HTMLInputElement / HTMLSelectElement /
 * HTMLTextAreaElement) and read them in `readFormValues()`. We inject mock
 * elements directly via `(modal as any).inputs` so we never need to render
 * the full Obsidian form or run Tiptap.
 *
 * `handleSubmit()` is private — we call it via `(modal as any).handleSubmit()`.
 * `close()` is mocked on each instance to prevent `onClose()` side-effects.
 */

import { AdversaryModal } from '../features/adversaries/components/AdvModal';
import { EnvironmentModal } from '../features/environments/components/EnvModal';

// ── Obsidian DOM + crypto polyfills ────────────────────────────────────────

beforeAll(() => {
    // Obsidian adds .empty() to every HTMLElement; jsdom doesn't have it
    Object.defineProperty(HTMLElement.prototype, 'empty', {
        configurable: true,
        value() { this.innerHTML = ''; },
    });

    let counter = 0;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
        writable: true,
        configurable: true,
        value: () => `mock-uuid-${++counter}-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
    });
});

afterAll(() => {
    delete (globalThis.crypto as any).randomUUID;
    delete (HTMLElement.prototype as any).empty;
});

// ── Helpers ────────────────────────────────────────────────────────────────

function inp(value: string): HTMLInputElement {
    const el = document.createElement('input');
    el.value = value;
    return el;
}

function sel(value: string): HTMLSelectElement {
    const el = document.createElement('select');
    const opt = document.createElement('option');
    opt.value = value;
    opt.selected = true;
    el.appendChild(opt);
    return el;
}

function ta(value: string): HTMLTextAreaElement {
    const el = document.createElement('textarea');
    el.value = value;
    return el;
}

function mockRichEditor(html = '') {
    return { getHTML: () => html, destroy: jest.fn() };
}

function mockPlugin() {
    return {
        app: {
            workspace: {
                getMostRecentLeaf: () => null,
                getLeavesOfType: () => [],
            },
        },
        lastMainLeaf: null,
        dataManager: {
            addAdversary: jest.fn().mockResolvedValue(undefined),
            addEnvironment: jest.fn().mockResolvedValue(undefined),
        },
        savedInputStateAdv: {} as any,
        savedInputStateEnv: {} as any,
    } as any;
}

function advInputs(overrides: Record<string, string> = {}) {
    const defaults: Record<string, string> = {
        name:            'Goblin Scout',
        tier:            '1',
        type:            'Minion',
        desc:            'A sneaky creature.',
        motives:         'Steal and flee',
        difficulty:      '10',
        thresholdMajor:  '6',
        thresholdSevere: '12',
        hp:              '3',
        stress:          '2',
        atk:             '+2',
        weaponName:      'Dagger',
        weaponRange:     'Very Close',
        weaponDamage:    '1d6+1',
        xp:              '',
        count:           '1',
        hordeMembers:    '',
    };
    const vals = { ...defaults, ...overrides };
    return Object.fromEntries(
        Object.entries(vals).map(([k, v]) =>
            ['tier', 'type', 'weaponRange'].includes(k) ? [k, sel(v)] : [k, inp(v)]
        )
    );
}

function envInputs(overrides: Record<string, string> = {}) {
    const defaults: Record<string, string> = {
        name:                  'Whispering Bog',
        tier:                  '2',
        type:                  'Exploration',
        desc:                  'A fog-laden marsh.',
        impulse:               'Drag under',
        difficulty:            '12',
        potentialAdversaries:  'Bog Witch',
    };
    const vals = { ...defaults, ...overrides };
    return Object.fromEntries(
        Object.entries(vals).map(([k, v]) =>
            ['tier', 'type'].includes(k) ? [k, sel(v)] : [k, ta(v)]
        )
    );
}

/** Inject all private state into a modal and mock close() to be a no-op. */
function wireAdvModal(modal: AdversaryModal, opts: {
    inputs?: Record<string, HTMLElement>;
    features?: any[];
    destination?: any;
} = {}) {
    (modal as any).inputs            = opts.inputs      ?? advInputs();
    (modal as any).features          = opts.features    ?? [];
    (modal as any).featureContainer  = document.createElement('div');
    (modal as any).insertDestination = opts.destination ?? { kind: 'none', canvas: null, leaf: null };
    modal.close = jest.fn();
}

function wireEnvModal(modal: EnvironmentModal, opts: {
    inputs?: Record<string, HTMLElement>;
    features?: any[];
    destination?: any;
} = {}) {
    (modal as any).inputs            = opts.inputs      ?? envInputs();
    (modal as any).features          = opts.features    ?? [];
    (modal as any).featureContainer  = document.createElement('div');
    (modal as any).insertDestination = opts.destination ?? { kind: 'none', canvas: null, leaf: null };
    modal.close = jest.fn();
}

// ── AdversaryModal — edit mode ──────────────────────────────────────────────

describe('AdversaryModal — edit mode', () => {

    test('onEditUpdate receives HTML that contains the card name', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal);
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        expect(cb).toHaveBeenCalledTimes(1);
        const [html] = cb.mock.calls[0];
        expect(html).toContain('Goblin Scout');
    });

    test('onEditUpdate receives HTML with tier, type, and source badge', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal);
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [html] = cb.mock.calls[0];
        expect(html).toContain('Tier 1');
        expect(html).toContain('Minion');
        expect(html).toContain('df-source-badge-custom');
    });

    test('onEditUpdate receives AdvData with correct fields', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal);
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [, data] = cb.mock.calls[0];
        expect(data.name).toBe('Goblin Scout');
        expect(data.tier).toBe('1');
        expect(data.type).toBe('Minion');
        expect(data.hp).toBe('3');
        expect(data.stress).toBe('2');
        expect(data.source).toBe('custom');
    });

    test('close() is called after onEditUpdate', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal);
        modal.onEditUpdate = jest.fn();

        await (modal as any).handleSubmit();

        expect(modal.close).toHaveBeenCalledTimes(1);
    });

    test('Horde type is normalised to "Horde (5/HP)" in HTML and data', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal, {
            inputs: advInputs({ type: 'Horde', hordeMembers: '5' }),
        });
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [html, data] = cb.mock.calls[0];
        expect(data.type).toBe('Horde (5/HP)');
        expect(html).toContain('Horde (5/HP)');
    });

    test('Horde with 0 members does not rewrite the type', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal, {
            inputs: advInputs({ type: 'Horde', hordeMembers: '0' }),
        });
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [, data] = cb.mock.calls[0];
        expect(data.type).toBe('Horde');
    });

    test('features appear in HTML and AdvData', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal, {
            features: [{
                nameEl:     inp('Pack Tactics'),
                typeEl:     sel('Passive'),
                costEl:     sel(''),
                richEditor: mockRichEditor('<p>Flanking bonus.</p>'),
            }],
        });
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [html, data] = cb.mock.calls[0];
        expect(html).toContain('Pack Tactics');
        expect(html).toContain('Passive');
        expect(data.features).toHaveLength(1);
        expect(data.features[0].name).toBe('Pack Tactics');
        expect(data.features[0].richContent).toContain('Flanking bonus');
    });

    test('multiple features all appear in data', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal, {
            features: [
                { nameEl: inp('Alpha'), typeEl: sel('Passive'), costEl: sel(''), richEditor: mockRichEditor('') },
                { nameEl: inp('Beta'),  typeEl: sel('Action'),  costEl: sel('2'), richEditor: mockRichEditor('') },
            ],
        });
        modal.onEditUpdate = jest.fn();

        await (modal as any).handleSubmit();

        const [, data] = (modal.onEditUpdate as jest.Mock).mock.calls[0];
        expect(data.features).toHaveLength(2);
        expect(data.features[0].name).toBe('Alpha');
        expect(data.features[1].name).toBe('Beta');
        expect(data.features[1].cost).toBe('2');
    });

    test('wide=false produces no df-card--wide class', async () => {
        const modal = new AdversaryModal(mockPlugin(), null);
        wireAdvModal(modal);
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [html] = cb.mock.calls[0];
        expect(html).not.toContain('df-card--wide');
    });
});

// ── AdversaryModal — create mode ───────────────────────────────────────────

describe('AdversaryModal — create mode (markdown)', () => {
    function makeMarkdownDestination() {
        const editor = { replaceSelection: jest.fn() };
        const destination = { kind: 'markdown', canvas: null, leaf: { view: { editor } } };
        return { editor, destination };
    }

    test('dataManager.addAdversary is called with the assembled data', async () => {
        const plugin = mockPlugin();
        const { editor, destination } = makeMarkdownDestination();
        const modal = new AdversaryModal(plugin, editor as any);
        wireAdvModal(modal, { destination });

        await (modal as any).handleSubmit();

        expect(plugin.dataManager.addAdversary).toHaveBeenCalledTimes(1);
        const saved = plugin.dataManager.addAdversary.mock.calls[0][0];
        expect(saved.name).toBe('Goblin Scout');
        expect(saved.source).toBe('custom');
    });

    test('editor.replaceSelection is called with HTML containing the card name', async () => {
        const plugin = mockPlugin();
        const { editor, destination } = makeMarkdownDestination();
        const modal = new AdversaryModal(plugin, editor as any);
        wireAdvModal(modal, { destination });

        await (modal as any).handleSubmit();

        expect(editor.replaceSelection).toHaveBeenCalledTimes(1);
        const inserted = editor.replaceSelection.mock.calls[0][0];
        expect(inserted).toContain('Goblin Scout');
    });

    test('does not call onEditUpdate when not set', async () => {
        const plugin = mockPlugin();
        const { editor, destination } = makeMarkdownDestination();
        const modal = new AdversaryModal(plugin, editor as any);
        wireAdvModal(modal, { destination });

        // onEditUpdate is not set — should NOT throw
        await expect((modal as any).handleSubmit()).resolves.not.toThrow();
        expect(plugin.dataManager.addAdversary).toHaveBeenCalled();
    });
});

// ── EnvironmentModal — edit mode ────────────────────────────────────────────

describe('EnvironmentModal — edit mode', () => {

    test('onEditUpdate receives HTML that contains the env name', async () => {
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal);
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        expect(cb).toHaveBeenCalledTimes(1);
        const [html] = cb.mock.calls[0];
        expect(html).toContain('Whispering Bog');
    });

    test('onEditUpdate receives EnvironmentData with correct fields', async () => {
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal);
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [, data] = cb.mock.calls[0];
        expect(data.name).toBe('Whispering Bog');
        expect(data.tier).toBe('2');
        expect(data.type).toBe('Exploration');
        expect(data.impulse).toBe('Drag under');
        expect(data.difficulty).toBe('12');
        expect(data.source).toBe('custom');
    });

    test('HTML contains tier and type', async () => {
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal);
        modal.onEditUpdate = jest.fn();

        await (modal as any).handleSubmit();

        const [html] = (modal.onEditUpdate as jest.Mock).mock.calls[0];
        expect(html).toContain('Tier 2');
        expect(html).toContain('Exploration');
    });

    test('HTML contains impulse and difficulty', async () => {
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal);
        modal.onEditUpdate = jest.fn();

        await (modal as any).handleSubmit();

        const [html] = (modal.onEditUpdate as jest.Mock).mock.calls[0];
        expect(html).toContain('Drag under');
        expect(html).toContain('12');
    });

    test('close() is called after onEditUpdate', async () => {
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal);
        modal.onEditUpdate = jest.fn();

        await (modal as any).handleSubmit();

        expect(modal.close).toHaveBeenCalledTimes(1);
    });

    test('features appear in HTML and EnvironmentData', async () => {
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal, {
            features: [{
                nameEl:      inp('Quicksand'),
                typeEl:      sel('Hazard'),
                costEl:      sel(''),
                richEditor:  mockRichEditor('<p>Slows movement.</p>'),
                questionEls: [],
            }],
        });
        const cb = jest.fn();
        modal.onEditUpdate = cb;

        await (modal as any).handleSubmit();

        const [html, data] = cb.mock.calls[0];
        expect(html).toContain('Quicksand');
        expect(data.features).toHaveLength(1);
        expect(data.features[0].name).toBe('Quicksand');
        expect(data.features[0].type).toBe('Hazard');
        expect(data.features[0].richContent).toContain('Slows movement');
    });

    test('feature questions appear in HTML', async () => {
        const q1 = ta('What lurks here?');
        const modal = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal, {
            features: [{
                nameEl:      inp('Oracle Pool'),
                typeEl:      sel('Passive'),
                costEl:      undefined,
                richEditor:  mockRichEditor(''),
                questionEls: [q1],
            }],
        });
        modal.onEditUpdate = jest.fn();

        await (modal as any).handleSubmit();

        const [html] = (modal.onEditUpdate as jest.Mock).mock.calls[0];
        expect(html).toContain('What lurks here?');
    });

    test('different name produces different HTML', async () => {
        const modal1 = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal1, { inputs: envInputs({ name: 'Frozen Tundra' }) });
        modal1.onEditUpdate = jest.fn();
        await (modal1 as any).handleSubmit();

        const modal2 = new EnvironmentModal(mockPlugin(), null);
        wireEnvModal(modal2, { inputs: envInputs({ name: 'Burning Sands' }) });
        modal2.onEditUpdate = jest.fn();
        await (modal2 as any).handleSubmit();

        const [html1] = (modal1.onEditUpdate as jest.Mock).mock.calls[0];
        const [html2] = (modal2.onEditUpdate as jest.Mock).mock.calls[0];
        expect(html1).toContain('Frozen Tundra');
        expect(html2).toContain('Burning Sands');
        expect(html1).not.toContain('Burning Sands');
    });
});

// ── EnvironmentModal — create mode ─────────────────────────────────────────

describe('EnvironmentModal — create mode (markdown)', () => {
    function makeMarkdownDestination() {
        const editor = { replaceSelection: jest.fn() };
        const destination = { kind: 'markdown', canvas: null, leaf: { view: { editor } } };
        return { editor, destination };
    }

    test('dataManager.addEnvironment is called with the assembled data', async () => {
        const plugin = mockPlugin();
        const { destination } = makeMarkdownDestination();
        const modal = new EnvironmentModal(plugin, null);
        wireEnvModal(modal, { destination });

        await (modal as any).handleSubmit();

        expect(plugin.dataManager.addEnvironment).toHaveBeenCalledTimes(1);
        const saved = plugin.dataManager.addEnvironment.mock.calls[0][0];
        expect(saved.name).toBe('Whispering Bog');
        expect(saved.source).toBe('custom');
    });

    test('editor.replaceSelection is called with HTML containing the env name', async () => {
        const plugin = mockPlugin();
        const { editor, destination } = makeMarkdownDestination();
        const modal = new EnvironmentModal(plugin, editor as any);
        wireEnvModal(modal, { destination });

        await (modal as any).handleSubmit();

        expect(editor.replaceSelection).toHaveBeenCalledTimes(1);
        const inserted = editor.replaceSelection.mock.calls[0][0];
        expect(inserted).toContain('Whispering Bog');
    });
});
