/**
 * @jest-environment jsdom
 *
 * collapseState.test.ts
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
    handleCountdownClick,
    handleCountdownTickChange,
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

// HP ticks go inside .df-hp-tickboxes, stress inside .df-stress-tickboxes —
// required by handleTickChange which calls closest('.df-hp-tickboxes, .df-stress-tickboxes').
function addTickboxes(card: HTMLElement, hp: number, stress: number): HTMLInputElement[] {
    const boxes: HTMLInputElement[] = [];

    const hpRow = document.createElement('div');
    hpRow.className = 'df-hp-tickboxes';
    for (let i = 0; i < hp; i++) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'df-hp-tickbox';
        hpRow.appendChild(cb);
        boxes.push(cb);
    }
    card.appendChild(hpRow);

    const stressRow = document.createElement('div');
    stressRow.className = 'df-stress-tickboxes';
    for (let i = 0; i < stress; i++) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'df-stress-tickbox';
        stressRow.appendChild(cb);
        boxes.push(cb);
    }
    card.appendChild(stressRow);

    return boxes;
}

function makeClockInCard(
    card: HTMLElement,
    opts: { name?: string; max?: number; idx?: string } = {},
): { clock: HTMLElement; ticks: HTMLInputElement[]; plus: HTMLButtonElement; minus: HTMLButtonElement } {
    const { name = 'Storm', max = 4, idx = '0' } = opts;

    const clock = document.createElement('div');
    clock.className = 'df-env-countdown';
    clock.dataset.countdownIdx = idx;
    clock.dataset.max = String(max);
    clock.dataset.countdownName = name;

    const header = document.createElement('div');
    header.className = 'df-env-countdown-header';

    const minus = document.createElement('button');
    minus.className = 'df-env-countdown-minus';

    const plus = document.createElement('button');
    plus.className = 'df-env-countdown-plus';

    const badge = document.createElement('span');
    badge.className = 'df-env-countdown-badge';
    const current = document.createElement('span');
    current.className = 'df-env-countdown-current';
    current.textContent = '0';
    badge.appendChild(current);

    header.appendChild(minus);
    header.appendChild(document.createElement('span'));
    header.appendChild(badge);
    header.appendChild(plus);
    clock.appendChild(header);

    const tickboxes = document.createElement('div');
    tickboxes.className = 'df-env-countdown-tickboxes';
    const ticks: HTMLInputElement[] = [];
    for (let i = 0; i < max; i++) {
        const tick = document.createElement('input');
        tick.type = 'checkbox';
        tick.className = 'df-env-countdown-tick';
        tickboxes.appendChild(tick);
        ticks.push(tick);
    }
    clock.appendChild(tickboxes);
    card.appendChild(clock);

    return { clock, ticks, plus, minus };
}

function fireChange(cb: HTMLInputElement, handler: (e: Event) => void): void {
    const evt = new Event('change');
    Object.defineProperty(evt, 'target', { value: cb });
    handler(evt);
}

beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
});

// ── Collapse state ────────────────────────────────────────────────────────────

describe('saveCollapseState', () => {
    test('writes "1" to storage when card is expanded', () => {
        const card = makeAdvCard('a1', { expanded: true });
        saveCollapseState(card);
        expect(localStorage.getItem('df-adv-collapse:a1')).toBe('1');
    });

    test('removes key when card is not expanded', () => {
        localStorage.setItem('df-adv-collapse:a2', '1');
        const card = makeAdvCard('a2');
        saveCollapseState(card);
        expect(localStorage.getItem('df-adv-collapse:a2')).toBeNull();
    });

    test('does not throw when card has no h2', () => {
        const card = document.createElement('section');
        card.classList.add('df-card-outer');
        expect(() => saveCollapseState(card)).not.toThrow();
    });
});

describe('restoreCollapseState', () => {
    test('adds df-expanded when key exists in storage', () => {
        localStorage.setItem('df-adv-collapse:a3', '1');
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
        expect(localStorage.getItem('df-card-wide:a10')).toBe('1');
    });

    test('removes key when card is not wide', () => {
        localStorage.setItem('df-card-wide:a11', '1');
        const card = makeAdvCard('a11');
        saveWideState(card);
        expect(localStorage.getItem('df-card-wide:a11')).toBeNull();
    });
});

describe('restoreWideState', () => {
    test('adds df-card--wide when key exists', () => {
        localStorage.setItem('df-card-wide:a12', '1');
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
        localStorage.setItem('df-card-wide:e01', '1');
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
        expect(boxes[0].checked).toBe(true);
    });

    test('restoreTickState bails early without df-card-outer', () => {
        const card = document.createElement('section');
        expect(() => restoreTickState(card)).not.toThrow();
    });
});

// ── handleTickChange — fill-bar logic ─────────────────────────────────────────

describe('handleTickChange', () => {
    test('saves tick state on change', () => {
        const card = makeAdvCard('a30');
        const boxes = addTickboxes(card, 2, 1);
        boxes[0].checked = true;
        fireChange(boxes[0], handleTickChange);
        expect(localStorage.getItem('df-adv-ticks:a30')).not.toBeNull();
    });

    test('does nothing when target is not a tickbox', () => {
        const card = makeAdvCard('a31');
        const btn = card.querySelector('.df-adv-collapse-btn') as HTMLElement;
        const evt = new Event('change');
        Object.defineProperty(evt, 'target', { value: btn });
        expect(() => handleTickChange(evt)).not.toThrow();
        expect(localStorage.getItem('df-adv-ticks:a31')).toBeNull();
    });

    test('clicking unchecked HP tick N fills ticks 0..N', () => {
        const card = makeAdvCard('a32');
        const boxes = addTickboxes(card, 5, 0);
        boxes[3].checked = true; // simulate browser checking tick index 3
        fireChange(boxes[3], handleTickChange);
        expect(boxes[0].checked).toBe(true);
        expect(boxes[1].checked).toBe(true);
        expect(boxes[2].checked).toBe(true);
        expect(boxes[3].checked).toBe(true);
        expect(boxes[4].checked).toBe(false);
    });

    test('clicking a middle HP tick trims fill to that position', () => {
        const card = makeAdvCard('a33');
        const boxes = addTickboxes(card, 5, 0);
        boxes.slice(0, 5).forEach(b => (b.checked = true)); // fill=5
        boxes[1].checked = false; // simulate browser unchecking tick index 1
        fireChange(boxes[1], handleTickChange);
        expect(boxes[0].checked).toBe(true);
        expect(boxes[1].checked).toBe(true); // re-checked: trim to 2
        expect(boxes[2].checked).toBe(false);
        expect(boxes[3].checked).toBe(false);
        expect(boxes[4].checked).toBe(false);
    });

    test('clicking the last HP tick shrinks fill by 1', () => {
        const card = makeAdvCard('a34');
        const boxes = addTickboxes(card, 4, 0);
        boxes.slice(0, 4).forEach(b => (b.checked = true)); // fill=4
        boxes[3].checked = false; // simulate browser unchecking last tick
        fireChange(boxes[3], handleTickChange);
        expect(boxes[0].checked).toBe(true);
        expect(boxes[1].checked).toBe(true);
        expect(boxes[2].checked).toBe(true);
        expect(boxes[3].checked).toBe(false);
    });

    test('fill-bar works independently on stress row', () => {
        const card = makeAdvCard('a35');
        addTickboxes(card, 0, 4);
        const stressBoxes = Array.from(
            card.querySelectorAll<HTMLInputElement>('.df-stress-tickbox'),
        );
        stressBoxes[2].checked = true; // simulate checking index 2
        fireChange(stressBoxes[2], handleTickChange);
        expect(stressBoxes[0].checked).toBe(true);
        expect(stressBoxes[1].checked).toBe(true);
        expect(stressBoxes[2].checked).toBe(true);
        expect(stressBoxes[3].checked).toBe(false);
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

// ── handleCountdownClick — + / - buttons ─────────────────────────────────────

describe('handleCountdownClick — plus/minus', () => {
    test('plus checks the first unchecked tick', () => {
        const card = makeEnvCard('e60');
        const { ticks, plus } = makeClockInCard(card, { max: 4 });
        handleCountdownClick({ target: plus } as unknown as MouseEvent);
        expect(ticks[0].checked).toBe(true);
        expect(ticks[1].checked).toBe(false);
    });

    test('plus advances from current fill', () => {
        const card = makeEnvCard('e61');
        const { ticks, plus } = makeClockInCard(card, { max: 4 });
        ticks[0].checked = true;
        ticks[1].checked = true;
        handleCountdownClick({ target: plus } as unknown as MouseEvent);
        expect(ticks[2].checked).toBe(true);
        expect(ticks[3].checked).toBe(false);
    });

    test('minus unchecks the last checked tick', () => {
        const card = makeEnvCard('e62');
        const { ticks, minus } = makeClockInCard(card, { max: 4 });
        ticks[0].checked = true;
        ticks[1].checked = true;
        handleCountdownClick({ target: minus } as unknown as MouseEvent);
        expect(ticks[1].checked).toBe(false);
        expect(ticks[0].checked).toBe(true);
    });

    test('plus does nothing when all ticks are filled', () => {
        const card = makeEnvCard('e63');
        const { ticks, plus } = makeClockInCard(card, { max: 3 });
        ticks.forEach(t => (t.checked = true));
        handleCountdownClick({ target: plus } as unknown as MouseEvent);
        expect(ticks.every(t => t.checked)).toBe(true);
    });

    test('works when card is df-card-outer (adversary)', () => {
        const card = makeAdvCard('a60');
        const { ticks, plus } = makeClockInCard(card, { max: 3 });
        handleCountdownClick({ target: plus } as unknown as MouseEvent);
        expect(ticks[0].checked).toBe(true);
    });

    test('does nothing when target is outside a countdown button', () => {
        const card = makeEnvCard('e64');
        makeClockInCard(card, { max: 3 });
        expect(() =>
            handleCountdownClick({ target: card } as unknown as MouseEvent),
        ).not.toThrow();
    });
});

describe('handleCountdownClick — collapse button', () => {
    test('toggles df-countdown-collapsed on the env card', () => {
        const card = makeEnvCard('e70');
        const btn = document.createElement('button');
        btn.className = 'df-env-countdown-collapse-btn';
        card.appendChild(btn);
        handleCountdownClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-countdown-collapsed')).toBe(true);
        handleCountdownClick({ target: btn } as unknown as MouseEvent);
        expect(card.classList.contains('df-countdown-collapsed')).toBe(false);
    });

    test('persists collapse state to localStorage', () => {
        const card = makeEnvCard('e71');
        const btn = document.createElement('button');
        btn.className = 'df-env-countdown-collapse-btn';
        card.appendChild(btn);
        handleCountdownClick({ target: btn } as unknown as MouseEvent);
        expect(localStorage.getItem('df-env-countdown-open:e71')).toBe('0');
    });
});

// ── handleCountdownTickChange — fill-bar logic ────────────────────────────────

describe('handleCountdownTickChange', () => {
    test('clicking unchecked tick N fills 0..N', () => {
        const card = makeEnvCard('e80');
        const { ticks } = makeClockInCard(card, { max: 5 });
        ticks[3].checked = true; // simulate browser checking tick index 3
        fireChange(ticks[3], handleCountdownTickChange);
        expect(ticks[0].checked).toBe(true);
        expect(ticks[1].checked).toBe(true);
        expect(ticks[2].checked).toBe(true);
        expect(ticks[3].checked).toBe(true);
        expect(ticks[4].checked).toBe(false);
    });

    test('clicking a middle checked tick trims to that position', () => {
        const card = makeEnvCard('e81');
        const { ticks } = makeClockInCard(card, { max: 5 });
        ticks.forEach(t => (t.checked = true)); // fill=5
        ticks[1].checked = false; // simulate browser unchecking index 1
        fireChange(ticks[1], handleCountdownTickChange);
        expect(ticks[0].checked).toBe(true);
        expect(ticks[1].checked).toBe(true); // re-checked: trim to 2
        expect(ticks[2].checked).toBe(false);
        expect(ticks[3].checked).toBe(false);
        expect(ticks[4].checked).toBe(false);
    });

    test('clicking the last filled tick shrinks by 1', () => {
        const card = makeEnvCard('e82');
        const { ticks } = makeClockInCard(card, { max: 4 });
        ticks.forEach(t => (t.checked = true)); // fill=4
        ticks[3].checked = false; // simulate browser unchecking last tick
        fireChange(ticks[3], handleCountdownTickChange);
        expect(ticks[0].checked).toBe(true);
        expect(ticks[1].checked).toBe(true);
        expect(ticks[2].checked).toBe(true);
        expect(ticks[3].checked).toBe(false);
    });

    test('updates the countdown display after change', () => {
        const card = makeEnvCard('e83');
        const { ticks, clock } = makeClockInCard(card, { max: 3 });
        ticks[2].checked = true;
        fireChange(ticks[2], handleCountdownTickChange);
        const current = clock.querySelector('.df-env-countdown-current') as HTMLElement;
        expect(current.textContent).toBe('3');
    });

    test('saves clock state to localStorage after change', () => {
        const card = makeEnvCard('e84');
        const { ticks } = makeClockInCard(card, { idx: '0', max: 3 });
        ticks[1].checked = true;
        fireChange(ticks[1], handleCountdownTickChange);
        expect(localStorage.getItem('df-env-countdown:e84:0')).not.toBeNull();
    });

    test('does nothing when target is not a countdown tick', () => {
        const card = makeEnvCard('e85');
        const btn = document.createElement('button');
        const evt = new Event('change');
        Object.defineProperty(evt, 'target', { value: btn });
        expect(() => handleCountdownTickChange(evt)).not.toThrow();
    });

    test('works when parent card is df-card-outer (adversary)', () => {
        const card = makeAdvCard('a80');
        const { ticks } = makeClockInCard(card, { max: 3 });
        ticks[2].checked = true;
        fireChange(ticks[2], handleCountdownTickChange);
        expect(ticks[0].checked).toBe(true);
        expect(ticks[1].checked).toBe(true);
        expect(ticks[2].checked).toBe(true);
    });
});
