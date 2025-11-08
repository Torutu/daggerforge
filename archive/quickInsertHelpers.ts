/**
 * Helper functions for adding quick-insert buttons to text fields
 * These buttons insert formatted text snippets into textareas
 */

/**
 * Configuration for a quick-insert button
 */
export interface QuickInsertButton {
	label: string;           // Button text (e.g., "Stress")
	insertText: string;      // Text to insert (e.g., "**Spend a Stress**")
	tooltip?: string;        // Optional tooltip on hover
}

/**
 * Default button configurations
 */
export const DEFAULT_QUICK_INSERTS: QuickInsertButton[] = [
	{
		label: "Stress",
		insertText: "**Spend a Stress**",
		tooltip: "Insert 'Spend a Stress' in bold"
	},
	{
		label: "Fear",
		insertText: "**Spend a Fear**",
		tooltip: "Insert 'Spend a Fear' in bold"
	},
	{
		label: "Hope",
		insertText: "**Spend a Hope**",
		tooltip: "Insert 'Spend a Hope' in bold"
	},
	{
		label: "Action",
		insertText: "**Action:**",
		tooltip: "Insert 'Action:' in bold"
	},
	{
		label: "Reaction",
		insertText: "**Reaction:**",
		tooltip: "Insert 'Reaction:' in bold"
	}
];

/**
 * Creates a toolbar with quick-insert buttons above a textarea
 * 
 * @param textarea - The textarea element to attach buttons to
 * @param buttons - Array of button configurations (defaults to DEFAULT_QUICK_INSERTS)
 * @param containerClass - Optional CSS class for the button container
 * @returns The container element with the buttons
 */
export function createQuickInsertToolbar(
	textarea: HTMLTextAreaElement,
	buttons: QuickInsertButton[] = DEFAULT_QUICK_INSERTS,
	containerClass: string = "df-quick-insert-toolbar"
): HTMLElement {
	const toolbar = document.createElement("div");
	toolbar.classList.add(containerClass);

	buttons.forEach(config => {
		const button = document.createElement("button");
		button.textContent = config.label;
		button.classList.add("df-quick-insert-btn");
		button.type = "button"; // Prevent form submission
		
		if (config.tooltip) {
			button.title = config.tooltip;
		}

		button.addEventListener("click", (e) => {
			e.preventDefault();
			insertTextAtCursor(textarea, config.insertText);
		});

		toolbar.appendChild(button);
	});

	return toolbar;
}

/**
 * Inserts text at the current cursor position in a textarea
 * If text is selected, it replaces the selection
 * 
 * @param textarea - The textarea element
 * @param text - The text to insert
 */
export function insertTextAtCursor(
	textarea: HTMLTextAreaElement,
	text: string
): void {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const currentValue = textarea.value;

	// Insert text at cursor position
	const newValue = 
		currentValue.substring(0, start) + 
		text + 
		currentValue.substring(end);

	textarea.value = newValue;

	// Set cursor position after inserted text
	const newCursorPos = start + text.length;
	textarea.setSelectionRange(newCursorPos, newCursorPos);

	// Focus back on textarea
	textarea.focus();

	// Trigger input event so any listeners know the value changed
	textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Creates a quick-insert toolbar with custom buttons
 * 
 * @param textarea - The textarea element
 * @param customButtons - Custom button configurations
 * @returns The toolbar element
 */
export function createCustomToolbar(
	textarea: HTMLTextAreaElement,
	customButtons: QuickInsertButton[]
): HTMLElement {
	return createQuickInsertToolbar(textarea, customButtons);
}

/**
 * Adds quick-insert functionality to an existing textarea
 * Inserts the toolbar directly before the textarea in the DOM
 * 
 * @param textarea - The textarea element
 * @param buttons - Button configurations (optional)
 * @returns The created toolbar element
 */
export function addQuickInsertToTextarea(
	textarea: HTMLTextAreaElement,
	buttons?: QuickInsertButton[]
): HTMLElement {
	const toolbar = createQuickInsertToolbar(textarea, buttons);
	
	// Insert toolbar before the textarea
	if (textarea.parentElement) {
		textarea.parentElement.insertBefore(toolbar, textarea);
	}
	
	return toolbar;
}
