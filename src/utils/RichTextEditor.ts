import { setIcon } from "obsidian";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { toCustomHtml, toStandardHtml } from "./richContentTransform";

/** Lucide icon ids (see https://lucide.dev/), rendered via Obsidian's setIcon. */
const ICONS = {
	bold: "bold",
	italic: "italic",
	strike: "strikethrough",
	h1: "heading-1",
	h2: "heading-2",
	list: "list",
	listOrdered: "list-ordered",
	undo: "undo-2",
	redo: "redo-2",
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
			setIcon(btn, item.icon);
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
		setIcon(icon, "info");
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
