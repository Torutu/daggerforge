import { Feature } from "../../../types/shared";

export const buildCardHTML = (
	values: Record<string, string>,
	features: Feature[],
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
	} = values;

	const hptick = Number(hp) || 0;
	const stresstick = Number(stress) || 0;
	let countNum = Number(count);
	countNum = Number.isInteger(countNum) && countNum >= 1 ? countNum : 1;
	
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
	const featuresHTML = features
		.map(
			(f) => `
        <div class="df-feature">
            <span class="df-feature-title">
                ${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ":"}
            </span>
            <span class="df-feature-desc">${f.desc}</span>
        </div>`,
		)
		.join("");
	return `
<section id="custom" class="df-card-outer df-pseudo-cut-corners outer" data-weapon-range="${weaponRange || ''}" data-type="${type || ''}" data-count="${count || '1'}">
    <div class="df-card-inner df-pseudo-cut-corners inner">
		<button class="df-adv-edit-button" data-edit-mode-only="true" data-tooltip="duplicate & edit" aria-label="duplicate & edit">📝</button>
        ${hpStressRepeat}
        <h2>${name}</h2>
        <div class="df-subtitle">Tier ${tier} ${type} </div>
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
