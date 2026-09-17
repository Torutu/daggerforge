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

// Toggle coloring via a body class - no re-scan of existing cards needed.
export function applyKeywordColors(enabled: boolean): void {
	document.body.classList.toggle("df-kw-active", enabled);
}

// node stays in the tree as a positional cursor - every replacement piece is
// inserted with node.before(...), preserving order, then node itself is
// removed. This avoids a DocumentFragment (which is not an HTMLElement and
// so has no createEl of its own) while still doing the whole splice as one
// pass through the original text.
function colorKeywordsInNode(node: Text): void {
	const text = node.nodeValue ?? "";
	const re = KEYWORD_SCAN();
	const matches: RegExpExecArray[] = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(text)) !== null) matches.push(m);
	if (matches.length === 0) return;

	const parent = node.parentElement;
	if (!parent) return;

	let cursor = 0;

	for (const match of matches) {
		const start = match.index!;
		const end = start + match[0].length;

		if (start > cursor) {
			node.before(document.createTextNode(text.slice(cursor, start)));
		}

		node.before(parent.createSpan({
			cls: KEYWORD_CLASS[match[1].toLowerCase()],
			text: match[0],
		}));

		cursor = end;
	}

	if (cursor < text.length) {
		node.before(document.createTextNode(text.slice(cursor)));
	}

	node.remove();
}

// Always inject spans - coloring is controlled purely by CSS (.df-kw-active on body).
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
