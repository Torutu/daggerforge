import { EnvironmentData } from "../../../types/environment";

// Helper function to convert Markdown to HTML
function markdownToHTML(markdown: string): string {
	if (!markdown) return "";

	let html = markdown;

	// Handle line breaks first
	html = html.replace(/\n/g, "<br>");

	// Handle bold (**text**)
	html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

	// Handle italic (*text*)
	html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

	// Handle bullet lists (- item)
	// Find all consecutive lines starting with "- "
	const lines = html.split("<br>");
	let inBulletList = false;
	const processedLines = lines.map((line, index) => {
		const bulletMatch = line.match(/^- (.*)/);
		if (bulletMatch) {
			if (!inBulletList) {
				inBulletList = true;
				return `<ul><li>${bulletMatch[1]}</li>`;
			} else {
				return `<li>${bulletMatch[1]}</li>`;
			}
		} else {
			if (inBulletList) {
				inBulletList = false;
				return `</ul>${line}`;
			}
			return line;
		}
	});
	
	// Close any open bullet list at the end
	if (inBulletList) {
		processedLines.push("</ul>");
	}
	
	html = processedLines.join("<br>");

	// Handle numbered lists (1. item, 2. item, etc)
	const numberedPattern = /(\d+)\. (.*)/g;
	const hasNumbered = numberedPattern.test(html);
	
	if (hasNumbered) {
		html = html.replace(/(\d+)\. (.*?)(?=<br>|$)/g, (match, num, text) => {
			return `<li>${text}</li>`;
		});
		
		// Wrap in ol tags
		html = html.replace(/(<li>.*?<\/li>)(?=<br>|$)/s, (match) => {
			if (!match.includes("<ol>")) {
				return `<ol>${match}</ol>`;
			}
			return match;
		});
	}

	// Clean up excessive line breaks
	html = html.replace(/<br><br>/g, "<br>");

	return html;
}

export function environmentToHTML(env: EnvironmentData): string {
	const featuresHTML = (env.features || [])
		.map((f) => {
			const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

			const bulletsHTML = f.bullets && f.bullets.length
				? f.bullets
						.map((b) => `<div class="df-env-bullet">${b}</div>`)
						.join("")
				: "";

			// Convert Markdown text to HTML
			const textHTML = markdownToHTML(f.text);

			// Handle text after bullets
			const textAfterHTML = f.textAfter ? markdownToHTML(f.textAfter) : "";

			const questionsHTML = f.questions?.length
				? `<div class="df-env-questions">${f.questions.map((q) => `<div class="df-env-question">${markdownToHTML(q)}</div>`).join("")}</div>`
				: "";

			return `
            <div class="df-feature" data-feature-name="${f.name}" data-feature-type="${f.type}" data-feature-cost="${f.cost || ''}">
                <div class="df-env-feat-name-type">
                    <span class="df-env-feat-name">${f.name}</span> - <span class="df-env-feat-type">${f.type}:</span> ${costHTML}
                    <div class="df-env-feat-text">${textHTML}</div>
                </div>
                ${bulletsHTML}
                ${textAfterHTML ? `<div id="textafter" class="df-env-feat-text">${textAfterHTML}</div>` : ""}
                ${questionsHTML}
            </div>
        `;
		})
		.join("");
	return `
<section class="df-env-card-outer">
    <div class="df-env-card-inner">
        <button class="df-env-edit-button" data-edit-mode-only="true">📝</button>
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
</section>
`;
}
