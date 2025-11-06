import { Notice, Modal, App, Setting } from "obsidian";
import type DaggerForgePlugin from "../main";

/**
 * Modal for importing data from a JSON file
 */
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

		// File input
		const fileInputContainer = contentEl.createDiv({ cls: "df-file-input-container" });
		
		const fileInput = fileInputContainer.createEl("input", {
			type: "file",
			attr: {
				accept: ".json",
			}
		});

		// Import button
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
					let data = JSON.parse(text);

					// If data is a plain array, wrap it based on filename
					if (Array.isArray(data)) {
						data = this.wrapArrayBasedOnFilename(file.name, data);
					}

					// Validate the data structure
					if (!this.validateImportData(data)) {
						reject(new Error("Invalid data format"));
						return;
					}

					// Import the data
					await this.plugin.dataManager.importData(JSON.stringify(data));
					
					new Notice(`Successfully imported data from ${file.name}`);
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

	/**
	 * Wrap a plain array in an object based on the filename
	 */
	private wrapArrayBasedOnFilename(filename: string, array: any[]): any {
		const lowerName = filename.toLowerCase();
		
		// Check for source indicators in filename
		if (lowerName.includes('inc') || lowerName.includes('incredible')) {
			// Determine if it's adversaries or environments
			if (lowerName.includes('env')) {
				return { incredible_Environments: array };
			} else {
				return { incredible_Adversaries: array };
			}
		} else if (lowerName.includes('brosk')) {
			return { custom_Broskies: array };
		} else if (lowerName.includes('env')) {
			return { custom_Environments: array };
		} else {
			// Default to custom adversaries
			return { custom_Adversaries: array };
		}
	}

	private validateImportData(data: any): boolean {
		// Basic validation - check if it has the expected structure
		if (typeof data !== "object" || data === null) {
			return false;
		}

		// Check for required fields (at least one should exist)
		const hasAdversaries = Array.isArray(data.custom_Adversaries) || 
							   Array.isArray(data.incredible_Adversaries) ||
							   Array.isArray(data.custom_Broskies);
		
		const hasEnvironments = Array.isArray(data.custom_Environments) ||
								Array.isArray(data.incredible_Environments);

		return hasAdversaries || hasEnvironments;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
