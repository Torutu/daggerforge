import { Modal, Editor, Notice } from "obsidian";
import type DaggerForgePlugin from "../../../main";
import { createInlineField } from "../../../utils/formHelpers";
import { FormInputs } from "../../../types/shared";
import {
	FeatureElements,
	SavedFeatureState,
	EnvironmentData,
} from "../../../types/environment";
import { environmentToHTML } from "../components/EnvToHTML";

export class EnvironmentModal extends Modal {
	plugin: DaggerForgePlugin;
	editor: Editor;
	inputs: FormInputs = {};
	features: FeatureElements[] = [];
	featureContainer: HTMLElement;
	onSubmit: (result: EnvironmentData) => void;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor,
		onSubmit: (result: EnvironmentData) => void,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		const saved = this.plugin.savedInputStateEnv || {};
		contentEl.empty();

		// ===== TITLE =====
		contentEl.createEl("h2", { text: "Create Environment", cls: "df-modal-title" });

		// ===== BASIC INFO SECTION =====
		const basicInfoSection = contentEl.createDiv({ cls: "df-env-form-section" });
		basicInfoSection.createEl("h3", { text: "Basic Information", cls: "df-section-title" });

		const firstRow = basicInfoSection.createDiv({ cls: "df-env-form-row" });

		// Name field
		createInlineField(firstRow, this.inputs, {
			label: "Name",
			key: "name",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-name",
		});

		// Tier dropdown
		createInlineField(firstRow, this.inputs, {
			label: "Tier",
			key: "tier",
			type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: saved,
			customClass: "df-env-field-tier",
		});

		// Type dropdown
		createInlineField(firstRow, this.inputs, {
			label: "Type",
			key: "type",
			type: "select",
			options: ["Event", "Exploration", "Social", "Traversal"],
			savedValues: saved,
			customClass: "df-env-field-type",
		});

		// ===== DETAILS SECTION =====
		const detailsSection = basicInfoSection.createDiv({ cls: "df-env-form-section-content" });

		const descRow = detailsSection.createDiv({ cls: "df-env-form-row" });
		createInlineField(descRow, this.inputs, {
			label: "Description",
			key: "desc",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-desc",
		});

		// ===== GAMEPLAY SECTION =====
		const gameplaySection = contentEl.createDiv({ cls: "df-env-form-section" });
		gameplaySection.createEl("h3", { text: "Gameplay", cls: "df-section-title" });

		const impulseRow = gameplaySection.createDiv({ cls: "df-env-form-row" });
		createInlineField(impulseRow, this.inputs, {
			label: "Impulses",
			key: "impulse",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-impulse",
		});

		// ===== DIFFICULTY SECTION =====
		const difficultySection = contentEl.createDiv({ cls: "df-env-form-section" });
		difficultySection.createEl("h3", { text: "Difficulty & Adversaries", cls: "df-section-title" });

		const diffRow = difficultySection.createDiv({ cls: "df-env-form-row" });

		createInlineField(diffRow, this.inputs, {
			label: "Difficulty",
			key: "difficulty",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-difficulty",
		});

		createInlineField(diffRow, this.inputs, {
			label: "Potential Adversaries",
			key: "potentialAdversaries",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-adversaries",
		});

		// ===== FEATURES SECTION =====
		const featuresSection = contentEl.createDiv({ cls: "df-env-form-section" });
		featuresSection.createEl("h3", { text: "Features", cls: "df-section-title" });

		this.featureContainer = featuresSection.createDiv({ cls: "df-env-feature-container" });
		this.features = [];

		const setValueIfSaved = (
			key: string,
			el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
		) => {
			if (saved[key] !== undefined) {
				el.value = saved[key];
			}
		};

		// Load saved features if available
		const savedFeatures: SavedFeatureState[] = saved.features || [];
		savedFeatures.forEach((f) => {
			this.addFeature(f);
		});

		if (savedFeatures.length === 0) this.addFeature();

		const addBtn = featuresSection.createEl("button", {
			text: "+ Add Feature",
			cls: "df-env-btn-add-feature",
		});
		addBtn.onclick = () => this.addFeature();

		// ===== ACTION BUTTONS =====
		const buttonContainer = contentEl.createDiv({ cls: "df-env-form-buttons" });

		const insertBtn = buttonContainer.createEl("button", {
			text: "Insert Environment",
			cls: "df-env-btn-insert",
		});

		insertBtn.onclick = async () => {
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([k, el]) => [
					k,
					el.value.trim(),
				]),
			);
			const features = this.getFeatureValues();

			// Create environment data
			const env: EnvironmentData = {
				name: values.name || "",
				tier: Number(values.tier) || 1,
				type: values.type || "",
				desc: values.desc || "",
				impulse: values.impulse || "",
				difficulty: values.difficulty || "",
				potentialAdversaries: values.potentialAdversaries || "",
				source: "custom",
				features,
			};

			try {
				// Save using DataManager (Obsidian's saveData)
				await this.plugin.dataManager.addEnvironment(env);
				new Notice(
					`Environment "${env.name}" saved successfully!`,
				);

				// Insert into current note
				const htmlContent = environmentToHTML(env);
				this.editor.replaceSelection(
					`<div class="environment-block">\n${htmlContent}\n</div>\n`,
				);

				// Reset form
				for (const el of Object.values(this.inputs)) {
					if (
						el instanceof HTMLInputElement ||
						el instanceof HTMLTextAreaElement
					) {
						el.value = "";
					} else if (el instanceof HTMLSelectElement) {
						el.selectedIndex = 0;
					}
				}

				this.features.forEach(({ nameEl, typeEl, costEl, textEl }) => {
					nameEl.value = "";
					typeEl.selectedIndex = 0;
					if (costEl) costEl.selectedIndex = 0;
					textEl.value = "";
				});

				this.features = [];
				this.featureContainer.empty();
				this.plugin.savedInputStateEnv = {};

				// Refresh EnvironmentView if open to show the new environment
				const envLeaves =
					this.plugin.app.workspace.getLeavesOfType(
						"environment-view",
					);
				for (const leaf of envLeaves) {
					const v = leaf.view as any;
					if (typeof v?.refresh === "function") {
						await v.refresh();
					}
				}
				this.close();
			} catch (error) {
				console.error("Error saving environment:", error);
				new Notice(
					"Failed to save environment. Check console for details.",
				);
			}
		};
	}

	addFeature(savedFeature?: SavedFeatureState) {
		const wrapper = this.featureContainer.createDiv({
			cls: "df-env-feature-block",
		});

		// Feature header row (name - type : cost)
		const headerRow = wrapper.createDiv({ cls: "df-env-feature-row" });

		// Name input
		const nameEl = headerRow.createEl("input", {
			cls: "df-env-feature-input-name",
			placeholder: "Feature Name",
		});
		nameEl.value = savedFeature?.name || "";

		// Type dropdown
		const typeEl = headerRow.createEl("select", {
			cls: "df-env-feature-input-type",
		});
		["Action", "Reaction", "Passive"].forEach((opt) =>
			typeEl.createEl("option", {
				text: opt,
				value: opt,
				cls: "df-tier-option",
			}),
		);
		typeEl.value = savedFeature?.type || "Passive";

		// Cost dropdown
		const costEl = headerRow.createEl("select", {
			cls: "df-env-feature-input-cost",
		});
		["", "Spend a Fear"].forEach((opt) =>
			costEl.createEl("option", {
				text: opt || "none",
				value: opt,
				cls: "df-tier-option",
			}),
		);
		costEl.value = savedFeature?.cost || "";

		// Main feature description
		const descEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-desc",
			placeholder: "Feature description text...",
		});
		descEl.value = savedFeature?.text || "";

		// Question section
		const questionContainer = wrapper.createDiv({
			cls: "df-env-feature-question-container",
		});
		questionContainer.createDiv({
			cls: "df-env-feature-question-header",
			text: "GM Prompt Question:",
		});

		const questionEl = questionContainer.createEl("textarea", {
			cls: "df-env-feature-question-input",
			placeholder: "Q: Enter question for players...",
		});

		// Set value if saved question exists
		if (savedFeature?.questions && savedFeature.questions.length > 0) {
			questionEl.value = savedFeature.questions[0] || "";
		}

		// Remove button
		const removeBtn = wrapper.createEl("button", {
			text: "Remove Feature",
			cls: "df-env-btn-remove-feature",
		});
		removeBtn.onclick = () => {
			const index = this.features.findIndex((f) => f.nameEl === nameEl);
			if (index !== -1) {
				this.features.splice(index, 1);
				wrapper.remove();
			}
		};

		this.features.push({
			nameEl,
			typeEl,
			costEl,
			textEl: descEl,
			bulletEls: [],
			questionEls: [questionEl],
		});
	}

	getFeatureValues(): EnvironmentData["features"] {
		return this.features.map((f) => ({
			name: f.nameEl.value.trim(),
			type: f.typeEl.value.trim(),
			cost: f.costEl?.value.trim() || undefined,
			text: f.textEl.value.trim(),
			bullets: f.bulletEls.map((b) => b.value.trim()).filter((b) => b),
			questions: f.questionEls
				.map((q) => q.value.trim())
				.filter((q) => q),
		}));
	}

	onClose(): void {
		this.plugin.savedInputStateEnv = {};

		for (const [key, el] of Object.entries(this.inputs)) {
			this.plugin.savedInputStateEnv[key] = el.value;
		}

		this.plugin.savedInputStateEnv.features = this.getFeatureValues();
	}
}
