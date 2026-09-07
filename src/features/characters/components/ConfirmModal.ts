import { translate as dfTranslate } from "../../../i18n";
import { App, Modal } from "obsidian";

/** Minimal confirmation dialog for destructive character sheet actions. */
export class ConfirmModal extends Modal {
	private title: string;
	private message: string;
	private confirmLabel: string;
	private onConfirm: () => void;

	constructor(
		app: App,
		options: { title: string; message: string; confirmLabel: string; onConfirm: () => void },
	) {
		super(app);
		this.title = options.title;
		this.message = options.message;
		this.confirmLabel = options.confirmLabel;
		this.onConfirm = options.onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: this.title });
		contentEl.createEl("p", { text: this.message });

		const buttons = contentEl.createDiv({ cls: "df-cs-confirm-buttons" });
		const confirmBtn = buttons.createEl("button", {
			text: this.confirmLabel,
			cls: "mod-warning",
		});
		confirmBtn.addEventListener("click", () => {
			this.close();
			this.onConfirm();
		});
		buttons.createEl("button", { text: dfTranslate("ui.cancel") }).addEventListener("click", () => this.close());
	}

	onClose() {
		this.contentEl.empty();
	}
}
