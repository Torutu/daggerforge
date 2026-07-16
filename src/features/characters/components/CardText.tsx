import React from "react";

/**
 * Renders SRD card body text. The bundled data uses a tiny markdown subset —
 * **bold**, _italic_, and blank-line paragraph breaks — so a full markdown
 * pipeline would be overkill here.
 */
export function CardText({ text }: { text: string }) {
	const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
	return (
		<>
			{paragraphs.map((para, i) => {
				// Feature-style paragraphs ("Heart of a Poet: …") get their name bolded
				const named = para.match(/^([^:\n*_]{2,60}):\s+([\s\S]*)$/);
				return (
					<p key={i} className="df-cs-cardtext-p">
						{named ? (
							<>
								<strong>{named[1]}:</strong> {renderInline(named[2])}
							</>
						) : (
							renderInline(para)
						)}
					</p>
				);
			})}
		</>
	);
}

function renderInline(text: string): React.ReactNode[] {
	// Split on bold/italic tokens, keeping the delimiters via capture group
	const parts = text.split(/(\*\*[^*]+\*\*|_[^_\n]+_)/g);
	return parts.map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={i}>{part.slice(2, -2)}</strong>;
		}
		if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
			return <em key={i}>{part.slice(1, -1)}</em>;
		}
		return <React.Fragment key={i}>{part}</React.Fragment>;
	});
}
