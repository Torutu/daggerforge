import { Editor, Notice } from "obsidian";
import adversariesTier1 from '../../adversaries/Adversaries-Tier-1.json';
import adversariesTier2 from '../../adversaries/Adversaries-Tier-2.json';
import adversariesTier3 from '../../adversaries/Adversaries-Tier-3.json';
import adversariesTier4 from '../../adversaries/Adversaries-Tier-4.json';
import type DaggerForgePlugin from "./main"

const tierDataMap: Record<string, any[]> = {
  "1": adversariesTier1,
  "2": adversariesTier2,
  "3": adversariesTier3,
  "4": adversariesTier4,
};

export async function loadAdversaryTier(tier: string, editor: Editor) {
		const data = tierDataMap[tier];

		if (!data || !Array.isArray(data) || data.length === 0) {
			new Notice(`No adversaries found in Tier ${tier} JSON.`);
			return;
		}

		const allCardsHTML = data.map((a) =>
			buildCardHTML(
				{
					name: a.name ?? "",
					tier: a.tier ?? "",
					type: a.type ?? "",
					desc: a.desc ?? "",
					motives: a.motives ?? "",
					difficulty: a.difficulty ?? "",
					thresholds: a.thresholds ?? "",
					hp: a.hp ?? "",
					stress: a.stress ?? "",
					atk: a.atk ?? "",
					weaponName: a.weaponName ?? "",
					weaponRange: a.weaponRange ?? "",
					weaponDamage: a.weaponDamage ?? "",
					xp: a.xp ?? "",
			},
			a.features ?? []
		)
	).join('\n\n');

	editor.replaceSelection(allCardsHTML);
	new Notice(`Loaded ${data.length} adversaries from Tier ${tier}.`);
}

function buildCardHTML(
	values: Record<string, string>,
	features: { name: string; type: string; cost: string; desc: string }[]
): string {
	const {
		name, tier, type, desc, motives, difficulty,
		thresholds, hp, stress, atk,
		weaponName, weaponRange, weaponDamage, xp
	} = values;

	const stressBlock = stress ? `Stress: <span class="stat">${stress}</span><br>` : "";

	const featuresHTML = features.map(f => `
			<div class="feature">
			<span class="feature-title">
				${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ':'}
			</span>
			<span class="feature-desc">${f.desc}</span>
			</div>`).join('');

const cardHTML = `

<div class="card-outer pseudo-cut-corners outer">
  <div class="card-inner pseudo-cut-corners inner">
    <h2>${name}</h2>
    <div class="subtitle">Tier ${tier} ${type}</div>
    <div class="desc">${desc}</div>
    <div class="motives">Motives & Tactics:
      <span class="motives-desc">${motives}</span>
    </div>
    <div class="stats">
      Difficulty: <span class="stat">${difficulty} |</span>
      Thresholds: <span class="stat">${thresholds} |</span>
      HP: <span class="stat">${hp} |</span>
      ${stressBlock}
      ATK: <span class="stat">${atk} |</span>
      ${weaponName}: <span class="stat">${weaponRange} | ${weaponDamage}</span><br>
      <div class="experience-line">Experience: <span class="stat">${xp}</span></div>
    </div>
    <div class="section">FEATURES</div>
    ${featuresHTML}
  </div>
</div>
`;
		return cardHTML.trim().replace(/\s+$/, '');
}
