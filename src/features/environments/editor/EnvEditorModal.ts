import { Modal, Editor } from "obsidian";
import type DaggerForgePlugin from "../../../main";
import { EnvironmentData, SavedFeatureState } from "../../../types/environment";
import { environmentToHTML } from "../components/EnvToHTML";

export class EnvironmentEditorModal extends Modal {
	plugin: DaggerForgePlugin;
	editor: Editor;
	cardElement: HTMLElement;
	cardData: EnvironmentData;
	inputs: Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = {};
	features: Array<{
		nameEl: HTMLInputElement;
		typeEl: HTMLSelectElement;
		costEl: HTMLSelectElement;
		textEl: HTMLTextAreaElement;
		bulletEls: HTMLTextAreaElement[];
		afterTextEl: HTMLTextAreaElement;
		questionEls: HTMLTextAreaElement[];
	}> = [];
	featureContainer: HTMLElement;
	onSubmit?: (newHTML: string) => void;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor,
		cardElement: HTMLElement,
		cardData: EnvironmentData
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.cardElement = cardElement;
		this.cardData = cardData;
}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Edit Environment", cls: "df-modal-title" });

		// ===== BASIC INFO SECTION =====
		const basicInfoSection = contentEl.createDiv({ cls: "df-env-form-section" });
		basicInfoSection.createEl("h3", { text: "Basic information", cls: "df-section-title" });
		const basicRow = basicInfoSection.createDiv({ cls: "df-env-row-basic-info" });

		// Name
		this.createField(basicRow, "name", "Name", "input", this.cardData.name);

		// Tier dropdown
		const tierSelect = this.createSelect(basicRow, "tier", "Tier", ["1", "2", "3", "4"]);
		tierSelect.value = this.cardData.tier.toString();

		// Type dropdown
		const typeSelect = this.createSelect(
			basicRow,
			"type",
			"Type",
			["Event", "Exploration", "Social", "Traversal"]
		);
		typeSelect.value = this.cardData.type;

		// ===== DETAILS SECTION =====
		const detailsSection = basicInfoSection.createDiv({ cls: "df-env-form-section-content" });

		// Description textarea
		this.createTextarea(detailsSection, "desc", "Description", this.cardData.desc);

		// ===== GAMEPLAY SECTION =====
		const gameplaySection = contentEl.createDiv({ cls: "df-env-form-section" });
		gameplaySection.createEl("h3", { text: "Gameplay", cls: "df-section-title" });

		const impulseRow = gameplaySection.createDiv({ cls: "df-env-row-impulse" });
		this.createField(impulseRow, "impulse", "Impulse", "input", this.cardData.impulse);

		// ===== DIFFICULTY SECTION =====
		const difficultySection = contentEl.createDiv({ cls: "df-env-form-section" });
		difficultySection.createEl("h3", { text: "Difficulty & adversaries", cls: "df-section-title" });

		const diffRow = difficultySection.createDiv({ cls: "df-env-row-difficulty" });

		this.createField(diffRow, "difficulty", "Difficulty", "input", this.cardData.difficulty);

		// Potential Adversaries on its own row
		const advRow = difficultySection.createDiv({ cls: "df-env-row-difficulty" });
		this.createField(
			advRow,
			"potentialAdversaries",
			"Potential Adversaries",
			"input",
			this.cardData.potentialAdversaries
		);

		// ===== FEATURES SECTION =====
		const featuresSection = contentEl.createDiv({ cls: "df-env-form-section" });
		featuresSection.createEl("h3", { text: "Features", cls: "df-section-title" });
		this.featureContainer = featuresSection.createDiv({ cls: "df-env-feature-container" });

		// Load saved features
		if (this.cardData.features && this.cardData.features.length > 0) {
			this.cardData.features.forEach((feature) => {
				this.addFeature(feature);
			});
		} else {
			this.addFeature();
		}

		const addBtn = featuresSection.createEl("button", {
			text: "+ Add Feature",
			cls: "df-env-btn-add-feature",
		});
		addBtn.onclick = () => this.addFeature();

		// Update button
		const buttonContainer = contentEl.createDiv({ cls: "df-env-form-buttons" });
		const updateBtn = buttonContainer.createEl("button", {
			text: "Update Card",
			cls: "df-env-btn-insert",
		});

		updateBtn.onclick = () => {
			const updatedEnv: EnvironmentData = {
				id: this.cardData.id,
				name: (this.inputs.name as HTMLInputElement).value.trim(),
				tier: Number((this.inputs.tier as HTMLSelectElement).value),
				type: (this.inputs.type as HTMLSelectElement).value,
				desc: (this.inputs.desc as HTMLTextAreaElement).value.trim(),
				impulse: (this.inputs.impulse as HTMLInputElement).value.trim(),
				difficulty: (this.inputs.difficulty as HTMLInputElement).value.trim(),
				potentialAdversaries: (this.inputs.potentialAdversaries as HTMLInputElement).value.trim(),
				source: this.cardData.source,
				features: this.getFeatureValues(),
			};
// Save to data manager
			this.plugin.dataManager.addEnvironment(updatedEnv);

			// Generate new HTML
			const newHTML = environmentToHTML(updatedEnv);

			if (this.onSubmit) {
				this.onSubmit(newHTML);
			}

			this.close();
		};
	}

	private createField(
		container: HTMLElement,
		key: string,
		label: string,
		type: "input" | "textarea" = "input",
		value: string = ""
	) {
		const wrapper = container.createDiv({ cls: "df-inline-field-wrapper" });
		wrapper.createEl("label", { text: label, cls: "df-env-form-label" });

		const input = wrapper.createEl(type === "textarea" ? "textarea" : "input", {
			cls: "df-env-form-input",
		}) as HTMLInputElement | HTMLTextAreaElement;

		if (type === "input") {
			(input as HTMLInputElement).type = "text";
		}
		input.value = value;
		this.inputs[key] = input;

		return input;
	}

	private createSelect(
		container: HTMLElement,
		key: string,
		label: string,
		options: string[]
	): HTMLSelectElement {
		const wrapper = container.createDiv({ cls: "df-inline-field-wrapper" });
		wrapper.createEl("label", { text: label, cls: "df-env-form-label" });

		const select = wrapper.createEl("select", { cls: "df-env-form-select" });
		options.forEach((opt) => {
			select.createEl("option", { text: opt, value: opt });
		});

		this.inputs[key] = select;
		return select;
	}

	private createTextarea(
		container: HTMLElement,
		key: string,
		label: string,
		value: string = ""
	): HTMLTextAreaElement {
		const wrapper = container.createDiv({ cls: "df-inline-field-wrapper" });
		wrapper.createEl("label", { text: label, cls: "df-env-form-label" });

		const textarea = wrapper.createEl("textarea", {
			cls: "df-env-form-textarea",
			attr: { rows: "4" },
		});
		textarea.value = value;
		this.inputs[key] = textarea;

		return textarea;
	}

	private addFeature(savedFeature?: SavedFeatureState) {
		const wrapper = this.featureContainer.createDiv({
			cls: "df-env-feature-block",
		});

		// Feature header row
		const headerRow = wrapper.createDiv({ cls: "df-env-feature-row" });

		// Name
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
			typeEl.createEl("option", { text: opt, value: opt })
		);
		typeEl.value = savedFeature?.type || "Passive";

		// Cost dropdown
		const costEl = headerRow.createEl("select", {
			cls: "df-env-feature-input-cost",
		});
		["", "Spend a Fear"].forEach((opt) =>
			costEl.createEl("option", { text: opt || "none", value: opt })
		);
		costEl.value = savedFeature?.cost || "";

		// Description
		wrapper.createDiv({ cls: "df-env-feature-desc-label", text: "Description:" });
		const textEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-desc",
			placeholder: "Feature description...",
			attr: { rows: "3" },
		});
		textEl.value = savedFeature?.text || "";

		// Bullets
		wrapper.createDiv({
			cls: "df-env-feature-bullets-header",
			text: "Bullet Points:",
		});
		const bulletsContainer = wrapper.createDiv({
			cls: "df-env-feature-bullets-container",
		});

		const bulletEls: HTMLTextAreaElement[] = [];

		// Create button first (we'll insert bullets before it)
		const addBulletBtn = document.createElement("button");
		addBulletBtn.textContent = "+ Add bullet point";
		addBulletBtn.className = "df-env-btn-add-bullet";
		bulletsContainer.appendChild(addBulletBtn);

		// Helper function to add bullet above the button
		const createBullet = (bulletText?: string) => {
			const bulletEl = document.createElement("textarea");
			bulletEl.className = "df-env-feature-input-bullet";
			bulletEl.placeholder = "Bullet point...";
			bulletEl.rows = 2;
			bulletEl.value = bulletText || "";
			// Insert before the button
			bulletsContainer.insertBefore(bulletEl, addBulletBtn);
			bulletEls.push(bulletEl);
			return bulletEl;
		};

		if (savedFeature?.bullets && savedFeature.bullets.length > 0) {
			savedFeature.bullets.forEach((bullet) => {
				createBullet(bullet);
			});
		} else {
			createBullet();
		}

		addBulletBtn.onclick = () => {
			createBullet();
		};

		// Text after
		wrapper.createDiv({
			cls: "df-env-feature-after-desc-header",
			text: "Continue Description (after bullets):",
		});
		const afterTextEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-after-desc",
			placeholder: "Additional description text...",
			attr: { rows: "3" },
		});
		afterTextEl.value = savedFeature?.textAfter || "";

		// Questions
		wrapper.createDiv({
			cls: "df-env-feature-question-header",
			text: "GM Prompt Questions:",
		});
		const questionsWrapper = wrapper.createDiv({
			cls: "df-env-questions-wrapper",
		});

		const questionEls: HTMLTextAreaElement[] = [];

		if (savedFeature?.questions && savedFeature.questions.length > 0) {
			savedFeature.questions.forEach((question) => {
				const questionEl = questionsWrapper.createEl("textarea", {
					cls: "df-env-feature-input-question",
					placeholder: 'e.g. "Why did this feature occur?"',
					attr: { rows: "2" },
				});
				questionEl.value = question;
				questionEls.push(questionEl);
			});
		} else {
			const questionEl = questionsWrapper.createEl("textarea", {
				cls: "df-env-feature-input-question",
				placeholder: 'e.g. "Why did this feature occur?"',
				attr: { rows: "2" },
			});
			questionEls.push(questionEl);
		}

		const addQuestionBtn = questionsWrapper.createEl("button", {
			text: "+ Add question",
			cls: "df-env-btn-add-question",
		});
		addQuestionBtn.onclick = () => {
			const questionEl = questionsWrapper.createEl("textarea", {
				cls: "df-env-feature-input-question",
				placeholder: 'e.g. "Why did this feature occur?"',
				attr: { rows: "2" },
			});
			questionEls.push(questionEl);
		};

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
			textEl,
			bulletEls,
			afterTextEl,
			questionEls,
		});
	}

	private getFeatureValues(): SavedFeatureState[] {
		return this.features.map((f) => ({
			name: f.nameEl.value.trim(),
			type: f.typeEl.value.trim(),
			cost: f.costEl.value.trim() || undefined,
			text: f.textEl.value.trim(),
			bullets: f.bulletEls
				.map((b) => b.value.trim())
				.filter((b) => b),
			textAfter: f.afterTextEl.value.trim() || undefined,
			questions: f.questionEls
				.map((q) => q.value.trim())
				.filter((q) => q),
		}));
	}

	onClose() {
		this.contentEl.empty();
	}
}
