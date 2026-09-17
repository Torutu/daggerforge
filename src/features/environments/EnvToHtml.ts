import { CountdownClock, EnvironmentData } from "../../types/index";
import { escapeHtml, toCustomHtml } from "../../utils/richContentTransform";

const CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`;
const MINUS = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>`;
const PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
const RESET = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`;

// Finds "countdown (…)" in a feature's plain text.
// "Countdown (12)"     → { name, max: 12 }
// "Countdown (loop 4)" → { name, max: 4 }
// "Countdown (1d6)"    → { name, max: 0, dice: "1d6" }
function parseClocksFromFeatures(features: EnvironmentData["features"]): CountdownClock[] {
	const result: CountdownClock[] = [];
	for (const f of features ?? []) {
		const text = (f.richContent ?? "").replace(/<[^>]+>/g, " ");
		const parens = /countdown\s*\(([^)]*)\)/i.exec(text);
		if (!parens) continue;
		const inner = parens[1].trim();
		const diceMatch = /\d*d\d+([+-]\d+)?/i.exec(inner);
		const isLoop = /\bloop\b/i.test(inner);
		if (diceMatch) {
			result.push({ name: f.name || "Countdown", max: 0, dice: diceMatch[0], loop: isLoop });
		} else {
			const num = /\d+/.exec(inner);
			if (num) result.push({ name: f.name || "Countdown", max: parseInt(num[0], 10), loop: isLoop });
		}
	}
	return result;
}

export function envToHtml(
	env: EnvironmentData,
	wide = false,
	/** Stable id for embeds - falls back to a random UUID for legacy inline cards. */
	cardId?: string,
): string {
	const hiddenID = cardId ?? crypto.randomUUID();

	// ── Countdown section ──────────────────────────────────────────────────────
	// Explicit clocks from the form take priority; feature-parsed clocks fill in
	// any that aren't already covered (matched by name, case-insensitive).
	let countdownsHtml = "";
	const explicit = env.countdowns?.filter(c => c.name && (c.max > 0 || c.dice)) ?? [];
	const explicitNames = new Set(explicit.map(c => c.name.toLowerCase()));
	const parsed = parseClocksFromFeatures(env.features).filter(
		c => !explicitNames.has(c.name.toLowerCase())
	);
	const clocks = [...explicit, ...parsed];
	if (clocks.length > 0) {
		const clocksHtml = clocks.map((cd, idx) => {
			const isLoop = cd.loop === true || cd.name.toLowerCase().includes("loop");
			const loopAttr = isLoop ? ` data-loop="true"` : "";
			// The clock's name comes from a feature title, which can arrive from
			// an imported or shared environment record - escape before it's ever
			// concatenated into stored HTML.
			const safeName = escapeHtml(cd.name);
			if (cd.dice) {
				return `<div class="df-env-countdown" data-countdown-idx="${idx}" data-max="0" data-dice-max="${cd.dice}" data-countdown-name="${safeName}"${loopAttr}>
<div class="df-env-countdown-header">
<span class="df-env-countdown-name-label">${safeName}</span>
<span class="df-env-countdown-badge">${cd.dice}</span>
</div>
<button class="df-env-countdown-dice-roll" data-dice-expr="${cd.dice}" aria-label="Roll ${cd.dice}">Roll ${cd.dice}</button>
</div>`;
			}
			const ticks = Array.from({ length: cd.max }, () =>
				`<input type="checkbox" class="df-env-countdown-tick" />`
			).join("");
			const resetBtn = isLoop ? `<button class="df-env-countdown-reset-btn" aria-label="Reset">${RESET}</button>` : "";
			return `<div class="df-env-countdown" data-countdown-idx="${idx}" data-max="${cd.max}" data-countdown-name="${safeName}"${loopAttr}>
<div class="df-env-countdown-header">
<button class="df-env-countdown-minus" aria-label="Decrease">${MINUS}</button>
<span class="df-env-countdown-name-label">${safeName}</span>
<span class="df-env-countdown-badge"><span class="df-env-countdown-current">0</span>/${cd.max}</span>
<button class="df-env-countdown-plus" aria-label="Increase">${PLUS}</button>
${resetBtn}</div>
<div class="df-env-countdown-tickboxes">${ticks}</div>
</div>`;
		}).join("");

		countdownsHtml = `<button class="df-env-countdown-collapse-btn" aria-label="Toggle countdowns">${CHEVRON}</button>
<div class="df-env-countdowns-section"><div class="df-env-countdowns-inner">${clocksHtml}</div></div>`;
	}

	// ── Regular features ───────────────────────────────────────────────────────
	// Every interpolated field below is free text that can arrive from an
	// imported or shared environment record, not just this vault's own
	// editor - escape before any of it is concatenated into stored HTML.
	const featuresHTML = (env.features || [])
		.map((f) => {
			const safeFeatName = escapeHtml(f.name);
			const safeFeatType = escapeHtml(f.type);
			const safeFeatCost = f.cost ? escapeHtml(f.cost) : "";
			const costHTML = safeFeatCost ? `<span class="df-env-feat-cost">${safeFeatCost}</span>` : "";
			const questionsHTML = f.questions?.length
				? `<div class="df-env-questions">${f.questions.map(q => `<div class="df-env-question">${escapeHtml(q)}</div>`).join("")}</div>`
				: "";
			return `
<div class="df-feature" data-feature-name="${safeFeatName}" data-feature-type="${safeFeatType}" data-feature-cost="${safeFeatCost}">
<div class="df-env-feat-name-type">
<span class="df-env-feat-name">${safeFeatName}</span> - <span class="df-env-feat-type">${safeFeatType}:</span> ${costHTML}
</div>
<div class="df-env-feat-richcontent">${toCustomHtml(f.richContent)}</div>
${questionsHTML}
</div>`;
		})
		.join("");

	const safeName = escapeHtml(env.name);
	const safeTier = escapeHtml(env.tier);
	const safeType = escapeHtml(env.type);
	const safeDesc = escapeHtml(env.desc);
	const safeImpulse = escapeHtml(env.impulse || "");
	const safeDifficulty = escapeHtml(env.difficulty || "");
	const safePotentialAdversaries = escapeHtml(env.potentialAdversaries || "");
	const safeSource = escapeHtml(env.source || "core");

	return `
<section class="df-env-card-outer${wide ? ' df-card--wide' : ''}">
<div class="df-env-card-inner">
<button class="df-wide-toggle-btn" data-edit-mode-only="true" aria-label="Toggle wide card"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></button>
<button class="df-env-edit-button" data-edit-mode-only="true" aria-label="Edit" id="${hiddenID}"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
${countdownsHtml}<div class="df-env-name" id="${hiddenID}">${safeName}</div>
<div class="df-env-feat-tier-type">Tier ${safeTier} ${safeType} <span class="df-source-badge-${safeSource.toLowerCase()}">${safeSource.toLowerCase()}</span></div>
<p class="df-env-desc">${safeDesc}</p>
<p class="df-env-impulse-line"><span class="df-env-impulse-label">Impulse:</span> ${safeImpulse}</p>
<div class="df-env-card-diff-pot">
<p class="df-env-diff-line"><span class="df-bold-title">Difficulty</span>: ${safeDifficulty}</p>
<p class="df-env-adv-line"><span class="df-bold-title">Potential Adversaries</span>: ${safePotentialAdversaries}</p>
</div>
<div class="df-features-section">
<h3 class="df-features-heading">Features</h3>${featuresHTML}
</div>
</div>
</section>
`.trim();
}
