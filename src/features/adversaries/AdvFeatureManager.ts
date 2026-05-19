import { FeatureElements, Feature } from "../../types/index";
import { RichTextEditor } from "../../utils/RichTextEditor";

export const addAdvFeature = (
	featureContainer: HTMLElement,
	features: FeatureElements[],
	savedFeature?: Feature,
) => {
	const wrapper = featureContainer.createDiv({ cls: "df-feature-block" });
	const row = wrapper.createDiv({ cls: "df-feature-row" });

	const nameEl = row.createEl("input", {
		cls: "df-input-feature-name",
		placeholder: "Feature Name",
	});
	nameEl.value = savedFeature?.name || "";

	const typeEl = row.createEl("select", { cls: "df-field-feature-type" });
	["Action", "Reaction", "Passive"].forEach((type) => {
		typeEl.createEl("option", { text: type, value: type, cls: "df-tier-option" });
	});
	typeEl.value = savedFeature?.type || "Action";

	const costEl = row.createEl("select", { cls: "df-input-feature-cost" });
	["", "Mark a Stress", "Spend a Fear"].forEach((opt) => {
		costEl.createEl("option", {
			text: opt === "" ? "none" : opt,
			value: opt,
			cls: "df-tier-option",
		});
	});
	costEl.value = savedFeature?.cost || "";

	const editorContainer = wrapper.createDiv({ cls: "df-feature-editor-container" });
	const richEditor = new RichTextEditor(editorContainer, savedFeature?.richContent);

	const removeBtn = wrapper.createEl("button", {
		text: "Remove",
		cls: "df-remove-feature-btn",
	});
	removeBtn.onclick = () => {
		const index = features.findIndex((f) => f.nameEl === nameEl);
		if (index !== -1) {
			features[index].richEditor.destroy();
			features.splice(index, 1);
			wrapper.remove();
		}
	};

	features.push({ nameEl, typeEl, costEl, richEditor });
};

export const getAdvFeatureValues = (features: FeatureElements[]): Feature[] => {
	return features
		.map(({ nameEl, typeEl, costEl, richEditor }) => ({
			name: nameEl.value.trim(),
			type: typeEl.value.trim(),
			cost: costEl.value.trim(),
			richContent: richEditor.getHTML(),
		}))
		.filter((f) => f.name);
};
