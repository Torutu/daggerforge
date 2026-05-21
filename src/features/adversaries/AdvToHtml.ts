import { Feature } from "../../types/index";
import type { CountdownClock } from "../../types/environment";
import { toCustomHtml } from "../../utils/richContentTransform";

const MINUS = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>`;
const PLUS  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
const RESET = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`;

function parseClocksFromFeatures(features: Feature[]): { name: string; max: number; dice?: string; loop?: boolean }[] {
	const result: { name: string; max: number; dice?: string; loop?: boolean }[] = [];
	for (const f of features) {
		const text = (f.richContent ?? "").replace(/<[^>]+>/g, " ");
		const parens = /(?:countdown|clock)\s*\(([^)]*)\)/i.exec(text);
		if (!parens) continue;
		const inner = parens[1].trim();
		const isLoop = /\bloop\b/i.test(inner);
		const diceMatch = /\d*d\d+([+-]\d+)?/i.exec(inner);
		if (diceMatch) {
			result.push({ name: f.name || "Countdown", max: 0, dice: diceMatch[0], loop: isLoop });
		} else {
			const num = /\d+/.exec(inner);
			if (num) result.push({ name: f.name || "Countdown", max: parseInt(num[0], 10), loop: isLoop });
		}
	}
	return result;
}

export const buildCardHTML = (
	values: Record<string, string>,
	features: Feature[],
	wide = false,
	explicitCountdowns?: CountdownClock[],
): string => {
	const {
		name,
		tier,
		type,
		desc,
		motives,
		difficulty,
		thresholdMajor,
		thresholdSevere,
		hp,
		stress,
		atk,
		weaponName,
		weaponRange,
		weaponDamage,
		xp,
		count,
		source,
	} = values;

	const hptick = Number(hp) || 0;
	const stresstick = Number(stress) || 0;
	let countNum = Number(count);
	countNum = Number.isInteger(countNum) && countNum >= 1 ? countNum : 1;
	const hiddenID = crypto.randomUUID();

	const explicit = (explicitCountdowns ?? []).filter(c => c.name && (c.max > 0 || c.dice));
	const explicitNames = new Set(explicit.map(c => c.name.toLowerCase()));
	const parsed = parseClocksFromFeatures(features).filter(c => !explicitNames.has(c.name.toLowerCase()));
	const clocks = [...explicit, ...parsed];

	const hpStressRepeat = Array.from({ length: countNum }, (_, index) => {
		const hpTickboxes = Array.from(
			{ length: hptick },
			() => `
            <input type="checkbox" class="df-hp-tickbox" />
        `,
		).join("");

		const stressTickboxes = Array.from(
			{ length: stresstick },
			() => `
            <input type="checkbox" class="df-stress-tickbox" />
        `,
		).join("");

		const countdownsHtml = clocks.map((cd, clockIdx) => {
			const idx = `${index}-${clockIdx}`;
			const isLoop = cd.loop === true || cd.name.toLowerCase().includes("loop");
			const loopAttr = isLoop ? ` data-loop="true"` : "";
			if (cd.dice) {
				return `<div class="df-env-countdown" data-countdown-idx="${idx}" data-max="0" data-dice-max="${cd.dice}" data-countdown-name="${cd.name}"${loopAttr}>
<div class="df-env-countdown-header">
<span class="df-env-countdown-name-label">${cd.name}</span>
<span class="df-env-countdown-badge">${cd.dice}</span>
</div>
<button class="df-env-countdown-dice-roll" data-dice-expr="${cd.dice}" aria-label="Roll ${cd.dice}">Roll ${cd.dice}</button>
</div>`;
			}
			const ticks = Array.from({ length: cd.max }, () =>
				`<input type="checkbox" class="df-env-countdown-tick" />`
			).join("");
			const resetBtn = isLoop ? `<button class="df-env-countdown-reset-btn" aria-label="Reset">${RESET}</button>` : "";
			return `<div class="df-env-countdown" data-countdown-idx="${idx}" data-max="${cd.max}" data-countdown-name="${cd.name}"${loopAttr}>
<div class="df-env-countdown-header">
<button class="df-env-countdown-minus" aria-label="Decrease">${MINUS}</button>
<span class="df-env-countdown-name-label">${cd.name}</span>
<span class="df-env-countdown-badge"><span class="df-env-countdown-current">0</span>/${cd.max}</span>
<button class="df-env-countdown-plus" aria-label="Increase">${PLUS}</button>
${resetBtn}
</div>
<div class="df-env-countdown-tickboxes">${ticks}</div>
</div>`;
		}).join("");

		return `
            ${countdownsHtml}
            <div class="df-hp-tickboxes">
                <span class="df-hp-stress">HP</span>${hpTickboxes}
                <span class="df-adversary-count">${index + 1}</span>
            </div>
            <div class="df-stress-tickboxes">
                <span class="df-hp-stress">Stress</span>${stressTickboxes}
            </div>
        `;
	}).join("");

	const stressBlock = stress
		? `Stress: <span class="df-stat">${stress}</span>`
		: "";

	const sourceBadge = source ? `<span class="df-source-badge-${source.toLowerCase()}">${source.toLowerCase()}</span>` : `<span class="df-source-badge-custom">custom</span>`;

	const featuresHTML = features
		.map(
			(f) => `
        <div class="df-feature">
            <span class="df-feature-title">
                ${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ":"}
            </span>
            <div class="df-feature-desc">${toCustomHtml(f.richContent)}</div>
        </div>`,
		)
		.join("");
	return `
<section id="custom" class="df-card-outer df-pseudo-cut-corners outer${wide ? ' df-card--wide' : ''}" data-weapon-range="${weaponRange || ''}" data-type="${(type || '').split('(')[0].trim()}" data-count="${count || '1'}">
    <div class="df-card-inner df-pseudo-cut-corners inner">
		<button class="df-adv-collapse-btn" aria-label="Toggle HP and Stress"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg></button>
		<button class="df-wide-toggle-btn" data-edit-mode-only="true" aria-label="Toggle wide card"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></button>
		<button class="df-adv-edit-button" data-edit-mode-only="true" aria-label="Edit" id="${hiddenID}"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
        <div class="df-hp-stress-section"><div class="df-hp-stress-inner">${hpStressRepeat}</div></div>
        <h2 class="df-card-name" id="${hiddenID}">${name}</h2>
        <div class="df-subtitle">Tier ${tier} ${type} ${sourceBadge}</div>
        <div class="df-desc">${desc}</div>
        <div class="df-motives">Motives & Tactics:
            <span class="df-motives-desc">${motives}</span>
        </div>
        <div class="df-stats">
            Difficulty: <span class="df-stat">${difficulty} |</span>
            Thresholds: <span class="df-stat">${thresholdMajor}/${thresholdSevere} |</span>
            HP: <span class="df-stat">${hp} |</span>
            ${stressBlock}
            <br>ATK: <span class="df-stat">${atk} |</span>
            ${weaponName}: <span class="df-stat">${weaponRange} | ${weaponDamage}</span><br>
            <div class="df-experience-line">Experience: <span class="df-stat">${xp}</span></div>
        </div>
        <div class="df-section">FEATURES</div>
        ${featuresHTML}
    </div>
</section>
`.trim();
};
