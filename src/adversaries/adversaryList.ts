import { Editor, Notice } from "obsidian";
import { ADVERSARIES } from "../data/adversaries";

const tierDataMap: Record<string, any[]> = {
	"1": ADVERSARIES.tier1,
	"2": ADVERSARIES.tier2,
	"3": ADVERSARIES.tier3,
	"4": ADVERSARIES.tier4,
};

export async function loadAdversaryTier(tier: string, editor: Editor) {
	const data = tierDataMap[tier];

	if (!data || !Array.isArray(data) || data.length === 0) {
		new Notice(`No adversaries found in Tier ${tier} JSON.`);
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
					thresholds: a.thresholds ?? "",
					hp: a.hp ?? "",
					stress: a.stress ?? "",
					atk: a.atk ?? "",
					weaponName: a.weaponName ?? "",
					weaponRange: a.weaponRange ?? "",
					weaponDamage: a.weaponDamage ?? "",
					xp: a.xp ?? "",
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
		thresholds,
		hp,
		stress,
		atk,
		weaponName,
		weaponRange,
		weaponDamage,
		xp,
	} = values;

	const hptick = Number(hp) || 0; // fallback to 0 if undefined
	const hpTickboxes = Array.from(
		{ length: hptick },
		(_, i) => `
    <input type="checkbox" id="hp-tick-${i}" class="hp-tickbox" />
    `,
	).join("");
	const stresstick = Number(stress) ?? 0; // nullish coalescing fallback to 0
	const stressTickboxes = Array.from(
		{ length: stresstick },
		(_, i) => `
    <input type="checkbox" id="stress-tick-${i}" class="stress-tickbox" />
    `,
	).join("");

	const stressBlock = stress
		? `Stress: <span class="stat">${stress}</span><br>`
		: "";

	const featuresHTML = features
		.map(
			(f) => `
			<div class="feature">
			<span class="feature-title">
				${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ":"}
			</span>
			<span class="feature-desc">${f.desc}</span>
			</div>`,
		)
		.join("");

	const cardHTML = `

<section class="card-outer pseudo-cut-corners outer">
  <div class="card-inner pseudo-cut-corners inner">
    <div class="hp-tickboxes">
    <span class="hp-stress">HP</span>${hpTickboxes}
    </div>
    <div class="stress-tickboxes">
        <span class="hp-stress">Stress</span>${stressTickboxes}
    </div>
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
</section>
`;
	return cardHTML.trim().replace(/\s+$/, "");
}
