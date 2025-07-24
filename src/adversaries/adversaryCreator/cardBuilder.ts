import { Feature } from "./types";

export const buildCardHTML = (values: Record<string, string>, features: Feature[]): string => {
    const {
        name, tier, type, desc, motives, difficulty,
        thresholdMajor, thresholdSevere, hp, stress, atk,
        weaponName, weaponRange, weaponDamage, xp
    } = values;

    const hptick = Number(hp) || 0;
    const hpTickboxes = Array.from({ length: hptick }, (_, i) => `
        <input type="checkbox" id="hp-tick-${i}" class="hp-tickbox" />
    `).join('');
    
    const stresstick = Number(stress) ?? 0;
    const stressTickboxes = Array.from({ length: stresstick }, (_, i) => `
        <input type="checkbox" id="stress-tick-${i}" class="stress-tickbox" />
    `).join('');
    
    const stressBlock = stress ? `Stress: <span class="stat">${stress}</span>` : '';

    const featuresHTML = features.map(f => `
        <div class="feature">
            <span class="feature-title">
                ${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ':'}
            </span>
            <span class="feature-desc">${f.desc}</span>
        </div>`).join('');
// <button class="edit-button">Edit</button>
    return `
<div class="card-outer pseudo-cut-corners outer">
    <div class="card-inner pseudo-cut-corners inner">
        <div class="hp-tickboxes">
            <span class="hp-stress">HP</span>${hpTickboxes}
        </div>
        <div class="stress-tickboxes">
            <span class="hp-stress">Stress</span>${stressTickboxes}
        </div>
        <h2>${name}</h2>
        <div class="subtitle">Tier ${tier} ${type} </div>
        <div class="desc">${desc}</div>
        <div class="motives">Motives & Tactics:
            <span class="motives-desc">${motives}</span>
        </div>
        <div class="stats">
            Difficulty: <span class="stat">${difficulty} |</span>
            Thresholds: <span class="stat">${thresholdMajor}/${thresholdSevere} |</span>
            HP: <span class="stat">${hp} |</span>
            ${stressBlock}
            <br>ATK: <span class="stat">${atk} |</span>
            ${weaponName}: <span class="stat">${weaponRange} | ${weaponDamage}</span><br>
            <div class="experience-line">Experience: <span class="stat">${xp}</span></div>
        </div>
        <div class="section">FEATURES</div>
        ${featuresHTML}
    </div>
</div>
`.trim();
};