import { EnvironmentData } from "../../types/index";
import { toCustomHtml } from "../../utils/richContentTransform";

const CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`;
const MINUS   = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>`;
const PLUS    = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

function parseCountdownMax(name: string, cost: string | undefined): number {
	// cost field takes priority (e.g. cost = "12")
	const fromCost = parseInt(cost ?? "", 10);
	if (!isNaN(fromCost) && fromCost > 0) return fromCost;
	// Fall back to parenthetical in name, e.g. "Countdown (12)"
	const m = name.match(/\((\d+)\)/);
	return m ? parseInt(m[1], 10) : 0;
}

export function envToHtml(env: EnvironmentData, wide = false): string {
	const hiddenID = crypto.randomUUID();

	// Separate countdown features from regular features
	const countdownFeature = (env.features || []).find(
		f => f.type?.toLowerCase() === "countdown"
	);
	const regularFeatures = (env.features || []).filter(
		f => f.type?.toLowerCase() !== "countdown"
	);

	// Build countdown section
	let countdownHtml = "";
	if (countdownFeature) {
		const max = parseCountdownMax(countdownFeature.name, countdownFeature.cost);
		if (max > 0) {
			const ticks = Array.from({ length: max }, () =>
				`<input type="checkbox" class="df-env-countdown-tick" />`
			).join("");

			countdownHtml = `
<div class="df-env-countdown-section" data-max="${max}">
<div class="df-env-countdown-header">
<button class="df-env-countdown-toggle-btn" aria-label="Toggle countdown">${CHEVRON}</button>
<span class="df-env-countdown-name">${countdownFeature.name || "Countdown"}</span>
<span class="df-env-countdown-badge"><span class="df-env-countdown-current">0</span>/${max}</span>
</div>
<div class="df-env-countdown-body"><div class="df-env-countdown-body-inner">
<div class="df-env-countdown-controls">
<button class="df-env-countdown-minus" aria-label="Decrease">${MINUS}</button>
<div class="df-env-countdown-ticks">${ticks}</div>
<button class="df-env-countdown-plus" aria-label="Increase">${PLUS}</button>
</div>
</div></div>
</div>`;
		}
	}

	// Regular features
	const featuresHTML = regularFeatures
		.map((f) => {
			const costHTML = f.cost ? `<span class="df-env-feat-cost">${f.cost}</span>` : "";
			const questionsHTML = f.questions?.length
				? `<div class="df-env-questions">${f.questions.map(q => `<div class="df-env-question">${q}</div>`).join("")}</div>`
				: "";
			return `
<div class="df-feature" data-feature-name="${f.name}" data-feature-type="${f.type}" data-feature-cost="${f.cost || ''}">
<div class="df-env-feat-name-type">
<span class="df-env-feat-name">${f.name}</span> - <span class="df-env-feat-type">${f.type}:</span> ${costHTML}
</div>
<div class="df-env-feat-richcontent">${toCustomHtml(f.richContent)}</div>
${questionsHTML}
</div>`;
		})
		.join("");

	return `
<section class="df-env-card-outer${wide ? ' df-card--wide' : ''}">
<div class="df-env-card-inner">
<button class="df-wide-toggle-btn" data-edit-mode-only="true" aria-label="Toggle wide card"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></button>
<button class="df-env-edit-button" data-edit-mode-only="true" aria-label="Edit" id="${hiddenID}"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
<div class="df-env-name" id="${hiddenID}">${env.name}</div>
<div class="df-env-feat-tier-type">Tier ${env.tier.toString()} ${env.type} <span class="df-source-badge-${(env.source || "core").toLowerCase()}">${(env.source || "core").toLowerCase()}</span></div>
${countdownHtml}
<p class="df-env-desc">${env.desc}</p>
<p class="df-env-impulse-line"><span class="df-env-impulse-label">Impulse:</span> ${env.impulse || ""}</p>
<div class="df-env-card-diff-pot">
<p class="df-env-diff-line"><span class="df-bold-title">Difficulty</span>: ${env.difficulty || ""}</p>
<p class="df-env-adv-line"><span class="df-bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ""}</p>
</div>
<div class="df-features-section">
<h3 class="df-features-heading">Features</h3>${featuresHTML}
</div>
</div>
</section>
`.trim();
}
