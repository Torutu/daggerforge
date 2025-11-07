import { Notice, TFile, Editor, Modal } from "obsidian";
import type DaggerForgePlugin from "../../../main";
import { CardData } from "../../../types/adversary";
import {
	createField,
	createShortTripleFields,
	createInlineField,
} from "../../../utils/formHelpers";
import { addFeature, getFeatureValues } from "./FeatureManager";
import { buildCardHTML } from "./CardBuilder";
import { FormInputs } from "../../../types/shared";
import { FeatureElements, SavedFeatureState } from "../../../types/adversary";
import { isMarkdownActive, isCanvasActive, createCanvasCard, getAvailableCanvasPosition } from "../../../utils/canvasHelpers"; 

// This function is now replaced by DataManager.addAdversary()
// Keeping it for backward compatibility if needed
export async function buildCustomAdversary(
	plugin: DaggerForgePlugin,
	values: any,
	features: any[],
) {
	const customAdversary: CardData = {
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

	try {
		// Save using DataManager (Obsidian's saveData)
		await plugin.dataManager.addAdversary(customAdversary);
		new Notice(
			`Custom adversary "${customAdversary.name}" saved successfully!`,
		);
		return customAdversary;
	} catch (error) {
		console.error("Error saving custom adversary:", error);
		new Notice(
			"Failed to save custom adversary. Check console for details.",
		);
		return null;
	}
}

export class TextInputModal extends Modal {
	inputs: FormInputs = {};
	insertBtn: HTMLButtonElement;
	addFeatureBtn: HTMLButtonElement;
	featureContainer: HTMLElement;
	cardElement?: HTMLElement;
	features: FeatureElements[] = [];
	plugin: DaggerForgePlugin;
	savedInputStateAdv: Record<string, any> = {};
	editor: Editor;
	onSubmit?: (newHTML: string) => void;
	isEditMode: boolean = false;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor,
		cardElement?: HTMLElement,
		cardData?: Record<string, any>
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.cardElement = cardElement;
		this.isEditMode = !!cardElement;
		if (cardElement && cardData) {
			console.log("Editing existing card with provided data", cardElement);
			this.savedInputStateAdv = {
				...cardData,
				features: cardData.features?.map((f: any) => ({
					featureName: f.name || f.featureName,
					featureType: f.type || f.featureType,
					featureCost: f.cost || f.featureCost,
					featureDesc: f.desc || f.featureDesc,
				})) || [],
			};
			console.log("Saved input state:", this.savedInputStateAdv);
		}
	}

	onOpen() {
		console.log("savedInputStateAdv on open:", this.savedInputStateAdv);
		const saved = this.plugin.savedInputStateAdv || {};
		console.log("Opening modal with saved state:", saved);
		const { contentEl } = this;

		const setValueIfSaved = (
			key: string,
			el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
		) => {
			if (saved[key] !== undefined) {
				el.value = saved[key];
			}
		};

		contentEl.empty();
		const title = this.cardElement ? "Edit adversary" : "Create adversary";
		contentEl.createEl("h2", { text: title, cls: "df-modal-title" });

		// ===== BASIC INFO SECTION =====
		const basicInfoSection = contentEl.createDiv({ cls: "df-adv-form-section" });
		basicInfoSection.createEl("h3", { text: "Basic information", cls: "df-section-title" });

		const firstRow = basicInfoSection.createDiv({ cls: "df-adv-form-row" });

		// Name field
		createInlineField(firstRow, this.inputs, {
			label: "Name",
			key: "name",
			type: "input",
			savedValues: saved,
			customClass: "df-adv-field-name",
		});

		// Tier dropdown
		createInlineField(firstRow, this.inputs, {
			label: "Tier",
			key: "tier",
			type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: saved,
			customClass: "df-adv-field-tier",
		});

		// Type dropdown
		createInlineField(firstRow, this.inputs, {
			label: "Type",
			key: "type",
			type: "select",
			options: [
				"Bruiser",
				"Horde",
				"Leader",
				"Minion",
				"Ranged",
				"Skulk",
				"Social",
				"Solo",
				"Standard",
				"Support",
			],
			savedValues: saved,
			customClass: "df-adv-field-type",
		});

		// ===== DETAILS SECTION =====
		const detailsSection = basicInfoSection.createDiv({ cls: "df-adv-form-section-content" });

		createField(
			detailsSection,
			this.inputs,
			"Description",
			"desc",
			"textarea",
			"df-adv-field-desc",
			saved,
		);

		createField(
			detailsSection,
			this.inputs,
			"Motives",
			"motives",
			"input",
			"df-adv-field-motives",
			saved,
		);

		// ===== STATS SECTION =====
		const statsSection = contentEl.createDiv({ cls: "df-adv-form-section" });
		statsSection.createEl("h3", { text: "Statistics", cls: "df-section-title" });

		createShortTripleFields(
			statsSection,
			this.inputs,
			"Difficulty",
			"difficulty",
			"Major",
			"thresholdMajor",
			"Severe",
			"thresholdSevere",
			undefined,
			undefined,
			saved,
		);

		createShortTripleFields(
			statsSection,
			this.inputs,
			"HP",
			"hp",
			"Stress (optional)",
			"stress",
			"ATK Mod",
			"atk",
			undefined,
			undefined,
			saved,
		);

		// ===== WEAPON SECTION =====
		const weaponSection = contentEl.createDiv({ cls: "df-adv-form-section" });
		weaponSection.createEl("h3", { text: "Weapon", cls: "df-section-title" });

		createShortTripleFields(
			weaponSection,
			this.inputs,
			"Name",
			"weaponName",
			"Range",
			"weaponRange",
			"Damage",
			"weaponDamage",
			"weaponRange",
			["Melee", "Very Close", "Close", "Far", "Very Far"],
			saved,
		);

		createField(
			weaponSection,
			this.inputs,
			"Experience (optional)",
			"xp",
			"input",
			"df-adv-field-xp",
			saved,
		);

		// ===== COUNT FIELD =====
		const countRow = weaponSection.createDiv({ cls: "df-adv-form-row" });
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

		// ===== FEATURES SECTION =====
		const featuresSection = contentEl.createDiv({ cls: "df-adv-form-section" });
		featuresSection.createEl("h3", { text: "Features", cls: "df-section-title" });

		this.featureContainer = featuresSection.createDiv({ cls: "df-adv-feature-container" });
		this.features = [];
		this.featureContainer.empty();

		if (Array.isArray(saved.features) && saved.features.length > 0) {
			saved.features.forEach((data: Record<string, string>) => {
				addFeature(this.featureContainer, this.features, (key, el) => {
					if (data[key] !== undefined) el.value = data[key];
				});
			});
		} else {
			addFeature(this.featureContainer, this.features, setValueIfSaved);
		}

		this.addFeatureBtn = featuresSection.createEl("button", {
			text: "+ Add feature",
			cls: "df-adv-btn-add-feature",
		});
		this.addFeatureBtn.onclick = () =>
			addFeature(this.featureContainer, this.features, setValueIfSaved);

		// ===== ACTION BUTTONS =====
		const buttonContainer = contentEl.createDiv({ cls: "df-adv-form-buttons" });

		this.insertBtn = buttonContainer.createEl("button", {
			text: this.cardElement ? "Update card" : "Insert card",
			cls: "df-adv-btn-insert",
		});

		this.insertBtn.onclick = async () => {
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([key, el]) => [
					key,
					(el as HTMLInputElement | HTMLTextAreaElement).value.trim(),
				]),
			);

			const features = getFeatureValues(this.features);
			await buildCustomAdversary(this.plugin, values, features);
			const newHTML = buildCardHTML(values, features);

			const isCanvas = isCanvasActive(this.app);
			const isMarkdown = isMarkdownActive(this.app);
			
			// Check if we're editing an existing card
			if (this.cardElement) {
				const wrapper = document.createElement("div");
				wrapper.innerHTML = newHTML.trim();
				const newCardEl = wrapper.firstChild as HTMLElement;
				this.cardElement.replaceWith(newCardEl);
			} else {
				// Check if we're on a canvas
				if (isCanvas) {
					const position = getAvailableCanvasPosition(this.plugin.app);
					const success = createCanvasCard(this.plugin.app, newHTML, {
						x: position.x,
						y: position.y,
						width: 400,
						height: 600
					});
					if (success) {
						new Notice("Environment inserted into canvas successfully!");
					}
				} else if (isMarkdown) {
					// Insert into markdown editor
					this.editor.replaceSelection(newHTML + "\n");
				}
			}

			// Clear inputs
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

			// Clear features
			this.features.forEach(({ nameEl, typeEl, costEl, descEl }) => {
				nameEl.value = "";
				typeEl.selectedIndex = 0;
				costEl.selectedIndex = 0;
				descEl.value = "";
			});

			this.plugin.savedInputStateAdv = {};
			this.features = [];
			this.featureContainer.empty();

			// Refresh AdversaryView if open
			const advView = this.plugin.app.workspace
				.getLeavesOfType("adversary-view")
				.map((l) => l.view)
				.find((v) => typeof (v as any).refresh === "function") as any;

			if (advView) {
				await advView.refresh();
			}

			this.close();
		};
	}

	onClose() {
		this.plugin.savedInputStateAdv = {};

		// Save top-level inputs
		for (const [key, el] of Object.entries(this.inputs)) {
			const value = (
				el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			).value;
			this.plugin.savedInputStateAdv[key] = value;
		}

		// Save features
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
