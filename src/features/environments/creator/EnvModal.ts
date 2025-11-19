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
import { isMarkdownActive, isCanvasActive, createCanvasCard, getAvailableCanvasPosition } from "../../../utils/canvasHelpers";

export class EnvironmentModal extends Modal {
	plugin: DaggerForgePlugin;
	editor: Editor;
	inputs: FormInputs = {};
	features: FeatureElements[] = [];
	featureContainer: HTMLElement;
	onSubmit: (result: EnvironmentData) => void;
	isEditMode: boolean = false;
	editModeState: Record<string, any> = {};
	isSubmitted: boolean = false;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor,
		onSubmit: (result: EnvironmentData) => void,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.onSubmit = onSubmit;
		
		// Detect edit mode: if there's environment-specific data in plugin.savedInputStateEnv
		const savedState = plugin.savedInputStateEnv;
		this.isEditMode = !!(savedState && 
			(savedState.impulse !== undefined || 
			 savedState.potentialAdversaries !== undefined));
		
		console.log("🔧 EnvironmentModal constructor - isEditMode:", this.isEditMode);
		
		if (this.isEditMode) {
			console.log("✏️ EDIT MODE: Using environment data for editing");
			this.editModeState = {
				...savedState,
				features: savedState.features || []
			};
			console.log("✏️ EDIT MODE: editModeState:", this.editModeState);
		} else {
			console.log("📝 CREATE MODE: No edit data, starting fresh");
		}
	}

	onOpen(): void {
		console.log("═══════════════════════════════════════");
		console.log("📖 onOpen() called");
		console.log("IS EDIT MODE:", this.isEditMode);
		
		const { contentEl } = this;
		// Use editModeState if editing, otherwise use plugin's saved state
		const saved = this.isEditMode ? this.editModeState : (this.plugin.savedInputStateEnv || {});
		
		console.log("Using state from:", this.isEditMode ? "✏️ EDIT MODE (local/isolated)" : "📝 CREATE MODE (plugin saved)");
		console.log("═══════════════════════════════════════");
		contentEl.empty();

		// ===== TITLE =====
		const title = this.isEditMode ? "Edit environment" : "Create environment";
		contentEl.createEl("h2", { text: title, cls: "df-modal-title" });

		// ===== BASIC INFO SECTION =====
		const basicInfoSection = contentEl.createDiv({ cls: "df-env-form-section" });
		basicInfoSection.createEl("h3", { text: "Basic information", cls: "df-section-title" });

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

		// Description textarea (full width, resizable)
		const descTextarea = detailsSection.createEl("textarea", {
			cls: "df-env-field-desc-textarea",
			attr: {
				placeholder: "Enter environment description...",
				rows: "4"
			}
		});
		this.inputs["desc"] = descTextarea;
		if (saved["desc"]) {
			descTextarea.value = saved["desc"];
		}

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
		difficultySection.createEl("h3", { text: "Difficulty & adversaries", cls: "df-section-title" });

		const diffRow = difficultySection.createDiv({ cls: "df-env-form-row" });

		createInlineField(diffRow, this.inputs, {
			label: "Difficulty",
			key: "difficulty",
			type: "input",
			savedValues: saved,
			customClass: "df-env-field-difficulty",
		});

		// Potential Adversaries on its own row
		const advRow = difficultySection.createDiv({ cls: "df-env-form-row df-env-row-adversaries" });
		createInlineField(advRow, this.inputs, {
			label: "Potential adversaries",
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

		// Load saved features if available
		const savedFeatures: SavedFeatureState[] = saved.features || [];
		if (savedFeatures.length > 0) {
			savedFeatures.forEach((f) => {
				this.addFeature(f);
			});
		} else {
			this.addFeature();
		}

		const addBtn = featuresSection.createEl("button", {
			text: "+ Add feature",
			cls: "df-env-btn-add-feature",
		});
		addBtn.onclick = () => this.addFeature();

		// ===== ACTION BUTTONS =====
		const buttonContainer = contentEl.createDiv({ cls: "df-env-form-buttons" });

		const insertBtn = buttonContainer.createEl("button", {
			text: this.isEditMode ? "Update card" : "Insert card",
			cls: "df-env-btn-insert",
		});

		insertBtn.onclick = async () => {
			this.isSubmitted = true;
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([k, el]) => [
					k,
					el.value.trim(),
				]),
			);
			const features = this.getFeatureValues();

			// Create environment data
			const env: EnvironmentData = {
				id: values.id || "",
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

				// If in edit mode, call onSubmit callback to handle markdown updates
				if (this.isEditMode) {
					this.onSubmit(env);
					this.close();
					return;
				}

				// Generate HTML content
				const htmlContent = environmentToHTML(env);
				const wrappedHTML = `<div class="environment-block">\n${htmlContent}\n</div>\n`;

				const isCanvas = isCanvasActive(this.app);
				const isMarkdown = isMarkdownActive(this.app);

				// Check if we're on a canvas
				if (isCanvas) {
					const position = getAvailableCanvasPosition(this.plugin.app);
					const success = createCanvasCard(this.plugin.app, wrappedHTML, {
						x: position.x,
						y: position.y,
						width: 400,
						height: 650
					});
				} else if (isMarkdown) {
					// Insert into markdown editor
					this.editor.replaceSelection(wrappedHTML);
				}

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

				this.features.forEach(({ nameEl, typeEl, costEl, textEl, bulletEls, afterTextEl, questionEls }) => {
					nameEl.value = "";
					typeEl.selectedIndex = 0;
					if (costEl) costEl.selectedIndex = 0;
					textEl.value = "";
					bulletEls.forEach(b => b.value = "");
					afterTextEl.value = "";
					questionEls.forEach(q => q.value = "");
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
			attr: {
				name: "data-feature-name",
			}
		});
		nameEl.value = savedFeature?.name || "";

		// Type dropdown
		const typeEl = headerRow.createEl("select", {
			cls: "df-env-feature-input-type",
			attr: {
				name: "data-feature-type",
			}
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
			attr: {
				name: "data-feature-cost",
			}
		});
		["", "Spend a Fear"].forEach((opt) =>
			costEl.createEl("option", {
				text: opt || "none",
				value: opt,
				cls: "df-tier-option",
			}),
		);
		costEl.value = savedFeature?.cost || "";

		// Primary feature description
		const descLabel = wrapper.createDiv({ cls: "df-env-feature-desc-label", text: "Description:" });
		const textEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-desc",
			placeholder: "Feature description...",
			attr: {
				rows: "3",
				name: "data-feature-text",
			}
		});
		textEl.value = savedFeature?.text || "";

		// Bullets section
		const bulletsHeader = wrapper.createDiv({
			cls: "df-env-feature-bullets-header",
			text: "Bullet Points:",
		});

		const bulletsContainer = wrapper.createDiv({
			cls: "df-env-feature-bullets-container",
		});

		const bulletEls: HTMLInputElement[] = [];
		
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
			bulletEl.setAttribute("name", "data-feature-bullet");
			// Insert before the button
			bulletsContainer.insertBefore(bulletEl, addBulletBtn);
			bulletEls.push(bulletEl as HTMLInputElement);
			return bulletEl;
		};
		
		if (savedFeature?.bullets && savedFeature.bullets.length > 0) {
			savedFeature.bullets.forEach((bullet) => {
				createBullet(bullet);
			});
		} else {
			// Add one empty bullet by default
			createBullet();
		}

		addBulletBtn.onclick = () => {
			createBullet();
		};

		// After description section
		const afterDescHeader = wrapper.createDiv({
			cls: "df-env-feature-after-desc-header",
			text: "Continue Description (after bullets):",
		});

		const afterTextEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-after-desc",
			placeholder: "Additional description text (appears after bullet points)...",
			attr: {
				rows: "3"
			}
		});
		afterTextEl.value = savedFeature?.textAfter || "";

		// Questions section
		const questionContainer = wrapper.createDiv({
			cls: "df-env-feature-question-container",
		});
		const questionHeader = questionContainer.createDiv({
			cls: "df-env-feature-question-header",
			text: "GM Prompt Questions:",
		});

		const questionsWrapper = questionContainer.createDiv({
			cls: "df-env-questions-wrapper",
		});

		const questionEls: HTMLTextAreaElement[] = [];

		if (savedFeature?.questions && savedFeature.questions.length > 0) {
			savedFeature.questions.forEach((question) => {
				const questionEl = questionsWrapper.createEl("textarea", {
					cls: "df-env-feature-input-question",
					placeholder: 'e.g. "Why did this feature occur?"',
					attr: {
						rows: "2"
					}
				});
				questionEl.value = question;
				questionEls.push(questionEl);
			});
		} else {
			// Add one empty question by default
			const questionEl = questionsWrapper.createEl("textarea", {
				cls: "df-env-feature-input-question",
				placeholder: 'e.g. "Why did this feature occur?"',
				attr: {
					rows: "2"
				}
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
				attr: {
					rows: "2"
				}
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

	getFeatureValues() {
		return this.features.map((f) => {
			const featureValue: SavedFeatureState = {
				name: f.nameEl.value.trim(),
				type: f.typeEl.value.trim(),
				cost: f.costEl?.value.trim() || undefined,
				text: f.textEl.value.trim(),
				bullets: f.bulletEls.map((b) => b.value.trim()).filter((b) => b) || null,
				textAfter: f.afterTextEl.value.trim() || undefined,
				questions: f.questionEls
					.map((q) => q.value.trim())
					.filter((q) => q),
			};
			
			return featureValue;
		});
	}

	onClose(): void {
		console.log("═══════════════════════════════════════");
		console.log("🔚 onClose() called");
		console.log("IS EDIT MODE:", this.isEditMode);
		console.log("IS SUBMITTED:", this.isSubmitted);
		
		// If in edit mode, ALWAYS clear plugin state (whether submitted or not)
		if (this.isEditMode) {
			console.log("✏️ EDIT MODE: Clearing plugin.savedInputStateEnv completely");
			this.plugin.savedInputStateEnv = {};
			this.editModeState = {};
			this.features = [];
			console.log("✅ Next create will be fresh - no contamination from edit data");
			console.log("═══════════════════════════════════════");
			return; // Exit early
		}

		// If not submitted (user closed without saving), don't save state
		if (!this.isSubmitted) {
			console.log("📝 CREATE MODE: User cancelled (not submitted) - clearing state");
			this.plugin.savedInputStateEnv = {};
			this.features = [];
			console.log("═══════════════════════════════════════");
			return;
		}

		// CREATE MODE + SUBMITTED: Save state for next time
		console.log("📝 CREATE MODE: User submitted - Saving state to plugin.savedInputStateEnv");
		this.plugin.savedInputStateEnv = {};

		for (const [key, el] of Object.entries(this.inputs)) {
			this.plugin.savedInputStateEnv[key] = el.value;
		}

		this.plugin.savedInputStateEnv.features = this.getFeatureValues();
		console.log("📝 CREATE MODE: State saved:", this.plugin.savedInputStateEnv);
		console.log("═══════════════════════════════════════");
	}
}
