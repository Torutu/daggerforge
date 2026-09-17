/**
 * jsdom polyfill for the DOM helpers Obsidian patches onto every HTMLElement
 * at runtime (createEl, createDiv, createSpan, empty, addClass, ...).
 * Production code relies on these being present everywhere (see CLAUDE.md -
 * the imperative element-creation API is never used directly, anywhere), but
 * jsdom doesn't implement Obsidian's own extensions, so any test file that
 * exercises that code against real DOM needs this loaded first.
 *
 * Wired in globally via jest.config.cjs's setupFilesAfterEnv, guarded so it
 * is a no-op for test files running under the default 'node' environment
 * (which never has an HTMLElement global to begin with).
 */

/**
 * Builds a single bare element of the given tag through HTML parsing
 * (the same DOMParser already used throughout this codebase to turn markup
 * strings into real DOM - see richContentTransform.ts), rather than the
 * DOM's imperative element-creation API - see CLAUDE.md.
 */
function newElement(tag: string): HTMLElement {
	const el = new DOMParser().parseFromString(`<${tag}></${tag}>`, "text/html").body.firstElementChild;
	if (!el) throw new Error(`obsidianDomPolyfill: could not parse a <${tag}> element`);
	return el as HTMLElement;
}

interface DomElementInfo {
	cls?: string | string[];
	text?: string;
	attr?: Record<string, string | number | boolean | null>;
	title?: string;
	value?: string;
	type?: string;
	placeholder?: string;
	href?: string;
	parent?: Node;
	prepend?: boolean;
}

function applyDomElementInfo(el: HTMLElement, o?: DomElementInfo | string): void {
	if (o === undefined) return;
	if (typeof o === "string") {
		el.className = o;
		return;
	}
	if (o.cls) {
		const classes = Array.isArray(o.cls) ? o.cls : [o.cls];
		(el as any).addClass(...classes);
	}
	if (o.text !== undefined) (el as any).setText(o.text);
	if (o.attr) {
		for (const [key, value] of Object.entries(o.attr)) {
			if (value === null || value === false) continue;
			el.setAttribute(key, value === true ? "" : String(value));
		}
	}
	if (o.title !== undefined) el.setAttribute("title", o.title);
	if (o.value !== undefined) (el as HTMLInputElement).value = o.value;
	if (o.type !== undefined) (el as HTMLInputElement).type = o.type;
	if (o.placeholder !== undefined) (el as HTMLInputElement).placeholder = o.placeholder;
	if (o.href !== undefined) (el as HTMLAnchorElement).href = o.href;
	if (o.parent) {
		if (o.prepend) o.parent.insertBefore(el, o.parent.firstChild);
		else o.parent.appendChild(el);
	}
}

if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.hasOwnProperty("createEl")) {
	Object.defineProperty(HTMLElement.prototype, "createEl", {
		configurable: true,
		value(this: HTMLElement, tag: string, o?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
			const el = newElement(tag);
			applyDomElementInfo(el, o);
			if (!o || typeof o === "string" || !o.parent) this.appendChild(el);
			callback?.(el);
			return el;
		},
	});

	Object.defineProperty(HTMLElement.prototype, "createDiv", {
		configurable: true,
		value(this: HTMLElement, o?: DomElementInfo | string, callback?: (el: HTMLDivElement) => void) {
			return (this as any).createEl("div", o, callback);
		},
	});

	Object.defineProperty(HTMLElement.prototype, "createSpan", {
		configurable: true,
		value(this: HTMLElement, o?: DomElementInfo | string, callback?: (el: HTMLSpanElement) => void) {
			return (this as any).createEl("span", o, callback);
		},
	});

	Object.defineProperty(HTMLElement.prototype, "empty", {
		configurable: true,
		value(this: HTMLElement) {
			this.replaceChildren();
		},
	});

	Object.defineProperty(HTMLElement.prototype, "setText", {
		configurable: true,
		value(this: HTMLElement, text: string) {
			this.replaceChildren();
			this.appendChild(document.createTextNode(text));
		},
	});

	Object.defineProperty(HTMLElement.prototype, "appendText", {
		configurable: true,
		value(this: HTMLElement, text: string) {
			this.appendChild(document.createTextNode(text));
		},
	});

	Object.defineProperty(HTMLElement.prototype, "addClass", {
		configurable: true,
		value(this: HTMLElement, ...classes: string[]) {
			this.classList.add(...classes);
		},
	});

	Object.defineProperty(HTMLElement.prototype, "removeClass", {
		configurable: true,
		value(this: HTMLElement, ...classes: string[]) {
			this.classList.remove(...classes);
		},
	});

	Object.defineProperty(HTMLElement.prototype, "toggleClass", {
		configurable: true,
		value(this: HTMLElement, classes: string | string[], value: boolean) {
			const list = Array.isArray(classes) ? classes : [classes];
			list.forEach((c) => this.classList.toggle(c, value));
		},
	});

	Object.defineProperty(HTMLElement.prototype, "setAttr", {
		configurable: true,
		value(this: HTMLElement, name: string, value: string | number | boolean | null) {
			if (value === null || value === false) this.removeAttribute(name);
			else this.setAttribute(name, value === true ? "" : String(value));
		},
	});
}

export {};
