/*
import { Editor, Notice } from "obsidian";
import { ADVERSARIES } from "../../../data/index";
import { filterByTier } from "../../../utils/index";

export async function loadAdversaryTier(tier: string, editor: Editor) {

	const data = filterByTier(ADVERSARIES, tier);

	if (!data || !Array.isArray(data) || data.length === 0) {
		new Notice(`No adversaries found in Tier ${tier}.`);
		return;
	}
	const allCardsHTML = data
		.map((a) =>
			buildCardHTML(
				{
					name: a.name ?? "",
					tier: a.tier ?? "",
					type: a.type ?? "",
					desc: a.desc ?? "",
					motives: a.motives ?? "",
					difficulty: a.difficulty ?? "",
					thresholdMajor: a.thresholdMajor ?? "",
					thresholdSevere: a.thresholdSevere ?? "",
					hp: a.hp ?? "",
					stress: a.stress ?? "",
					atk: a.atk ?? "",
					weaponName: a.weaponName ?? "",
					weaponRange: a.weaponRange ?? "",
					weaponDamage: a.weaponDamage ?? "",
					xp: a.xp ?? "",
					count: "1",
				},
				a.features ?? [],
			),
		)
		.join("\n\n");

	editor.replaceSelection(allCardsHTML);
	new Notice(`Loaded ${data.length} adversaries from Tier ${tier}.`);
}

function buildCardHTML(
	values: Record<string, string>,
	features: { name: string; type: string; cost: string; desc: string }[],
): string {
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
	} = values;

	const hptick = Number(hp) || 0;
	const hpTickboxes = Array.from(
		{ length: hptick },
		(_, i) => `
    <input type="checkbox" id="hp-tick-${i}" class="df-hp-tickbox" />
    `,
	).join("");
	const stresstick = Number(stress) ?? 0;
	const stressTickboxes = Array.from(
		{ length: stresstick },
		(_, i) => `
    <input type="checkbox" id="stress-tick-${i}" class="df-stress-tickbox" />
    `,
	).join("");

	const stressBlock = stress
		? `Stress: <span class="df-stat">${stress}</span><br>`
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

	const cardHTML = `

<section class="df-card-outer df-pseudo-cut-corners outer">
  <div class="df-card-inner df-pseudo-cut-corners inner">
    <div class="df-hp-tickboxes">
    <span class="df-hp-stress">HP</span>${hpTickboxes}
    </div>
    <div class="df-stress-tickboxes">
        <span class="df-hp-stress">Stress</span>${stressTickboxes}
    </div>
    <h2>${name}</h2>
    <div class="df-subtitle">Tier ${tier} ${type}</div>
    <div class="df-desc">${desc}</div>
    <div class="df-motives">Motives & Tactics:
      <span class="df-motives-desc">${motives}</span>
    </div>
    <div class="df-stats">
      Difficulty: <span class="df-stat">${difficulty} |</span>
      Thresholds: <span class="df-stat">${thresholdMajor}/${thresholdSevere} |</span>
      HP: <span class="df-stat">${hp} |</span>
      ${stressBlock}
      ATK: <span class="df-stat">${atk} |</span>
      ${weaponName}: <span class="df-stat">${weaponRange} | ${weaponDamage}</span><br>
      <div class="df-experience-line">Experience: <span class="df-stat">${xp}</span></div>
    </div>
    <div class="df-section">FEATURES</div>
    ${featuresHTML}
  </div>
</section>
`;
	return cardHTML.trim().replace(/\s+$/, "");
}*/