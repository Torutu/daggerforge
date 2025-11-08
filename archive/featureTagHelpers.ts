/**
 * Feature Tag Helper - Provides scalable button and tag insertion for feature descriptions
 * Uses inline styles so no CSS file needed
 */

export interface TagConfig {
	label: string;
	icon?: string;
	format: (value?: string) => string;
	tooltip?: string;
}

export interface TagButtonConfig {
	[tagName: string]: TagConfig;
}

export const defaultTags: TagButtonConfig = {
	stress: {
		label: "[Stress]",
		format: () => "**Spend a stress** ",
		tooltip: "Add 'Spend a stress' to the description",
	},
	fear: {
		label: "[Fear]",
		format: () => "**Spend a Fear** ",
		tooltip: "Add 'Spend a Fear' to the description",
	},
	hope: {
		label: "[Hope]",
		format: () => "**Spend Hope** ",
		tooltip: "Add 'Spend Hope' to the description",
	},
	bond: {
		label: "[Bond]",
		format: () => "**Spend a Bond** ",
		tooltip: "Add 'Spend a Bond' to the description",
	},
};

export function createTagButtons(
	container: HTMLElement,
	textArea: HTMLTextAreaElement,
	tags: TagButtonConfig = { stress: defaultTags.stress, fear: defaultTags.fear },
	onTagInsert?: (tagName: string, text: string) => void,
): HTMLElement {
	const buttonContainer = container.createDiv({
		cls: "df-feature-tag-button-container",
	});

	// Container inline styles
	buttonContainer.style.display = "flex";
	buttonContainer.style.gap = "6px";
	buttonContainer.style.flexWrap = "wrap";
	buttonContainer.style.marginBottom = "8px";
	buttonContainer.style.paddingBottom = "8px";
	buttonContainer.style.borderBottom = "1px solid var(--background-modifier-border)";

	Object.entries(tags).forEach(([tagName, tagConfig]) => {
		const button = buttonContainer.createEl("button", {
			text: tagConfig.label,
			attr: {
				type: "button",
				title: tagConfig.tooltip || `Insert ${tagName}`,
			},
		});

		// Inline styles
		button.style.padding = "4px 12px";
		button.style.border = "1px solid var(--background-modifier-border)";
		button.style.borderRadius = "4px";
		button.style.backgroundColor = "var(--background-secondary)";
		button.style.color = "var(--text-normal)";
		button.style.fontSize = "0.85em";
		button.style.fontWeight = "600";
		button.style.cursor = "pointer";
		button.style.transition = "all 0.2s ease";
		button.style.whiteSpace = "nowrap";

		// Hover
		button.addEventListener("mouseenter", () => {
			button.style.backgroundColor = "var(--interactive-accent)";
			button.style.color = "white";
			button.style.borderColor = "var(--interactive-accent)";
			button.style.transform = "translateY(-1px)";
			button.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
		});

		button.addEventListener("mouseleave", () => {
			button.style.backgroundColor = "var(--background-secondary)";
			button.style.color = "var(--text-normal)";
			button.style.borderColor = "var(--background-modifier-border)";
			button.style.transform = "none";
			button.style.boxShadow = "none";
		});

		button.type = "button";

		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			insertTagAtCursor(textArea, tagConfig.format(), tagName, onTagInsert);
		});
	});

	return buttonContainer;
}

export function insertTagAtCursor(
	textArea: HTMLTextAreaElement,
	text: string,
	tagName: string = "tag",
	onTagInsert?: (tagName: string, text: string) => void,
): void {
	const start = textArea.selectionStart;
	const end = textArea.selectionEnd;
	const value = textArea.value;

	const newValue =
		value.substring(0, start) + text + value.substring(end);
	textArea.value = newValue;

	const newCursorPos = start + text.length;
	textArea.setSelectionRange(newCursorPos, newCursorPos);

	textArea.dispatchEvent(new Event("input", { bubbles: true }));

	if (onTagInsert) {
		onTagInsert(tagName, text);
	}
}

export function setupFeatureDescriptionHelper(
	container: HTMLElement,
	textArea: HTMLTextAreaElement,
	customTags?: TagButtonConfig,
	onTagInsert?: (tagName: string, text: string) => void,
): HTMLElement {
	const tags = customTags
		? { ...defaultTags, ...customTags }
		: defaultTags;

	return createTagButtons(container, textArea, tags, onTagInsert);
}
