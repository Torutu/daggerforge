import { Editor, Modal } from "obsidian";
import type DaggerForgePlugin from "../../../main";
import {
	createField,
	createShortTripleFields,
	createInlineField,
} from "../../../utils/formHelpers";
import { addFeature, getFeatureValues } from "../creator/FeatureManager";
import { buildCardHTML } from "../creator/CardBuilder";
import { FormInputs } from "../../../types/shared";
import { FeatureElements } from "../../../types/adversary";

export class AdversaryEditorModal extends Modal {
	inputs: FormInputs = {};
	insertBtn: HTMLButtonElement;
	addFeatureBtn: HTMLButtonElement;
	featureContainer: HTMLElement;
	cardElement: HTMLElement;
	features: FeatureElements[] = [];
	plugin: DaggerForgePlugin;
	editor: Editor;
	onSubmit?: (newHTML: string) => void;
	cardData: Record<string, any>;

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor,
		cardElement: HTMLElement,
		cardData: Record<string, any>
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.cardElement = cardElement;
		this.cardData = cardData;
	}

	onOpen() {
		console.log("Editing card with data:", this.cardData);
		const { contentEl } = this;

		contentEl.empty();
		contentEl.createEl("h2", { text: "Edit Adversary", cls: "df-modal-title" });

		const firstRow = contentEl.createDiv({ cls: "df-form-row" });

		// Name field - prefill with existing data
		createInlineField(firstRow, this.inputs, {
			label: "Name",
			key: "name",
			type: "input",
			savedValues: this.cardData,
			customClass: "df-adversary-name-input",
		});

		// Tier dropdown - prefill with existing data
		createInlineField(firstRow, this.inputs, {
			label: "Tier",
			key: "tier",
			type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: this.cardData,
			customClass: "df-tier-select",
		});

		// Type dropdown - prefill with existing data
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
			savedValues: this.cardData,
			customClass: "df-type-select",
		});

		// Description - prefill with existing data
		createField(
			contentEl,
			this.inputs,
			"Description",
			"desc",
			"textarea",
			"df-description-textarea",
			this.cardData,
		);

		// Motives - prefill with existing data
		createField(
			contentEl,
			this.inputs,
			"Motives ",
			"motives",
			"input",
			"df-motives-input",
			this.cardData,
		);

		// Stat fields - prefill with existing data
		createShortTripleFields(
			contentEl,
			this.inputs,
			"Difficulty",
			"difficulty",
			"Major",
			"thresholdMajor",
			"Severe",
			"thresholdSevere",
			undefined,
			undefined,
			this.cardData,
		);

		createShortTripleFields(
			contentEl,
			this.inputs,
			"HP",
			"hp",
			"Stress (optional)",
			"stress",
			"ATK Mod",
			"atk",
			undefined,
			undefined,
			this.cardData,
		);

		createShortTripleFields(
			contentEl,
			this.inputs,
			"Weapon Name",
			"weaponName",
			"Weapon Range",
			"weaponRange",
			"Weapon Damage",
			"weaponDamage",
			"weaponRange",
			["Melee", "Very Close", "Close", "Far", "Very Far"],
			this.cardData,
		);

		createField(
			contentEl,
			this.inputs,
			"Experience (optional) ",
			"xp",
			"input",
			"df-experience-input",
			this.cardData,
		);

		// Features section - prefill with existing data
		this.featureContainer = contentEl.createDiv("df-feature-container");
		this.features = [];
		this.featureContainer.empty();

		if (Array.isArray(this.cardData.features) && this.cardData.features.length > 0) {
			this.cardData.features.forEach((feature: any) => {
				addFeature(this.featureContainer, this.features, (key, el) => {
					const featureKey = key.replace('feature', '').toLowerCase();
					if (feature[featureKey] !== undefined) el.value = feature[featureKey];
				});
			});
		} else {
			addFeature(this.featureContainer, this.features, () => {});
		}

		this.addFeatureBtn = contentEl.createEl("button", {
			text: "Add Feature",
			cls: "df-add-feature-btn",
		});
		this.addFeatureBtn.onclick = () =>
			addFeature(this.featureContainer, this.features, () => {});

		// Count field - prefill with existing data
		createInlineField(firstRow, this.inputs, {
			label: "Count",
			key: "count",
			type: "input",
			savedValues: this.cardData,
			customClass: "df-count-input",
		});

		if (!this.cardData["count"]) {
			this.inputs["count"].value = "1";
		}

		// Update button
		this.insertBtn = contentEl.createEl("button", {
			text: "Update Card",
			cls: "df-insert-card-btn",
		});

        this.insertBtn.onclick = () => {
            const values = Object.fromEntries(
                Object.entries(this.inputs).map(([key, el]) => [
                    key,
                    (el as HTMLInputElement | HTMLTextAreaElement).value.trim(),
                ]),
            );

            // MAKE SURE YOU'RE COLLECTING THE FEATURES
            const features = getFeatureValues(this.features); // This line is crucial!
            console.log("Features collected in modal:", features); // Debug log
            
            const newHTML = buildCardHTML(values, features); // Pass features here
            console.log("New HTML generated:", newHTML); // Debug log
            
            if (this.onSubmit) {
                this.onSubmit(newHTML);
            }
            
            this.close();
        };
	}

	onClose() {
		// No need to save state for editing - it's a one-time operation
		this.contentEl.empty();
	}
}