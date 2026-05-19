const KEYWORD_TEST = /\b(hope|fear|hp|stress)\b/i;
const KEYWORD_SCAN = () => /\b(hope|fear|hp|stress)\b/gi;

const KEYWORD_CLASS: Record<string, string> = {
	hope:   "df-kw-hope",
	fear:   "df-kw-fear",
	hp:     "df-kw-hp",
	stress: "df-kw-stress",
};

const SKIP_SELECTOR =
	".df-inline-dice-btn, .df-kw-hope, .df-kw-fear, .df-kw-hp, .df-kw-stress";

// Toggle coloring via a body class — no re-scan of existing cards needed.
export function applyKeywordColors(enabled: boolean): void {
	document.body.classList.toggle("df-kw-active", enabled);
}

function colorKeywordsInNode(node: Text): void {
	const text = node.nodeValue ?? "";
	const re = KEYWORD_SCAN();
	const matches: RegExpExecArray[] = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(text)) !== null) matches.push(m);
	if (matches.length === 0) return;

	const parent = node.parentNode;
	if (!parent) return;

	const fragment = document.createDocumentFragment();
	let cursor = 0;

	for (const match of matches) {
		const start = match.index!;
		const end = start + match[0].length;

		if (start > cursor) {
			fragment.appendChild(document.createTextNode(text.slice(cursor, start)));
		}

		const span = document.createElement("span");
		span.className = KEYWORD_CLASS[match[1].toLowerCase()];
		span.textContent = match[0];
		fragment.appendChild(span);

		cursor = end;
	}

	if (cursor < text.length) {
		fragment.appendChild(document.createTextNode(text.slice(cursor)));
	}

	parent.replaceChild(fragment, node);
}

// Always inject spans — coloring is controlled purely by CSS (.df-kw-active on body).
export function attachKeywordColors(section: HTMLElement): void {
	const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
		acceptNode(node) {
			if ((node.parentElement as HTMLElement | null)?.closest(SKIP_SELECTOR)) {
				return NodeFilter.FILTER_REJECT;
			}
			return KEYWORD_TEST.test(node.nodeValue ?? "")
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_SKIP;
		},
	});

	const nodes: Text[] = [];
	let node = walker.nextNode();
	while (node) {
		nodes.push(node as Text);
		node = walker.nextNode();
	}

	nodes.forEach(colorKeywordsInNode);
}
