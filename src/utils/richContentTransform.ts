/**
 * Escapes text for safe interpolation into an HTML string. Use this whenever
 * user-authored text (a feature name, a countdown label, ...) has to be
 * concatenated into markup that eventually becomes a note's or a card's
 * stored HTML - card records can arrive from an untrusted source (a shared
 * character/adversary code, an imported JSON file), so that text can never
 * be trusted as-is.
 */
export function escapeHtml(text: string): string {
	// Card records travel through several loosely-typed hops (raw form
	// values, imported JSON, decoded share codes) where an optional field
	// can be undefined at runtime despite its string type - fail safe
	// instead of throwing.
	if (typeof text !== "string") return "";
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Strips the parts of an HTML fragment that could run script when inserted
 * into the DOM: <script>/<style>/<iframe>/<object>/<embed> elements, every
 * "on*" event-handler attribute, and javascript:/data: URLs in href/src.
 *
 * toCustomHtml/toStandardHtml round-trip arbitrary HTML between the rich
 * text editor and card storage, and that HTML can originate from an
 * imported or shared record rather than this editor - so it has to be
 * treated as untrusted input and cleaned before anything else touches it.
 */
function sanitizeFragment(root: HTMLElement): void {
	root.querySelectorAll("script, style, iframe, object, embed").forEach(el => el.remove());

	root.querySelectorAll("*").forEach(el => {
		for (const attr of Array.from(el.attributes)) {
			const name = attr.name.toLowerCase();
			if (name.startsWith("on")) {
				el.removeAttribute(attr.name);
				continue;
			}
			if ((name === "href" || name === "src") && /^\s*(javascript|data):/i.test(attr.value)) {
				el.removeAttribute(attr.name);
			}
		}
	});
}

/**
 * Parses an HTML string into a detached, sanitized document body. Uses
 * DOMParser rather than assigning the string directly onto an element - the
 * string can originate from an imported or shared record, and this keeps
 * every fragment parse in the file going through one sanitized entry point.
 */
function parseFragment(html: string): HTMLElement {
	const root = new DOMParser().parseFromString(html, "text/html").body;
	sanitizeFragment(root);
	return root;
}

/**
 * Serializes an element's children back into an HTML string. The DOM-API
 * replacement for reading an element's contents out as a string via a direct
 * property getter, which is banned throughout this codebase (see
 * CLAUDE.md) - no such shortcut is used here, on either the read or write side.
 */
// XMLSerializer declares a default namespace on whatever node sits at the
// root of a serializeToString() call, since XML (unlike the browser's own
// HTML-fragment serialization) has no implicit document context to inherit
// it from. Each top-level child is serialized independently here, so each
// one picks this up on its own opening tag - strip it back out; it is never
// meaningful in an Obsidian note and was never part of the original markup.
const XML_DEFAULT_NAMESPACE = / xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g;

export function serializeChildren(el: Element): string {
	const serializer = new XMLSerializer();
	return Array.from(el.childNodes)
		.map((node) => serializer.serializeToString(node).replace(XML_DEFAULT_NAMESPACE, ""))
		.join("");
}

/**
 * Parses a (sanitized) HTML string and appends the resulting nodes to
 * `target` - the DOM-API replacement for target.insertAdjacentHTML(...).
 */
export function appendHtml(target: HTMLElement, html: string): void {
	const root = parseFragment(html);
	target.append(...Array.from(root.childNodes));
}

/**
 * Replaces every element matching `selector` with a new `newTag` element
 * (given `newClass`, if any) holding the same children - moves the actual
 * child nodes directly rather than round-tripping through a serialized string.
 *
 * `el`'s own parent creates the replacement (createEl always appends, so it
 * briefly lands at the end of that parent's children); el.replaceWith(...)
 * then moves it into el's exact former position and removes el, which is
 * why the replacement doesn't need to be built at the right spot up front.
 */
function rewrapElements(root: HTMLElement, selector: string, newTag: string, newClass?: string): void {
	root.querySelectorAll(selector).forEach(el => {
		const parent = el.parentElement ?? root;
		const replacement = parent.createEl(newTag as keyof HTMLElementTagNameMap, newClass ? { cls: newClass } : undefined);
		replacement.append(...Array.from(el.childNodes));
		el.replaceWith(replacement);
	});
}

/**
 * Convert standard HTML list elements to custom-classed divs before storing
 * in card HTML, so Obsidian's reading-mode stylesheet cannot restyle them.
 */
export function toCustomHtml(html: string): string {
	const root = parseFragment(html);

	// Replace <ul> first, then <ol>, then <li> (order matters: outer before inner)
	rewrapElements(root, "ul", "div", "df-ul");
	rewrapElements(root, "ol", "div", "df-ol");
	rewrapElements(root, "li", "div", "df-li");
	rewrapElements(root, "h4", "div", "df-h4");
	rewrapElements(root, "p", "div", "df-p");

	return serializeChildren(root);
}

/**
 * Reverse of toCustomHtml - convert back to standard list elements so
 * Tiptap can parse and render them correctly in the editor.
 */
export function toStandardHtml(html: string): string {
	const root = parseFragment(html);

	rewrapElements(root, ".df-ul", "ul");
	rewrapElements(root, ".df-ol", "ol");
	rewrapElements(root, ".df-li", "li");
	rewrapElements(root, ".df-h4", "h4");
	rewrapElements(root, ".df-p", "p");

	return serializeChildren(root);
}
