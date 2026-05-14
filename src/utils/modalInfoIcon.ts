const INFO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

const TOOLTIP_LINES = [
	"Dice — type 1d6, 2d8+3, etc. They become clickable roll buttons when the card is inserted.",
	"Keywords — hope, fear, hp, stress (any casing) are auto-colored when keyword highlighting is enabled in Settings.",
];

export function addModalInfoIcon(container: HTMLElement): void {
	const wrap = container.createDiv({ cls: "df-modal-info-wrap" });
	const icon = wrap.createDiv({ cls: "df-modal-info-icon" });
	icon.innerHTML = INFO_SVG;
	const tooltip = wrap.createDiv({ cls: "df-modal-info-tooltip" });
	TOOLTIP_LINES.forEach((line, i) => {
		if (i > 0) tooltip.createEl("br");
		if (i > 0) tooltip.createEl("br");
		tooltip.appendText(line);
	});
}
