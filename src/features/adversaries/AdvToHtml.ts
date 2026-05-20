import { Feature } from "../../types/index";
import { toCustomHtml } from "../../utils/richContentTransform";

export const buildCardHTML = (
	values: Record<string, string>,
	features: Feature[],
	wide = false,
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

		return `
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
        <div class="df-hp-stress-section">${hpStressRepeat}</div>
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
