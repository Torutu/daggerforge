import { setIcon } from "obsidian";

/**
 * Icon + text label inside a button or header element, built with Obsidian's
 * own icon renderer and a real text node instead of injecting an HTML string
 * (see https://docs.obsidian.md/Plugins/User+interface/HTML+elements).
 */
export function setIconLabel(el: HTMLElement, icon: string, label: string): void {
	setIcon(el, icon);
	el.createSpan({ text: label });
}
