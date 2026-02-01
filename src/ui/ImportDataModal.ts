import { Notice, Modal, App, Setting } from "obsidian";
import type DaggerForgePlugin from "../main";
import { refreshBrowsers } from "../utils/pluginOperations";

export class ImportDataModal extends Modal {
	private plugin: DaggerForgePlugin;

	constructor(app: App, plugin: DaggerForgePlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Import Data" });
		contentEl.createEl("p", { 
			text: "Select a JSON file to import adversaries and environments. This will merge with your existing data."
		});

		const fileInputContainer = contentEl.createDiv({ cls: "df-file-input-container" });
		const fileInput = fileInputContainer.createEl("input", {
			type: "file",
			attr: {
				accept: ".json",
			}
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Import")
					.setCta()
					.onClick(async () => {
						const file = fileInput.files?.[0];
						if (!file) {
							new Notice("Please select a file first");
							return;
						}
						try {
							await this.importFile(file);
							this.close();
						} catch (error) {
							console.error("Import error:", error);
							new Notice(`Import failed: ${error.message}`);
						}
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Cancel")
					.onClick(() => {
						this.close();
					})
			);
	}

	private async importFile(file: File): Promise<void> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = async (e) => {
				try {
					const text = e.target?.result as string;
					const data = JSON.parse(text);

					if (!this.validateImportData(data)) {
						reject(new Error("Invalid data format. File must contain 'adversaries' or 'environments' arrays."));
						return;
					}

					await this.plugin.dataManager.importData(text);
					new Notice(`Successfully imported data from ${file.name}`);
					refreshBrowsers(this.plugin);
					resolve();
				} catch (error) {
					reject(error);
				}
			};

			reader.onerror = () => {
				reject(new Error("Failed to read file"));
			};
			reader.readAsText(file);
		});
	}

	private validateImportData(data: any): boolean {
		if (typeof data !== "object" || data === null) {
			return false;
		}

		const hasAdversaries = Array.isArray(data.adversaries);
		const hasEnvironments = Array.isArray(data.environments);

		return hasAdversaries || hasEnvironments;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
