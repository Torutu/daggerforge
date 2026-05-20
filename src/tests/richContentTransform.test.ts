/**
 * @jest-environment jsdom
 *
 * richContentTransform.test.ts
 *
 * Tests for toCustomHtml() and toStandardHtml(). Both functions use
 * document.createElement / querySelectorAll / replaceWith, so jsdom is required.
 */

import { toCustomHtml, toStandardHtml } from '../utils/richContentTransform';

// ── toCustomHtml ──────────────────────────────────────────────────────────────

describe('toCustomHtml', () => {
    it('converts <ul><li> to df-ul / df-li divs', () => {
        const out = toCustomHtml('<ul><li>Alpha</li><li>Beta</li></ul>');
        expect(out).toContain('class="df-ul"');
        expect(out).toContain('class="df-li"');
        expect(out).not.toMatch(/<ul/);
        expect(out).not.toMatch(/<li/);
        expect(out).toContain('Alpha');
        expect(out).toContain('Beta');
    });

    it('converts <ol><li> to df-ol / df-li divs', () => {
        const out = toCustomHtml('<ol><li>One</li><li>Two</li></ol>');
        expect(out).toContain('class="df-ol"');
        expect(out).toContain('class="df-li"');
        expect(out).not.toMatch(/<ol/);
        expect(out).not.toMatch(/<li/);
    });

    it('handles mixed ul and ol in the same string', () => {
        const out = toCustomHtml('<ul><li>A</li></ul><ol><li>1</li></ol>');
        expect(out).toContain('class="df-ul"');
        expect(out).toContain('class="df-ol"');
    });

    it('passes plain text through unchanged', () => {
        expect(toCustomHtml('Just plain text')).toBe('Just plain text');
    });

    it('handles empty string', () => {
        expect(toCustomHtml('')).toBe('');
    });

    it('preserves text content of list items', () => {
        const out = toCustomHtml('<ul><li>Keep me</li></ul>');
        expect(out).toContain('Keep me');
    });
});

// ── toStandardHtml ────────────────────────────────────────────────────────────

describe('toStandardHtml', () => {
    it('converts df-ul / df-li back to <ul> / <li>', () => {
        const input = '<div class="df-ul"><div class="df-li">Item</div></div>';
        const out = toStandardHtml(input);
        expect(out).toContain('<ul>');
        expect(out).toContain('<li>');
        expect(out).not.toContain('df-ul');
        expect(out).not.toContain('df-li');
        expect(out).toContain('Item');
    });

    it('converts df-ol / df-li back to <ol> / <li>', () => {
        const input = '<div class="df-ol"><div class="df-li">One</div></div>';
        const out = toStandardHtml(input);
        expect(out).toContain('<ol>');
        expect(out).toContain('<li>');
    });

    it('passes plain text through unchanged', () => {
        expect(toStandardHtml('No HTML here')).toBe('No HTML here');
    });

    it('handles empty string', () => {
        expect(toStandardHtml('')).toBe('');
    });
});

// ── Round-trip ────────────────────────────────────────────────────────────────

describe('round-trip', () => {
    it('toStandardHtml(toCustomHtml(ul html)) restores <ul>/<li>', () => {
        const original = '<ul><li>Alpha</li><li>Beta</li></ul>';
        const rt = toStandardHtml(toCustomHtml(original));
        expect(rt).toContain('<ul>');
        expect(rt).toContain('<li>');
        expect(rt).toContain('Alpha');
        expect(rt).toContain('Beta');
    });

    it('round-trip preserves ol', () => {
        const original = '<ol><li>One</li><li>Two</li></ol>';
        const rt = toStandardHtml(toCustomHtml(original));
        expect(rt).toContain('<ol>');
        expect(rt).toContain('One');
    });

    it('plain text is unchanged after round-trip', () => {
        const text = 'No HTML here';
        expect(toStandardHtml(toCustomHtml(text))).toBe(text);
    });
});
