import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { toCustomHtml, toStandardHtml } from "./richContentTransform";

const INFO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

const ICONS = {
	bold: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>`,
	italic: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>`,
	strike: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>`,
	h1: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>`,
	h2: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>`,
	list: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
	listOrdered: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
	undo: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`,
	redo: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>`,
};

type ToolbarItem =
	| { kind: "button"; icon: string; title: string; action: () => void; isActive: () => boolean }
	| { kind: "sep" };

export class RichTextEditor {
	private editor: Editor;
	private toolbarEl: HTMLElement;
	private buttons: Array<{ el: HTMLButtonElement; isActive: () => boolean }> = [];

	constructor(container: HTMLElement, initialContent = "") {
		const wrapper = container.createDiv({ cls: "df-rich-editor-wrapper" });
		this.toolbarEl = wrapper.createDiv({ cls: "df-rich-editor-toolbar" });
		const editorMount = wrapper.createDiv({ cls: "df-rich-editor-mount" });

		this.editor = new Editor({
			element: editorMount,
			extensions: [StarterKit],
			content: toStandardHtml(initialContent) || "<p></p>",
			editorProps: {
				attributes: { class: "df-rich-editor-content" },
			},
		});

		this.buildToolbar();
		this.buildInfoIcon();
		this.editor.on("transaction", () => this.syncToolbar());
		this.syncToolbar();
	}

	getHTML(): string {
		const html = this.editor.getHTML();
		return html === "<p></p>" ? "" : toCustomHtml(html);
	}

	destroy(): void {
		this.editor.destroy();
	}

	private buildToolbar(): void {
		const items: ToolbarItem[] = [
			{
				kind: "button",
				icon: ICONS.bold,
				title: "Bold",
				action: () => this.editor.chain().focus().toggleBold().run(),
				isActive: () => this.editor.isActive("bold"),
			},
			{
				kind: "button",
				icon: ICONS.italic,
				title: "Italic",
				action: () => this.editor.chain().focus().toggleItalic().run(),
				isActive: () => this.editor.isActive("italic"),
			},
			{
				kind: "button",
				icon: ICONS.strike,
				title: "Strikethrough",
				action: () => this.editor.chain().focus().toggleStrike().run(),
				isActive: () => this.editor.isActive("strike"),
			},
			{ kind: "sep" },
			{
				kind: "button",
				icon: ICONS.h1,
				title: "Heading 1",
				action: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
				isActive: () => this.editor.isActive("heading", { level: 1 }),
			},
			{
				kind: "button",
				icon: ICONS.h2,
				title: "Heading 2",
				action: () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
				isActive: () => this.editor.isActive("heading", { level: 2 }),
			},
			{ kind: "sep" },
			{
				kind: "button",
				icon: ICONS.list,
				title: "Bullet list",
				action: () => this.editor.chain().focus().toggleBulletList().run(),
				isActive: () => this.editor.isActive("bulletList"),
			},
			{
				kind: "button",
				icon: ICONS.listOrdered,
				title: "Numbered list",
				action: () => this.editor.chain().focus().toggleOrderedList().run(),
				isActive: () => this.editor.isActive("orderedList"),
			},
			{ kind: "sep" },
			{
				kind: "button",
				icon: ICONS.undo,
				title: "Undo",
				action: () => this.editor.chain().focus().undo().run(),
				isActive: () => false,
			},
			{
				kind: "button",
				icon: ICONS.redo,
				title: "Redo",
				action: () => this.editor.chain().focus().redo().run(),
				isActive: () => false,
			},
		];

		for (const item of items) {
			if (item.kind === "sep") {
				this.toolbarEl.createDiv({ cls: "df-rich-editor-sep" });
				continue;
			}

			const btn = this.toolbarEl.createEl("button", {
				title: item.title,
				cls: "df-rich-editor-btn",
				type: "button",
			});
			btn.innerHTML = item.icon;
			btn.addEventListener("mousedown", (e) => {
				e.preventDefault();
				item.action();
			});
			this.buttons.push({ el: btn, isActive: item.isActive });
		}
	}

	private buildInfoIcon(): void {
		const wrap = this.toolbarEl.createDiv({ cls: "df-rich-editor-info-wrap" });
		const icon = wrap.createDiv({ cls: "df-rich-editor-info-icon" });
		icon.innerHTML = INFO_SVG;
		const tooltip = wrap.createDiv({ cls: "df-rich-editor-info-tooltip" });
		tooltip.appendText("Dice: typing '1d6', '2d8+3', etc. become clickable roll buttons when the card is inserted.");
		tooltip.createEl("br");
		tooltip.createEl("br");
		tooltip.appendText("Keywords: typing 'hope', 'fear', 'hp', 'stress' (any casing) are auto-colored when keyword highlighting is enabled in Settings.");
	}

	private syncToolbar(): void {
		for (const { el, isActive } of this.buttons) {
			el.classList.toggle("df-rich-editor-btn--active", isActive());
		}
	}
}
