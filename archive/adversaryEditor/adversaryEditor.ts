import { TextInputModal } from "../adversaryCreator/textInputModal";
import { extractCardData } from "./cardDataHelpers";
import type DaggerForgePlugin from "src/main";
import { Editor } from "obsidian";
import { Notice } from "obsidian";

export class AdversaryEditor {
	static open(
		plugin: DaggerForgePlugin,
		editor: Editor,
		cardElement: HTMLElement,
	) {
		try {
			// 1. Extract and transform data
			const data = extractCardData(cardElement);

			// 2. Add visual feedback during edit
			cardElement.classList.add("editing-adversary");

			// 3. Prepare data for modal
			plugin.savedInputStateAdv = {
				...data,
				features: data.features.map((f) => ({
					featureName: f.name,
					featureType: f.type,
					featureCost: f.cost || "", // Ensure empty string if undefined
					featureDesc: f.desc,
				})),
			};

			// 4. Create and configure modal
			const modal = new TextInputModal(plugin, editor, cardElement);

			modal.onSubmit = (newHTML: string) => {
				// Update card and remove editing class
				cardElement.outerHTML = newHTML;
				cardElement.classList.remove("editing-adversary");

				// Visual feedback
				new Notice("Adversary updated successfully");
			};

			modal.onClose = () => {
				// Clean up if modal closed without submitting
				cardElement.classList.remove("editing-adversary");
			};

			modal.open();
		} catch (error) {
			new Notice(
				"Failed to edit adversary. Please check console for details.",
			);
			console.error("Adversary editing error:", error);
}
	}
}
