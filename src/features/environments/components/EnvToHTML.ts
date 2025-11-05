import { EnvironmentData } from "../../../types/environment";

export function environmentToHTML(env: EnvironmentData): string {
	const featuresHTML = (env.features || [])
		.map((f) => {
			const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

			const bulletsHTML = f.bullets?.length
				? f.bullets
						.map((b) => `<div class="df-env-bullet">${b}</div>`)
						.join("")
				: "";

			const questionsHTML = f.questions?.length
				? `<div class="df-env-questions">${f.questions.map((q) => `${q}`).join("")}</div>`
				: "";

			return `
            <div class="df-feature">
                <div class="df-env-feat-name-type">${f.name} - ${f.type}: ${costHTML}
                    <span class="df-env-feat-text"> ${f.text}</span>
                </div>
                ${bulletsHTML}
                ${questionsHTML}
            </div>
        `;
		})
		.join("");
	return `
<div class="df-env-card-outer">
    <div class="df-env-card-inner">
        <div class="df-env-name">${env.name}</div>
        <div class="df-env-feat-tier-type">Tier ${env.tier.toString()} ${env.type}</div>
        <p class="df-env-desc">${env.desc}</p>
        <p><strong>Impulse:</strong> ${env.impulse || ""}</p>
        <div class="df-env-card-diff-pot">
            <p><span class="df-bold-title">Difficulty</span>: ${env.difficulty || ""}</p>
            <p><span class="df-bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ""}</p>
        </div>
        <div class="df-features-section">
            <h3>Features</h3>
            ${featuresHTML}
        </div>
    </div>
</div>
`;
}
