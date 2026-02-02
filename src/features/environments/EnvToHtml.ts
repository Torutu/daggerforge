import { EnvironmentData } from "../../types/index";	

export function envToHtml(env: EnvironmentData): string {
	const hiddenID = crypto.randomUUID();
	const featuresHTML = (env.features || [])
		.map((f) => {
			const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

			const bulletsHTML = f.bullets && f.bullets.length
				? `<ul class="df-env-bullet">${f.bullets
						.map((b) => `<li class="df-env-bullet-item">${b}</li>`)
						.join("")}</ul>`
				: "";

			const textHTML = f.text;

			const textAfterHTML = f.textAfter;
			const questionsHTML = f.questions?.length
				? `<div class="df-env-questions">${f.questions.map((q) => `<div class="df-env-question">${q}</div>`).join("")}</div>`
				: "";

			return `
<div class="df-feature" data-feature-name="${f.name}" data-feature-type="${f.type}" data-feature-cost="${f.cost || ''}">
<div class="df-env-feat-name-type">
<span class="df-env-feat-name">${f.name}</span> - <span class="df-env-feat-type">${f.type}:</span> ${costHTML}
<div class="df-env-feat-text">${textHTML}</div>
</div>
${bulletsHTML}${textAfterHTML ? `<div id="textafter" class="df-env-feat-text">${textAfterHTML}</div>` : ""}${questionsHTML}
</div>`;
		})
		.join("");
	return `
<section class="df-env-card-outer">
<div class="df-env-card-inner">
<button class="df-env-edit-button" data-edit-mode-only="true" data-tooltip="duplicate & edit" aria-label="duplicate & edit" id="${hiddenID}">📝</button>
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
