import { Notice, TFile, Editor, Modal } from "obsidian";
import type DaggerForgePlugin from "../../main";
import {
	createField,
	createShortTripleFields,
	createInlineField,
} from "../../utils/formHelpers";
import { addFeature, getFeatureValues } from "./featureManager";
import { buildCardHTML } from "./cardBuilder";
import { FormInputs, FeatureElements } from "./types";

export async function buildCustomAdversary(
	app: any,
	values: any,
	features: any[],
) {
	const customAdversary = {
		name: values.name || "",
		tier: values.tier || "",
		type: values.type || "",
		desc: values.desc || "",
		motives: values.motives || "",
		difficulty: values.difficulty || "",
		thresholds: `${values.thresholdMajor || ""}/${values.thresholdSevere || ""}`,
		hp: values.hp || "",
		stress: values.stress || "",
		atk: values.atk || "",
		weaponName: values.weaponName || "",
		weaponRange: values.weaponRange || "",
		weaponDamage: values.weaponDamage || "",
		xp: values.xp || "",
		source: values.source || "custom", // Default to "custom" for user-created
		features: features.map((f) => ({
			name: f.name || "",
			type: f.type || "",
			cost: f.cost || "",
			desc: f.desc || "",
		})),
	};

	try {
		// Define the filename and path
		const filename = "custom@Adversaries.md";
		const vault = app.vault;

		// Check if file exists, create if it doesn't
		let file = vault.getAbstractFileByPath(filename) as TFile;
		if (!file) {
			file = await vault.create(filename, "## Custom Adversaries\n\n");
			new Notice(`Created new custom adversaries file: ${filename}`);
		}

		// Read current content
		let content = await vault.read(file);

		// Prepare the new adversary entry
		const adversaryHeader = `\n\n### ${customAdversary.name}\n`;
		const adversaryContent =
			"```json\n" + JSON.stringify(customAdversary, null, 2) + "\n```\n";

		// Append the new adversary to the file
		await vault.modify(file, content + adversaryHeader + adversaryContent);

		new Notice(
			`Custom adversary "${customAdversary.name}" added to ${filename}`,
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
	savedInputStateAdv: Record<string, string> = {};
	editor: Editor;
	onSubmit?: (newHTML: string) => void; // Add this new property
	isEditMode: boolean = false; // Add this flag

	constructor(
		plugin: DaggerForgePlugin,
		editor: Editor,
		cardElement?: HTMLElement,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.cardElement = cardElement;
		this.isEditMode = !!cardElement;
	}

	onOpen() {
		const saved = this.plugin.savedInputStateAdv || {};
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
		const title = this.cardElement ? "Edit Adversary" : "Create Adversary";
		contentEl.createEl("h2", { text: title, cls: "modal-title" });

		const firstRow = contentEl.createDiv({ cls: "form-row" });

		// Name field
		createInlineField(firstRow, this.inputs, {
			label: "Name",
			key: "name",
			type: "input",
			savedValues: saved,
			customClass: "adversary-name-input",
		});

		// Tier dropdown
		createInlineField(firstRow, this.inputs, {
			label: "Tier",
			key: "tier",
			type: "select",
			options: ["1", "2", "3", "4"],
			savedValues: saved,
			customClass: "tier-select",
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
			customClass: "type-select",
		});

		// contentEl.createEl('br');
		createField(
			contentEl,
			this.inputs,
			"Description",
			"desc",
			"textarea",
			"description-textarea",
			saved,
		);
		createField(
			contentEl,
			this.inputs,
			"Motives ",
			"motives",
			"input",
			"motives-input",
			saved,
		);

		// Create stat fields
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
			saved,
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
			saved,
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
			saved,
		);

		createField(
			contentEl,
			this.inputs,
			"Experience (optional) ",
			"xp",
			"input",
			"experience-input",
			saved,
		);

		this.featureContainer = contentEl.createDiv("feature-container");
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

		this.addFeatureBtn = contentEl.createEl("button", {
			text: "Add Feature",
			cls: "add-feature-btn",
		});
		this.addFeatureBtn.onclick = () =>
			addFeature(this.featureContainer, this.features, setValueIfSaved);

		createInlineField(firstRow, this.inputs, {
			label: "Count",
			key: "count",
			type: "input",
			savedValues: saved,
			customClass: "count-input",
		});

		if (!saved["count"]) {
			this.inputs["count"].value = "1";
		}

		// Modified button handling
		this.insertBtn = contentEl.createEl("button", {
			text: this.cardElement ? "Update Card" : "Insert Card",
			cls: "insert-card-btn",
		});

		//--------INSERT BUTTON CLICK
		this.insertBtn.onclick = async () => {
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([key, el]) => [
					key,
					(el as HTMLInputElement | HTMLTextAreaElement).value.trim(),
				]),
			);

			const features = getFeatureValues(this.features);
			// WAIT for the file to be saved
			await buildCustomAdversary(this.plugin.app, values, features);
			const newHTML = buildCardHTML(values, features);
			if (this.cardElement) {
				this.cardElement.outerHTML = newHTML;
			} else {
				this.editor.replaceSelection(newHTML + "\n");
			}
			// Reset form (same as before)
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
