import { Modal, Editor, Notice } from "obsidian";
import { addEnvFeature, getEnvFeatureValues, envToHtml, Env_View_Type } from "../index";
import type DaggerForgePlugin from "../../../main";
import { EnvFeatureElements, EnvironmentData, FormStateElements } from "../../../types/index";
import {
	isMarkdownActive,
	isCanvasActive,
	createCanvasCard,
	getAvailableCanvasPosition,
	createInlineField,
} from "../../../utils/index";

// Data Assembly
// Builds a complete EnvironmentData object from raw form values and feature arrays.
// Used both when persisting a new environment and when passing updated data back
// through the onEditUpdate callback.

function assembleEnvironmentData(
	values: Record<string, string>,
	features: ReturnType<typeof getEnvFeatureValues>,
): EnvironmentData {
	return {
		id: values.id || "",
		name: values.name || "",
		tier: values.tier || "",
		type: values.type || "",
		desc: values.desc || "",
		impulse: values.impulse || "",
		difficulty: values.difficulty || "",
		potentialAdversaries: values.potentialAdversaries || "",
		source: "custom",
		features: features,
	};
}

async function persistEnvironment(
	plugin: DaggerForgePlugin,
	data: EnvironmentData,
): Promise<void> {
	try {
		await plugin.dataManager.addEnvironment(data);
		new Notice(`Environment "${data.name}" saved successfully!`);
	} catch (error) {
		console.error("Error saving environment:", error);
		new Notice("Failed to save environment. Check console for details.");
	}
}

// Modal
// Single modal for both create and edit flows.
//
// Edit mode is activated by passing cardData to the constructor. When present:
//   • The form pre-fills from cardData instead of the plugin's saved state.
//   • The submit button calls onEditUpdate (wired by cardEditor.ts) instead of
//     persisting + inserting a new card.
//   • onClose does not write back to the plugin's saved state — edit sessions
//     are ephemeral.

export class EnvironmentModal extends Modal {
	private plugin: DaggerForgePlugin;
	private editor: Editor | null;
	private inputs: FormStateElements = {};
	private features: EnvFeatureElements[] = [];
	private featureContainer!: HTMLElement;

	// Edit-mode fields
	private isEditMode: boolean;
	private editData: Record<string, unknown> = {};
	onEditUpdate?: (
		newHTML: string,
		newData: EnvironmentData,
	) => void | Promise<void>;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor | null,
		cardData?: EnvironmentData,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.isEditMode = !!cardData;

		if (cardData) {
			this.editData = cardData;
		}
	}

	// Form Construction

	onOpen(): void {
		// In edit mode we use the card data; in create mode we use
		// whatever the user left in the form last time (persisted on the plugin).
		const saved = this.isEditMode
			? this.editData
			: this.plugin.savedInputStateEnv || {};

		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", {
			text: this.isEditMode ? "Edit environment" : "Create environment",
			cls: "df-modal-title",
		});

		this.buildBasicInfoSection(contentEl, saved);
		this.buildGameplaySection(contentEl, saved);
		this.buildDifficultySection(contentEl, saved);
		this.buildFeaturesSection(contentEl, saved);
		this.buildActionButtons(contentEl);
	}

	private buildBasicInfoSection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Basic information", cls: "df-section-title" });

		const row = section.createDiv({ cls: "df-env-row-basic-info" });

		createInlineField(row, this.inputs, {
			label: "Name",
			key: "name",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-name",
		});

		createInlineField(row, this.inputs, {
			label: "Tier",
			key: "tier",
			type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: saved,
			customClass: "df-env-field-tier",
		});

		createInlineField(row, this.inputs, {
			label: "Type",
			key: "type",
			type: "select",
			options: ["Event", "Exploration", "Social", "Traversal"],
			savedValues: saved,
			customClass: "df-env-field-type",
		});

		const details = section.createDiv({ cls: "df-env-form-section-content" });
		const descTextarea = details.createEl("textarea", {
			cls: "df-env-field-desc-textarea",
			attr: { placeholder: "Enter environment description...", rows: "4" },
		});
		this.inputs["desc"] = descTextarea;
		if (saved["desc"]) descTextarea.value = String(saved["desc"]);
	}

	private buildGameplaySection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Gameplay", cls: "df-section-title" });

		const row = section.createDiv({ cls: "df-env-row-impulse" });
		createInlineField(row, this.inputs, {
			label: "Impulses",
			key: "impulse",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-impulse",
		});
	}

	private buildDifficultySection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", {
			text: "Difficulty & adversaries",
			cls: "df-section-title",
		});

		const diffRow = section.createDiv({ cls: "df-env-row-difficulty" });
		createInlineField(diffRow, this.inputs, {
			label: "Difficulty",
			key: "difficulty",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-difficulty",
		});

		const advRow = section.createDiv({ cls: "df-env-row-adversaries" });
		createInlineField(advRow, this.inputs, {
			label: "Potential adversaries",
			key: "potentialAdversaries",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-adversaries",
		});
	}

	private buildFeaturesSection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Features", cls: "df-section-title" });

		this.featureContainer = section.createDiv({ cls: "df-env-feature-container" });
		this.features = [];

		const savedFeatures = saved.features as Array<Record<string, unknown>> | undefined;

		if (Array.isArray(savedFeatures) && savedFeatures.length > 0) {
			savedFeatures.forEach((data) => {
				addEnvFeature(this.featureContainer, this.features, {
					name: String(data.name || ""),
					type: String(data.type || "Passive"),
					cost: data.cost ? String(data.cost) : undefined,
					text: String(data.text || ""),
					bullets: Array.isArray(data.bullets)
						? data.bullets.map((b) => String(b))
						: null,
					textAfter: data.textAfter ? String(data.textAfter) : undefined,
					questions: Array.isArray(data.questions)
						? data.questions.map((q) => String(q))
						: [],
				});
			});
		} else {
			addEnvFeature(this.featureContainer, this.features);
		}

		const addBtn = section.createEl("button", {
			text: "+ Add feature",
			cls: "df-env-btn-add-feature",
		});
		addBtn.onclick = () => addEnvFeature(this.featureContainer, this.features);
	}

	private buildActionButtons(contentEl: HTMLElement) {
		const container = contentEl.createDiv({ cls: "df-env-form-buttons" });

		const btn = container.createEl("button", {
			text: this.isEditMode ? "Update card" : "Insert card",
			cls: "df-env-btn-insert",
		});

		btn.onclick = () => this.handleSubmit();
	}

	// Submit Logic
	// Split into three paths so the main handler stays short:
	//   1. Edit mode  -> delegate to onEditUpdate, then close.
	//   2. Canvas     -> persist + insert canvas card.
	//   3. Markdown   -> persist + insert into editor.

	private async handleSubmit() {
		const values = this.readFormValues();
		const features = getEnvFeatureValues(this.features);
		const newHTML = envToHtml(assembleEnvironmentData(values, features));
		const newData = assembleEnvironmentData(values, features);

		if (this.onEditUpdate) {
			await this.onEditUpdate(newHTML, newData);
			this.close();
			return;
		}

		await persistEnvironment(this.plugin, newData);
		this.insertCard(newHTML);
		this.resetForm();
		this.refreshBrowserView();
		this.close();
	}

	private readFormValues(): Record<string, string> {
		return Object.fromEntries(
			Object.entries(this.inputs).map(([key, el]) => [
				key,
				(el as HTMLInputElement | HTMLTextAreaElement).value.trim(),
			]),
		);
	}

	private insertCard(html: string) {
		const wrapped = `<div class="environment-block">\n${html}\n</div>\n`;

		if (isCanvasActive(this.app)) {
			const pos = getAvailableCanvasPosition(this.plugin.app);
			createCanvasCard(this.plugin.app, wrapped, {
				x: pos.x,
				y: pos.y,
				width: 400,
				height: 650,
			});
		} else if (isMarkdownActive(this.app) && this.editor) {
			this.editor.replaceSelection(wrapped);
		}
	}

	private resetForm() {
		for (const el of Object.values(this.inputs)) {
			if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
				el.value = "";
			} else if (el instanceof HTMLSelectElement) {
				el.selectedIndex = 0;
			}
		}

		this.features = [];
		this.featureContainer.empty();
		this.plugin.savedInputStateEnv = {};
	}

	private refreshBrowserView() {
		const leaves = this.plugin.app.workspace.getLeavesOfType(Env_View_Type);
		for (const leaf of leaves) {
			const v = leaf.view as { refresh?: () => void | Promise<void> };
			if (typeof v?.refresh === "function") {
				v.refresh();
			}
		}
	}

	// Close
	// Edit sessions are ephemeral — nothing is persisted on close.
	// Create sessions snapshot the current form so the user can reopen and
	// continue where they left off.

	onClose(): void {
		if (this.isEditMode) return;

		this.plugin.savedInputStateEnv = {};

		for (const [key, el] of Object.entries(this.inputs)) {
			this.plugin.savedInputStateEnv[key] = (
				el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			).value;
		}

		this.plugin.savedInputStateEnv.features = getEnvFeatureValues(this.features);
	}
}
