import { GearData, GEAR_KIND_LABELS } from "../../types/srd";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** Bolds a leading "Feature Name:" and light **bold** markers in effect text. */
function renderText(text: string): string {
	const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
	return paragraphs
		.map((para) => {
			let html = escapeHtml(para).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
			const named = html.match(/^([^:*<]{2,60}):\s+([\s\S]*)$/);
			if (named) html = `<strong>${named[1]}:</strong> ${named[2]}`;
			return `<p class="df-item-text">${html}</p>`;
		})
		.join("");
}

/**
 * Small gear card for notes and canvas. Deliberately its own class family
 * (not df-card-outer) so the adversary tick/collapse machinery ignores it.
 */
export function gearToHtml(gear: GearData): string {
	const chips = [
		GEAR_KIND_LABELS[gear.kind],
		gear.tier !== null ? `Tier ${gear.tier}` : null,
		gear.rarity,
	]
		.filter(Boolean)
		.map((chip) => `<span class="df-item-chip">${escapeHtml(String(chip))}</span>`)
		.join("");

	const meta = gear.meta ? `<p class="df-item-meta">${escapeHtml(gear.meta)}</p>` : "";
	const text = gear.text ? renderText(gear.text) : "";

	return `<section class="df-item-card df-pseudo-cut-corners">
<div class="df-item-head"><h3 class="df-item-name">${escapeHtml(gear.name)}</h3>${chips}</div>
${meta}${text}</section>`;
}
