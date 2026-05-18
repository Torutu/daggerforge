import { EnvironmentData } from "../../types/index";
import { toCustomHtml } from "../../utils/richContentTransform";

export function envToHtml(env: EnvironmentData, wide = false): string {
	const hiddenID = crypto.randomUUID();
	const featuresHTML = (env.features || [])
		.map((f) => {
			const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

			const questionsHTML = f.questions?.length
				? `<div class="df-env-questions">${f.questions.map((q) => `<div class="df-env-question">${q}</div>`).join("")}</div>`
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
<p class="df-env-desc">${env.desc}</p>
<p><strong>Impulse:</strong> ${env.impulse || ""}</p>
<div class="df-env-card-diff-pot">
<p><span class="df-bold-title">Difficulty</span>: ${env.difficulty || ""}</p>
<p><span class="df-bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ""}</p>
</div>
<div class="df-features-section">
<h3>Features</h3>${featuresHTML}
</div>
</div>
</section>
`.trim();
}
