import React from "react";

/**
 * Renders SRD card body text. The bundled data uses a tiny markdown subset -
 * **bold**, _italic_, and blank-line paragraph breaks - so a full markdown
 * pipeline would be overkill here. Game keywords (Hope, Stress, dice, +N
 * modifiers, ...) are bolded automatically so they stand out at the table.
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

/** Game terms worth emphasizing: dice (d6, 2d12+3), +N/-N modifiers, and the
 *  core resources/stats. One capture group so split() interleaves matches. */
const KEYWORD_RE =
	/((?<![\w+-])[+-]?\d*d\d+(?:[+-]\d+)?\b|(?<![\w+-])[+-]\d+\b|\bHope\b|\bFear\b|\bStress\b|\bHit Points?\b|\bHP\b|\bArmor Slots?\b|\bEvasion\b|\bProficiency\b|\badvantage\b|\bdisadvantage\b)/g;

function highlightKeywords(text: string, keyPrefix: string): React.ReactNode[] {
	return text.split(KEYWORD_RE).map((seg, i) =>
		i % 2 === 1 ? (
			<strong key={`${keyPrefix}-${i}`} className="df-cs-kw">{seg}</strong>
		) : (
			<React.Fragment key={`${keyPrefix}-${i}`}>{seg}</React.Fragment>
		),
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
			return <em key={i}>{highlightKeywords(part.slice(1, -1), `em${i}`)}</em>;
		}
		return <React.Fragment key={i}>{highlightKeywords(part, `t${i}`)}</React.Fragment>;
	});
}
