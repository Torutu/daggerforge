/**
 * Convert standard HTML list elements to custom-classed divs before storing
 * in card HTML, so Obsidian's reading-mode stylesheet cannot restyle them.
 */
export function toCustomHtml(html: string): string {
	const root = document.createElement("div");
	root.innerHTML = html;

	// Replace <ul> first, then <ol>, then <li> (order matters: outer before inner)
	root.querySelectorAll("ul").forEach(el => {
		const d = document.createElement("div");
		d.className = "df-ul";
		d.innerHTML = el.innerHTML;
		el.replaceWith(d);
	});

	root.querySelectorAll("ol").forEach(el => {
		const d = document.createElement("div");
		d.className = "df-ol";
		d.innerHTML = el.innerHTML;
		el.replaceWith(d);
	});

	root.querySelectorAll("li").forEach(el => {
		const d = document.createElement("div");
		d.className = "df-li";
		d.innerHTML = el.innerHTML;
		el.replaceWith(d);
	});

	return root.innerHTML;
}

/**
 * Reverse of toCustomHtml — convert back to standard list elements so
 * Tiptap can parse and render them correctly in the editor.
 */
export function toStandardHtml(html: string): string {
	const root = document.createElement("div");
	root.innerHTML = html;

	root.querySelectorAll(".df-ul").forEach(el => {
		const ul = document.createElement("ul");
		ul.innerHTML = el.innerHTML;
		el.replaceWith(ul);
	});

	root.querySelectorAll(".df-ol").forEach(el => {
		const ol = document.createElement("ol");
		ol.innerHTML = el.innerHTML;
		el.replaceWith(ol);
	});

	root.querySelectorAll(".df-li").forEach(el => {
		const li = document.createElement("li");
		li.innerHTML = el.innerHTML;
		el.replaceWith(li);
	});

	return root.innerHTML;
}
