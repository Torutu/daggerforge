/**
 * @jest-environment jsdom
 *
 * richContentTransform.test.ts
 *
 * Tests for toCustomHtml() and toStandardHtml(). Both functions build real
 * DOM (via createEl, querySelectorAll, replaceWith), so jsdom is required.
 */

import { appendHtml, escapeHtml, toCustomHtml, toStandardHtml } from '../utils/richContentTransform';

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

// ── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
    it('escapes the five HTML-significant characters', () => {
        expect(escapeHtml('<script>alert("hi")</script> & more')).toBe(
            '&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt; &amp; more',
        );
    });

    it('leaves plain text unchanged', () => {
        expect(escapeHtml('Plain feature name')).toBe('Plain feature name');
    });
});

// ── Sanitization (untrusted content: imported/shared adversary,
//    environment, and item records can carry arbitrary rich text) ────────────

describe('sanitization', () => {
    it('toCustomHtml strips <script> tags', () => {
        const out = toCustomHtml('<p>Hi</p><script>alert(1)</script>');
        expect(out).not.toContain('<script');
        expect(out).not.toContain('alert(1)');
        expect(out).toContain('Hi');
    });

    it('toCustomHtml strips inline event-handler attributes', () => {
        const out = toCustomHtml('<p onclick="alert(1)">Click me</p>');
        expect(out).not.toContain('onclick');
        expect(out).not.toContain('alert(1)');
        expect(out).toContain('Click me');
    });

    it('toCustomHtml strips onerror from an img tag (the classic non-script vector)', () => {
        const out = toCustomHtml('<p><img src="x" onerror="alert(1)"></p>');
        expect(out).not.toContain('onerror');
    });

    it('toCustomHtml strips javascript: URLs', () => {
        const out = toCustomHtml('<p><a href="javascript:alert(1)">link</a></p>');
        expect(out).not.toContain('javascript:');
    });

    it('toStandardHtml sanitizes too (fed by stored/imported content when an editor opens)', () => {
        const out = toStandardHtml('<div class="df-p" onclick="alert(1)">Hi</div>');
        expect(out).not.toContain('onclick');
    });
});

// ── Serialization (no direct markup-string properties anywhere -
//    see CLAUDE.md; this covers the XMLSerializer-based replacement) ─────────

describe('serialization', () => {
    it('toCustomHtml output never carries the XML default namespace XMLSerializer stamps on a root node', () => {
        const out = toCustomHtml('<ul><li>Alpha</li></ul>');
        expect(out).not.toContain('xmlns');
    });

    it('toStandardHtml output never carries the XML default namespace either', () => {
        const out = toStandardHtml('<div class="df-ul"><div class="df-li">Item</div></div>');
        expect(out).not.toContain('xmlns');
    });
});

// A detached container div, standing in for a real embed container - createEl
// needs a parent to call it on, so document.body briefly stands in and the
// div is detached again immediately.
function detachedDiv(): HTMLDivElement {
    const el = document.body.createDiv();
    el.remove();
    return el;
}

describe('appendHtml', () => {
    it('parses and appends the resulting nodes to the target element', () => {
        const target = detachedDiv();
        appendHtml(target, '<p>Hello</p><p>World</p>');
        expect(target.children).toHaveLength(2);
        expect(target.children[0].tagName).toBe('P');
        expect(target.textContent).toBe('HelloWorld');
    });

    it('sanitizes before appending (same untrusted-input path as the rich text editor)', () => {
        const target = detachedDiv();
        appendHtml(target, '<p onclick="alert(1)">Hi</p><script>alert(2)</script>');
        expect(target.querySelector('script')).toBeNull();
        expect(target.querySelector('p')?.getAttribute('onclick')).toBeNull();
        expect(target.textContent).toBe('Hi');
    });

    it('appends to an element that already has children, without clearing them', () => {
        const target = detachedDiv();
        target.createSpan();
        appendHtml(target, '<p>New</p>');
        expect(target.children).toHaveLength(2);
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
