import { Modal, App, Notice } from "obsidian";
import type DaggerForgePlugin from "../../main";

/**
 * Modal for confirming data file deletion
 */
export class DeleteConfirmModal extends Modal {
	private plugin: DaggerForgePlugin;
	private onConfirm: () => Promise<void>;

	constructor(app: App, plugin: DaggerForgePlugin, onConfirm: () => Promise<void>) {
		super(app);
		this.plugin = plugin;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Delete Data File?" });
		
		contentEl.createEl("p", { 
			text: "Are you sure you want to delete the data.json file?",
			cls: "df-delete-warning"
		});

		contentEl.createEl("p", {
			text: "This will permanently remove ALL stored adversaries and environments.",
			cls: "df-delete-warning-bold"
		});

		contentEl.createEl("p", {
			text: "This action cannot be undone!",
			cls: "df-delete-warning-bold"
		});

		const buttonContainer = contentEl.createDiv({ cls: "df-delete-button-container" });

		const deleteBtn = buttonContainer.createEl("button", {
			text: "Delete",
			cls: "df-delete-confirm-btn"
		});
		deleteBtn.addEventListener("click", async () => {
			try {
				await this.onConfirm();
				new Notice("Data file deleted successfully!");
				this.close();
			} catch (err) {
				new Notice("Error deleting data file: " + (err as Error).message);
				console.error("Error deleting data file:", err);
			}
		});

		const cancelBtn = buttonContainer.createEl("button", {
			text: "Cancel",
			cls: "df-delete-cancel-btn"
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}