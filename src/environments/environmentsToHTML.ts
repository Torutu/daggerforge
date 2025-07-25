import { EnvironmentData } from "./environmentTypes";

export function environmentToHTML(env: EnvironmentData): string {
    const featuresHTML = (env.features || []).map((f) => {
        const costHTML = f.cost ? `<span>${f.cost}</span>` : '';

        const bulletsHTML = f.bullets?.length
            ? f.bullets.map((b) => `<div class="env-bullet">${b}</div>`).join('')
            : '';

        const questionsHTML = f.questions?.length
            ? `<div class="env-questions">${f.questions.map((q) => `${q}`).join('')}</div>`
            : '';

        return `
            <div class="feature">
                <div class="env-feat-name-type">${f.name} - ${f.type}: ${costHTML}
                    <span class="env-feat-text"> ${f.text}</span>
                </div>
                ${bulletsHTML}
                ${questionsHTML}
            </div>
        `;
    }).join('');
    return `
<div class="env-card-outer">
    <div class="env-card-inner">
        <div class="env-name">${env.name}</div>
        <div class="env-feat-tier-type">Tier ${env.tier.toString()} ${env.type}</div>
        <p class="env-desc">${env.desc}</p>
        <p><strong>Impulse:</strong> ${env.impulse || ''}</p>
        <div class="env-card-diff-pot">
            <p><span class="bold-title">Difficulty</span>: ${env.difficulty || ''}</p>
            <p><span class="bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ''}</p>
        </div>
        <div class="features-section">
            <h3>Features</h3>
            ${featuresHTML}
        </div>
    </div>
</div>
`;
}
