/**
 * @jest-environment jsdom
 *
 * collapseState.test.ts
 *
 * Tests for sessionStorage-backed collapse, wide, and tick state utilities.
 * Also tests handleCollapseClick (from diceBadges.ts) since it is behaviourally
 * coupled to the same card DOM structure.
 */

import {
    saveCollapseState,
    restoreCollapseState,
    saveWideState,
    restoreWideState,
    saveTickState,
    restoreTickState,
    handleTickChange,
    handleWideToggleClick,
} from '../utils/collapseState';
import { handleCollapseClick } from '../utils/diceBadges';

// ── DOM helpers ───────────────────────────────────────────────────────────────

function makeAdvCard(id: string, opts: { expanded?: boolean; wide?: boolean } = {}): HTMLElement {
    const card = document.createElement('section');
    card.classList.add('df-card-outer');
    if (opts.expanded) card.classList.add('df-expanded');
    if (opts.wide)     card.classList.add('df-card--wide');

    const h2 = document.createElement('h2');
    h2.id = id;
    card.appendChild(h2);

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'df-adv-collapse-btn';
    card.appendChild(collapseBtn);

    const wideBtn = document.createElement('button');
    wideBtn.className = 'df-wide-toggle-btn';
    card.appendChild(wideBtn);

    document.body.appendChild(card);
    return card;
}

function makeEnvCard(id: string, opts: { wide?: boolean } = {}): HTMLElement {
    const card = document.createElement('section');
    card.classList.add('df-env-card-outer');
    if (opts.wide) card.classList.add('df-card--wide');

    const nameDiv = document.createElement('div');
    nameDiv.className = 'df-env-name';
    nameDiv.id = id;
    card.appendChild(nameDiv);

    const wideBtn = document.createElement('button');
    wideBtn.className = 'df-wide-toggle-btn';
    card.appendChild(wideBtn);

    document.body.appendChild(card);
    return card;
}

function addTickboxes(card: HTMLElement, hp: number, stress: number): HTMLInputElement[] {
    const boxes: HTMLInputElement[] = [];
    for (let i = 0; i < hp; i++) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'df-hp-tickbox';
        card.appendChild(cb);
        boxes.push(cb);
    }
    for (let i = 0; i < stress; i++) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'df-stress-tickbox';
        card.appendChild(cb);
        boxes.push(cb);
    }
    return boxes;
}

beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
});

// ── Collapse state ────────────────────────────────────────────────────────────

describe('saveCollapseState', () => {
    test('writes "1" to storage when card is expanded', () => {
        const card = makeAdvCard('a1', { expanded: true });
        saveCollapseState(card);
        expect(sessionStorage.getItem('df-adv-collapse:a1')).toBe('1');
    });

    test('removes key when card is not expanded', () => {
        sessionStorage.setItem('df-adv-collapse:a2', '1');
        const card = makeAdvCard('a2');
        saveCollapseState(card);
        expect(sessionStorage.getItem('df-adv-collapse:a2')).toBeNull();
    });

    test('does not throw when card has no h2', () => {
        const card = document.createElement('section');
        card.classList.add('df-card-outer');
        expect(() => saveCollapseState(card)).not.toThrow();
    });
});

describe('restoreCollapseState', () => {
    test('adds df-expanded when key exists in storage', () => {
        sessionStorage.setItem('df-adv-collapse:a3', '1');
        const card = makeAdvCard('a3');
        restoreCollapseState(card);
        expect(card.classList.contains('df-expanded')).toBe(true);
    });

    test('removes df-expanded when key is absent', () => {
        const card = makeAdvCard('a4', { expanded: true });
        restoreCollapseState(card);
        expect(card.classList.contains('df-expanded')).toBe(false);
    });

    test('bails early if element lacks df-card-outer class', () => {
        const card = document.createElement('section');
        expect(() => restoreCollapseState(card)).not.toThrow();
        expect(card.classList.contains('df-expanded')).toBe(false);
    });
});

// ── Wide state ────────────────────────────────────────────────────────────────

describe('saveWideState', () => {
    test('writes "1" to storage when card is wide', () => {
        const card = makeAdvCard('a10', { wide: true });
        saveWideState(card);
        expect(sessionStorage.getItem('df-card-wide:a10')).toBe('1');
    });

    test('removes key when card is not wide', () => {
        sessionStorage.setItem('df-card-wide:a11', '1');
        const card = makeAdvCard('a11');
        saveWideState(card);
        expect(sessionStorage.getItem('df-card-wide:a11')).toBeNull();
    });
});

describe('restoreWideState', () => {
    test('adds df-card--wide when key exists', () => {
        sessionStorage.setItem('df-card-wide:a12', '1');
        const card = makeAdvCard('a12');
        restoreWideState(card);
        expect(card.classList.contains('df-card--wide')).toBe(true);
    });

    test('does not add df-card--wide when key is absent', () => {
        const card = makeAdvCard('a13');
        restoreWideState(card);
        expect(card.classList.contains('df-card--wide')).toBe(false);
    });

    test('works on env cards too', () => {
        sessionStorage.setItem('df-card-wide:e01', '1');
        const card = makeEnvCard('e01');
        restoreWideState(card);
        expect(card.classList.contains('df-card--wide')).toBe(true);
    });
});

// ── Tick state ────────────────────────────────────────────────────────────────

describe('saveTickState / restoreTickState', () => {
    test('saves and restores checked state correctly', () => {
        const card = makeAdvCard('a20');
        const boxes = addTickboxes(card, 3, 2);
        boxes[0].checked = true;
        boxes[2].checked = true;
        saveTickState(card);

        boxes.forEach(b => (b.checked = false));
        restoreTickState(card);

        expect(boxes[0].checked).toBe(true);
        expect(boxes[1].checked).toBe(false);
        expect(boxes[2].checked).toBe(true);
        expect(boxes[3].checked).toBe(false);
        expect(boxes[4].checked).toBe(false);
    });

    test('restoreTickState does nothing when no key exists', () => {
        const card = makeAdvCard('a21');
        const boxes = addTickboxes(card, 2, 1);
        boxes[0].checked = true;
        restoreTickState(card);
        expect(boxes[0].checked).toBe(true); // unchanged
    });

    test('restoreTickState bails early without df-card-outer', () => {
        const card = document.createElement('section');
        expect(() => restoreTickState(card)).not.toThrow();
    });
});

describe('handleTickChange', () => {
    test('saves tick state when a hp-tickbox changes inside df-card-outer', () => {
        const card = makeAdvCard('a30');
        const boxes = addTickboxes(card, 2, 1);
        boxes[0].checked = true;
        const evt = new Event('change');
        Object.defineProperty(evt, 'target', { value: boxes[0] });
        handleTickChange(evt);
        expect(sessionStorage.getItem('df-adv-ticks:a30')).not.toBeNull();
    });

    test('does nothing when target is not a tickbox', () => {
        const card = makeAdvCard('a31');
        const btn = card.querySelector('.df-adv-collapse-btn') as HTMLElement;
        const evt = new Event('change');
        Object.defineProperty(evt, 'target', { value: btn });
        expect(() => handleTickChange(evt)).not.toThrow();
        expect(sessionStorage.getItem('df-adv-ticks:a31')).toBeNull();
    });
});

// ── handleWideToggleClick ─────────────────────────────────────────────────────

describe('handleWideToggleClick', () => {
    test('adds df-card--wide when button is clicked on a narrow card', () => {
        const card = makeAdvCard('a40');
        const btn = card.querySelector('.df-wide-toggle-btn') as HTMLElement;
        handleWideToggleClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-card--wide')).toBe(true);
    });

    test('removes df-card--wide when button is clicked on a wide card', () => {
        const card = makeAdvCard('a41', { wide: true });
        const btn = card.querySelector('.df-wide-toggle-btn') as HTMLElement;
        handleWideToggleClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-card--wide')).toBe(false);
    });

    test('works on environment cards', () => {
        const card = makeEnvCard('e40');
        const btn = card.querySelector('.df-wide-toggle-btn') as HTMLElement;
        handleWideToggleClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-card--wide')).toBe(true);
    });

    test('does nothing when target is outside a toggle button', () => {
        const card = makeAdvCard('a42');
        handleWideToggleClick({ target: card } as unknown as MouseEvent);
        expect(card.classList.contains('df-card--wide')).toBe(false);
    });
});

// ── handleCollapseClick (from diceBadges.ts) ──────────────────────────────────

describe('handleCollapseClick', () => {
    test('adds df-expanded when collapse button is clicked on a collapsed card', () => {
        const card = makeAdvCard('a50');
        const btn = card.querySelector('.df-adv-collapse-btn') as HTMLElement;
        handleCollapseClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-expanded')).toBe(true);
    });

    test('removes df-expanded when button is clicked on an expanded card', () => {
        const card = makeAdvCard('a51', { expanded: true });
        const btn = card.querySelector('.df-adv-collapse-btn') as HTMLElement;
        handleCollapseClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-expanded')).toBe(false);
    });

    test('does nothing when target is outside a collapse button', () => {
        const card = makeAdvCard('a52');
        handleCollapseClick({ target: card } as unknown as MouseEvent);
        expect(card.classList.contains('df-expanded')).toBe(false);
    });
});
