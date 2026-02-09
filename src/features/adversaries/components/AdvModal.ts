import { Notice, Editor, Modal } from "obsidian";
import { addAdvFeature, getAdvFeatureValues, buildCardHTML, Adv_View_Type } from "../index";
import type DaggerForgePlugin from "../../../main";
import { AdvData, FeatureElements, FormInputs } from "../../../types/index";
import {
	createField,
	createShortTripleFields,
	createInlineField,
	isMarkdownActive,
	isCanvasActive,
	createCanvasCard,
	getAvailableCanvasPosition,
} from "../../../utils/index";

// Data Assembly
// Builds a complete AdvData object from raw form values and feature arrays.
// Used both when persisting a new adversary and when passing updated data back
// through the onEditUpdate callback.

function assembleAdvData(
	values: Record<string, string>,
	features: ReturnType<typeof getAdvFeatureValues>,
): AdvData {
	return {
		id: values.id || "",
		name: values.name || "",
		tier: values.tier || "",
		type: values.type || "",
		desc: values.desc || "",
		motives: values.motives || "",
		difficulty: values.difficulty || "",
		thresholdMajor: values.thresholdMajor || "",
		thresholdSevere: values.thresholdSevere || "",
		hp: values.hp || "",
		stress: values.stress || "",
		atk: values.atk || "",
		weaponName: values.weaponName || "",
		weaponRange: values.weaponRange || "",
		weaponDamage: values.weaponDamage || "",
		xp: values.xp || "",
		source: "custom",
		features: features.map((f) => ({
			name: f.name || "",
			type: f.type || "",
			cost: f.cost || "",
			desc: f.desc || "",
		})),
	};
}

async function persistAdversary(
	plugin: DaggerForgePlugin,
	data: AdvData,
): Promise<void> {
	try {
		await plugin.dataManager.addAdversary(data);
		new Notice(`Custom adversary "${data.name}" saved successfully!`);
	} catch (error) {
		console.error("Error saving custom adversary:", error);
		new Notice("Failed to save custom adversary. Check console for details.");
	}
}

// Modal
// Single modal for both create and edit flows.
//
// Edit mode is activated by passing a cardElement + cardData to the
// constructor. When present:
//   • The form pre-fills from cardData instead of the plugin's saved state.
//   • The submit button calls onEditUpdate (wired by cardEditor.ts) instead of
//     persisting + inserting a new card.
//   • onClose does not write back to the plugin's saved state — edit sessions
//     are ephemeral.

export class TextInputModal extends Modal {
	private plugin: DaggerForgePlugin;
	private editor: Editor | null;
	private inputs: FormInputs = {};
	private features: FeatureElements[] = [];
	private featureContainer!: HTMLElement;

	// Edit-mode fields
	private isEditMode: boolean;
	private editData: Record<string, unknown> = {};
	onEditUpdate?: (newHTML: string, newData: AdvData) => void | Promise<void>;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor | null,
		cardElement?: HTMLElement,
		cardData?: Record<string, unknown>,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.isEditMode = !!cardElement; // convert any value to boolean

		if (cardElement && cardData) {
			this.editData = cardData;
		}
	}
	// Form Construction

	onOpen() {
		// In edit mode we use the card data; in create mode we use
		// whatever the user left in the form last time (persisted on the plugin).
		const saved = this.isEditMode
			? this.editData
			: this.plugin.savedInputStateAdv || {};

		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", {
			text: this.isEditMode ? "Edit adversary" : "Create adversary",
			cls: "df-modal-title",
		});

		this.buildBasicInfoSection(contentEl, saved);
		this.buildStatsSection(contentEl, saved);
		this.buildWeaponSection(contentEl, saved);
		this.buildFeaturesSection(contentEl, saved);
		this.buildActionButtons(contentEl);
	}

	private buildBasicInfoSection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-adv-form-section" });
		section.createEl("h3", { text: "Basic information", cls: "df-section-title" });

		const row = section.createDiv({ cls: "df-adv-form-row" });

		createInlineField(row, this.inputs, {
			label: "Name",
			key: "name",
			type: "input",
			savedValues: saved,
			customClass: "df-adv-field-name",
		});

		createInlineField(row, this.inputs, {
			label: "Tier",
			key: "tier",
			type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: saved,
			customClass: "df-adv-field-tier",
		});

		createInlineField(row, this.inputs, {
			label: "Type",
			key: "type",
			type: "select",
			options: [
				"Bruiser", "Horde", "Leader", "Minion", "Ranged", "Skulk",
				"Social", "Solo", "Standard", "Support",
				"Leader (Umbra-Touched)", "Minion (Umbra-Touched)", "Solo (Umbra-Touched)",
			],
			savedValues: saved,
			customClass: "df-adv-field-type",
		});

		const details = section.createDiv({ cls: "df-adv-form-section-content" });

		createField(details, this.inputs, "Description", "desc", "textarea", "df-adv-field-desc", saved);
		createField(details, this.inputs, "Motives", "motives", "input", "df-adv-field-motives", saved);
	}

	private buildStatsSection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-adv-form-section" });
		section.createEl("h3", { text: "Statistics", cls: "df-section-title" });

		createShortTripleFields(
			section, this.inputs,
			"Difficulty", "difficulty",
			"Major", "thresholdMajor",
			"Severe", "thresholdSevere",
			undefined, undefined, saved,
		);

		createShortTripleFields(
			section, this.inputs,
			"HP", "hp",
			"Stress (optional)", "stress",
			"ATK Mod", "atk",
			undefined, undefined, saved,
		);
	}

	private buildWeaponSection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-adv-form-section" });
		section.createEl("h3", { text: "Weapon", cls: "df-section-title" });

		createShortTripleFields(
			section, this.inputs,
			"Name", "weaponName",
			"Range", "weaponRange",
			"Damage", "weaponDamage",
			"weaponRange", ["Melee", "Very Close", "Close", "Far", "Very Far"],
			saved,
		);

		createField(section, this.inputs, "Experience (optional)", "xp", "input", "df-adv-field-xp", saved);

		const countRow = section.createDiv({ cls: "df-adv-form-row-weapon" });
		createInlineField(countRow, this.inputs, {
			label: "Count",
			key: "count",
			type: "input",
			savedValues: saved,
			customClass: "df-adv-field-count",
		});

		if (!saved["count"]) {
			this.inputs["count"].value = "1";
		}
	}

	private buildFeaturesSection(
		contentEl: HTMLElement,
		saved: Record<string, unknown>,
	) {
		const section = contentEl.createDiv({ cls: "df-adv-form-section" });
		section.createEl("h3", { text: "Features", cls: "df-section-title" });

		this.featureContainer = section.createDiv({ cls: "df-adv-feature-container" });
		this.features = [];

		const setValueIfSaved = (
			key: string,
			el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
		) => {
			if (saved[key] !== undefined) el.value = String(saved[key]);
		};

		const savedFeatures = saved.features as Array<Record<string, string>> | undefined;

		if (Array.isArray(savedFeatures) && savedFeatures.length > 0) {
			savedFeatures.forEach((data) => {
				addAdvFeature(this.featureContainer, this.features, (key, el) => {
					const dataKey = key === "featureName" ? "name"
						: key === "featureType" ? "type"
						: key === "featureCost" ? "cost"
						: key === "featureDesc" ? "desc"
						: key;
					if (data[dataKey] !== undefined) el.value = String(data[dataKey]);
				});
			});
		} else {
			addAdvFeature(this.featureContainer, this.features, setValueIfSaved);
		}

		const addBtn = section.createEl("button", {
			text: "+ Add feature",
			cls: "df-adv-btn-add-feature",
		});
		addBtn.onclick = () =>
			addAdvFeature(this.featureContainer, this.features, setValueIfSaved);
	}

	private buildActionButtons(contentEl: HTMLElement) {
		const container = contentEl.createDiv({ cls: "df-adv-form-buttons" });

		const btn = container.createEl("button", {
			text: this.isEditMode ? "Update card" : "Insert card",
			cls: "df-adv-btn-insert",
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
		const features = getAdvFeatureValues(this.features);
		const newHTML = buildCardHTML(values, features);
		const newData = assembleAdvData(values, features);

		if (this.onEditUpdate) {
			await this.onEditUpdate(newHTML, newData);
			this.close();
			return;
		}

		await persistAdversary(this.plugin, newData);
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
		if (isCanvasActive(this.app)) {
			const pos = getAvailableCanvasPosition(this.plugin.app);
			createCanvasCard(this.plugin.app, html, {
				x: pos.x, y: pos.y, width: 400, height: 600,
			});
		} else if (isMarkdownActive(this.app) && this.editor) {
			this.editor.replaceSelection(html + "\n");
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

		this.features.forEach(({ nameEl, typeEl, costEl, descEl }) => {
			nameEl.value = "";
			typeEl.selectedIndex = 0;
			costEl.selectedIndex = 0;
			descEl.value = "";
		});

		this.features = [];
		this.featureContainer.empty();
		this.plugin.savedInputStateAdv = {};
	}

	private refreshBrowserView() {
		const leaves = this.plugin.app.workspace.getLeavesOfType(Adv_View_Type);
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

	onClose() {
		if (this.isEditMode) return;

		this.plugin.savedInputStateAdv = {};

		for (const [key, el] of Object.entries(this.inputs)) {
			this.plugin.savedInputStateAdv[key] = (
				el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			).value;
		}

		this.plugin.savedInputStateAdv.features = this.features.map(
			({ nameEl, typeEl, costEl, descEl }) => ({
				featureName: nameEl.value,
				featureType: typeEl.value,
				featureCost: costEl.value,
				featureDesc: descEl.value,
			}),
		);
	}
}
