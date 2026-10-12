/**
 * @jest-environment jsdom
 *
 * cardHosts.test.ts
 */

import { markCardHosts, CARD_HOST_CLASS } from '../utils/cardHosts';

describe('markCardHosts', () => {
    afterEach(() => {
        document.body.empty();
    });

    test("marks the card's parent (reading view block)", () => {
        const block = document.body.createDiv({ cls: 'el-div' });
        const card = block.createEl('section', { cls: 'df-card-outer' });

        markCardHosts(card);

        expect(block.classList.contains(CARD_HOST_CLASS)).toBe(true);
    });

    test('marks the enclosing html embed widget (live preview)', () => {
        const embed = document.body.createDiv({ cls: 'cm-html-embed' });
        const wrapper = embed.createDiv();
        const card = wrapper.createEl('section', { cls: 'df-env-card-outer' });

        markCardHosts(card);

        expect(embed.classList.contains(CARD_HOST_CLASS)).toBe(true);
        expect(wrapper.classList.contains(CARD_HOST_CLASS)).toBe(true);
    });

    test('does not mark unrelated ancestors', () => {
        const outer = document.body.createDiv({ cls: 'markdown-preview-sizer' });
        const block = outer.createDiv({ cls: 'el-div' });
        const card = block.createEl('section', { cls: 'df-card-outer' });

        markCardHosts(card);

        expect(outer.classList.contains(CARD_HOST_CLASS)).toBe(false);
    });

    test('is safe to call repeatedly and on a card without a parent', () => {
        const block = document.body.createDiv();
        const card = block.createEl('section', { cls: 'df-card-outer' });

        markCardHosts(card);
        markCardHosts(card);
        expect(block.className).toBe(CARD_HOST_CLASS);

        card.remove();
        expect(() => markCardHosts(card)).not.toThrow();
    });
});
