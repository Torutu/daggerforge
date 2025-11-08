import { Notice } from "obsidian";

export const onEditClick = (evt: Event, cardType: string) => {
	evt.stopPropagation();

	// Get the button that was clicked
	const button = evt.target as HTMLElement;

	// Find the outer card element depending on the type
	let cardElement: HTMLElement | null = null;

	if (cardType === "env") {
		cardElement = button.closest(".df-env-card-outer");
	} else if (cardType === "adv") {
		cardElement = button.closest(".df-card-outer");
	}

	if (!cardElement) {
		// new Notice("Could not find card element!");
		return;
	}

	// Now grab the name depending on the type
	let cardName = "";
	if (cardType === "env") {
		const nameEl = cardElement.querySelector(".df-env-name");
		cardName = nameEl?.textContent?.trim() ?? "(unknown environment)";
	} else if (cardType === "adv") {
		const nameEl = cardElement.querySelector("h2");
		cardName = nameEl?.textContent?.trim() ?? "(unknown adversary)";
	}

	// new Notice(`Editing ${cardType.toUpperCase()} card: ${cardName}`);
};
