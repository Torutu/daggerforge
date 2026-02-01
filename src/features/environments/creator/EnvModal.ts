import { Modal, Editor, Notice } from "obsidian";
import type DaggerForgePlugin from "../../../main";
import { environmentToHTML } from "../components/EnvToHTML";
import {
	EnvFeatureElements,
	EnvSavedFeatureState,
	EnvironmentData,
	FormInputs,
} from "../../../types/index";
import {
	isMarkdownActive,
	isCanvasActive,
	createCanvasCard,
	getAvailableCanvasPosition,
	createInlineField,
} from "../../../utils/index";

// ─── Modal ─────────────────────────────────────────────────────────────────
// Single modal for both create and edit flows, mirroring the adversary pattern.
//
// Edit mode is activated by passing cardData to the constructor. When present:
//   • The form pre-fills from cardData.
//   • The submit button calls onEditUpdate instead of persisting + inserting.
//   • onClose does not write back to the plugin's saved state.

export class EnvironmentModal extends Modal {
	private plugin: DaggerForgePlugin;
	private editor: Editor | null;
	private inputs: FormInputs = {};
	private features: EnvFeatureElements[] = [];
	private featureContainer!: HTMLElement;
	private isSubmitted = false;

	// Edit-mode fields
	private isEditMode: boolean;
	private editData: EnvironmentData | null;
	onEditUpdate?: (newHTML: string, newData: EnvironmentData) => void | Promise<void>;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor | null,
		cardData?: EnvironmentData,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.isEditMode = !!cardData;
		this.editData = cardData ?? null;
	}

	// ─── Form Construction ───────────────────────────────────────────────

	onOpen(): void {
		const saved: Record<string, unknown> = this.isEditMode && this.editData
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

	private buildBasicInfoSection(contentEl: HTMLElement, saved: Record<string, unknown>) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Basic information", cls: "df-section-title" });

		const row = section.createDiv({ cls: "df-env-row-basic-info" });

		createInlineField(row, this.inputs, {
			label: "Name", key: "name", type: "input",
			savedValues: saved, customClass: "df-env-field-name",
		});
		createInlineField(row, this.inputs, {
			label: "Tier", key: "tier", type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: saved, customClass: "df-env-field-tier",
		});
		createInlineField(row, this.inputs, {
			label: "Type", key: "type", type: "select",
			options: ["Event", "Exploration", "Social", "Traversal"],
			savedValues: saved, customClass: "df-env-field-type",
		});

		const details = section.createDiv({ cls: "df-env-form-section-content" });
		const descTextarea = details.createEl("textarea", {
			cls: "df-env-field-desc-textarea",
			attr: { placeholder: "Enter environment description...", rows: "4" },
		});
		this.inputs["desc"] = descTextarea;
		if (saved["desc"]) descTextarea.value = String(saved["desc"]);
	}

	private buildGameplaySection(contentEl: HTMLElement, saved: Record<string, unknown>) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Gameplay", cls: "df-section-title" });

		const row = section.createDiv({ cls: "df-env-row-impulse" });
		createInlineField(row, this.inputs, {
			label: "Impulses", key: "impulse", type: "input",
			savedValues: saved, customClass: "df-env-field-impulse",
		});
	}

	private buildDifficultySection(contentEl: HTMLElement, saved: Record<string, unknown>) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Difficulty & adversaries", cls: "df-section-title" });

		const diffRow = section.createDiv({ cls: "df-env-row-difficulty" });
		createInlineField(diffRow, this.inputs, {
			label: "Difficulty", key: "difficulty", type: "input",
			savedValues: saved, customClass: "df-env-field-difficulty",
		});

		const advRow = section.createDiv({ cls: "df-env-row-adversaries" });
		createInlineField(advRow, this.inputs, {
			label: "Potential adversaries", key: "potentialAdversaries", type: "input",
			savedValues: saved, customClass: "df-env-field-adversaries",
		});
	}

	private buildFeaturesSection(contentEl: HTMLElement, saved: Record<string, unknown>) {
		const section = contentEl.createDiv({ cls: "df-env-form-section" });
		section.createEl("h3", { text: "Features", cls: "df-section-title" });

		this.featureContainer = section.createDiv({ cls: "df-env-feature-container" });
		this.features = [];

		const savedFeatures = (saved.features || []) as EnvSavedFeatureState[];
		if (savedFeatures.length > 0) {
			savedFeatures.forEach((f) => this.addFeature(f));
		} else {
			this.addFeature();
		}

		const addBtn = section.createEl("button", {
			text: "+ Add feature", cls: "df-env-btn-add-feature",
		});
		addBtn.onclick = () => this.addFeature();
	}

	private buildActionButtons(contentEl: HTMLElement) {
		const container = contentEl.createDiv({ cls: "df-env-form-buttons" });
		const btn = container.createEl("button", {
			text: this.isEditMode ? "Update card" : "Insert card",
			cls: "df-env-btn-insert",
		});
		btn.onclick = () => this.handleSubmit();
	}

	// ─── Feature Row ──────────────────────────────────────────────────────
	// Each feature is a self-contained block: name/type/cost header, a
	// description textarea, bullet points, a continuation textarea, and GM
	// prompt questions.

	private addFeature(savedFeature?: EnvSavedFeatureState) {
		const wrapper = this.featureContainer.createDiv({ cls: "df-env-feature-block" });
		const headerRow = wrapper.createDiv({ cls: "df-env-feature-row" });

		const nameEl = this.createFeatureInput(headerRow, savedFeature?.name, "Feature Name", "df-env-feature-input-name");
		const typeEl = this.createFeatureSelect(headerRow, savedFeature?.type ?? "Passive", ["Action", "Reaction", "Passive"], "df-env-feature-input-type");
		const costEl = this.createFeatureSelect(headerRow, savedFeature?.cost ?? "", ["", "Spend a Fear"], "df-env-feature-input-cost", true);

		wrapper.createDiv({ cls: "df-env-feature-desc-label", text: "Description:" });
		const textEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-desc",
			attr: { placeholder: "Feature description...", rows: "3" },
		});
		textEl.value = savedFeature?.text || "";

		const bulletEls = this.createBulletSection(wrapper, savedFeature?.bullets);

		wrapper.createDiv({
			cls: "df-env-feature-after-desc-header",
			text: "Continue description (after bullets):",
		});
		const afterTextEl = wrapper.createEl("textarea", {
			cls: "df-env-feature-input-after-desc",
			attr: {
				placeholder: "Additional description text (appears after bullet points)...",
				rows: "3",
			},
		});
		afterTextEl.value = savedFeature?.textAfter || "";

		const questionEls = this.createQuestionSection(wrapper, savedFeature?.questions);

		const removeBtn = wrapper.createEl("button", {
			text: "Remove Feature", cls: "df-env-btn-remove-feature",
		});
		removeBtn.onclick = () => {
			const idx = this.features.findIndex((f) => f.nameEl === nameEl);
			if (idx !== -1) {
				this.features.splice(idx, 1);
				wrapper.remove();
			}
		};

		this.features.push({ nameEl, typeEl, costEl, textEl, bulletEls, afterTextEl, questionEls });
	}

	private createFeatureInput(
		container: HTMLElement,
		value: string | undefined,
		placeholder: string,
		cls: string,
	): HTMLInputElement {
		const el = container.createEl("input", { cls, placeholder });
		el.value = value || "";
		return el;
	}

	private createFeatureSelect(
		container: HTMLElement,
		value: string,
		options: string[],
		cls: string,
		showNoneLabel = false,
	): HTMLSelectElement {
		const el = container.createEl("select", { cls });
		options.forEach((opt) =>
			el.createEl("option", {
				text: showNoneLabel && opt === "" ? "none" : opt,
				value: opt,
				cls: "df-tier-option",
			}),
		);
		el.value = value;
		return el;
	}

	private createBulletSection(wrapper: HTMLElement, saved?: string[] | null): HTMLInputElement[] {
		wrapper.createDiv({ cls: "df-env-feature-bullets-header", text: "Bullet Points:" });
		const container = wrapper.createDiv({ cls: "df-env-feature-bullets-container" });

		const bulletEls: HTMLInputElement[] = [];
		const addBtn = document.createElement("button");
		addBtn.textContent = "+ Add bullet point";
		addBtn.className = "df-env-btn-add-bullet";
		container.appendChild(addBtn);

		const createBullet = (text?: string) => {
			const el = document.createElement("input");
			el.className = "df-env-feature-input-bullet";
			el.placeholder = "Bullet point...";
			el.value = text || "";
			container.insertBefore(el, addBtn);
			bulletEls.push(el);
		};

		if (saved && saved.length > 0) {
			saved.forEach((b) => createBullet(b));
		} else {
			createBullet();
		}

		addBtn.onclick = () => createBullet();
		return bulletEls;
	}

	private createQuestionSection(wrapper: HTMLElement, saved?: string[]): HTMLTextAreaElement[] {
		const container = wrapper.createDiv({ cls: "df-env-feature-question-container" });
		container.createDiv({ cls: "df-env-feature-question-header", text: "GM Prompt Questions:" });
		const questionsWrapper = container.createDiv({ cls: "df-env-questions-wrapper" });
		const questionEls: HTMLTextAreaElement[] = [];

		const addBtn = questionsWrapper.createEl("button", {
			text: "+ Add question", cls: "df-env-btn-add-question",
		});

		const createQuestion = (text?: string) => {
			const el = questionsWrapper.createEl("textarea", {
				cls: "df-env-feature-input-question",
				attr: { placeholder: 'e.g. "Why did this feature occur?"', rows: "2" },
			});
			el.value = text || "";
			questionEls.push(el);
			// Keep the add button at the end
			questionsWrapper.appendChild(addBtn);
		};

		if (saved && saved.length > 0) {
			saved.forEach((q) => createQuestion(q));
		} else {
			createQuestion();
		}

		addBtn.onclick = () => createQuestion();
		return questionEls;
	}

	// ─── Submit Logic ─────────────────────────────────────────────────────

	private async handleSubmit() {
		this.isSubmitted = true;
		const env = this.assembleEnvironmentData();

		try {
			await this.plugin.dataManager.addEnvironment(env);
			new Notice(`Environment "${env.name}" saved successfully!`);
		} catch (error) {
			console.error("Error saving environment:", error);
			new Notice("Failed to save environment. Check console for details.");
			return;
		}

		if (this.isEditMode && this.onEditUpdate) {
			const html = environmentToHTML(env);
			await this.onEditUpdate(html, env);
			this.close();
			return;
		}

		this.insertCard(env);
		this.resetForm();
		this.refreshBrowserView();
		this.close();
	}

	private assembleEnvironmentData(): EnvironmentData {
		const values = Object.fromEntries(
			Object.entries(this.inputs).map(([k, el]) => [k, el.value.trim()]),
		);

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
			features: this.readFeatureValues(),
		};
	}

	private readFeatureValues(): EnvSavedFeatureState[] {
		return this.features.map((f) => ({
			name: f.nameEl.value.trim(),
			type: f.typeEl.value.trim(),
			cost: f.costEl?.value.trim() || undefined,
			text: f.textEl.value.trim(),
			bullets: f.bulletEls.map((b) => b.value.trim()).filter(Boolean) || null,
			textAfter: f.afterTextEl.value.trim() || undefined,
			questions: f.questionEls.map((q) => q.value.trim()).filter(Boolean),
		}));
	}

	private insertCard(env: EnvironmentData) {
		const html = environmentToHTML(env);
		const wrapped = `<div class="environment-block">\n${html}\n</div>\n`;

		if (isCanvasActive(this.app)) {
			const pos = getAvailableCanvasPosition(this.plugin.app);
			createCanvasCard(this.plugin.app, wrapped, {
				x: pos.x, y: pos.y, width: 400, height: 650,
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
		const leaves = this.plugin.app.workspace.getLeavesOfType("environment-view");
		for (const leaf of leaves) {
			const v = leaf.view as { refresh?: () => void | Promise<void> };
			if (typeof v?.refresh === "function") v.refresh();
		}
	}

	// ─── Close ────────────────────────────────────────────────────────────
	// Edit sessions are ephemeral. Create sessions snapshot the form state so
	// the user can reopen and continue where they left off — but only if the
	// form was not successfully submitted.

	onClose(): void {
		if (this.isEditMode || this.isSubmitted) {
			this.plugin.savedInputStateEnv = {};
			return;
		}

		this.plugin.savedInputStateEnv = {};
		for (const [key, el] of Object.entries(this.inputs)) {
			this.plugin.savedInputStateEnv[key] = el.value;
		}
		this.plugin.savedInputStateEnv.features = this.readFeatureValues();
	}
}
