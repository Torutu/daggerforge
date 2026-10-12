/** Marks the containers that hold Obsidian's native "Edit this block" button for a card. */
export const CARD_HOST_CLASS = "df-card-host";

/**
 * Tags the elements Obsidian puts its "Edit this block" button in (the card's
 * parent in reading view, the html embed widget in live preview) so
 * styles.css can hide the button with a plain class selector instead of
 * :has(), which forces broad selector invalidation.
 *
 * Safe to call multiple times.
 */
export function markCardHosts(card: HTMLElement): void {
	card.parentElement?.classList.add(CARD_HOST_CLASS);
	card.closest(".cm-html-embed")?.classList.add(CARD_HOST_CLASS);
}
