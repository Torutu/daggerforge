import { FeatureElements, SavedFeatureState } from "../../../types/adversary";

export const addFeature = (
	featureContainer: HTMLElement,
	features: FeatureElements[],
	setValueIfSaved: (
		key: string,
		el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
	) => void,
	savedFeature?: SavedFeatureState,
) => {
	const wrapper = featureContainer.createDiv({ cls: "df-feature-block" });
	const row = wrapper.createDiv({ cls: "df-feature-row" });

	const nameEl = row.createEl("input", {
		cls: "df-input-feature-name",
		placeholder: "Feature Name",
	});
	setValueIfSaved("featureName", nameEl);

	const typeEl = row.createEl("select", { cls: "df-field-feature-type" });
	["Action", "Reaction", "Passive"].forEach((type) => {
		typeEl.createEl("option", {
			text: type,
			value: type,
			cls: "df-tier-option",
		});
	});
	setValueIfSaved("featureType", typeEl);

	const costEl = row.createEl("select", { cls: "df-input-feature-cost" });
	["", "Mark a Stress", "Spend a Fear"].forEach((opt) => {
		costEl.createEl("option", {
			text: opt === "" ? "none" : opt,
			value: opt,
			cls: "df-tier-option",
		});
	});
	setValueIfSaved("featureCost", costEl);

	const descEl = wrapper.createEl("textarea", {
		cls: "df-feature-desc-input",
		placeholder: "Feature Description",
	});
	setValueIfSaved("featureDesc", descEl);

	const removeBtn = wrapper.createEl("button", {
		text: "Remove",
		cls: "df-remove-feature-btn",
	});

	removeBtn.onclick = () => {
		const index = features.findIndex((f) => f.nameEl === nameEl);
		if (index !== -1) {
			features.splice(index, 1);
			wrapper.remove();
		}
	};

	features.push({ nameEl, typeEl, costEl, descEl });
};

export const getFeatureValues = (features: FeatureElements[]) => {
	return features
		.map(({ nameEl, typeEl, costEl, descEl }) => ({
			name: nameEl.value.trim(),
			type: typeEl.value.trim(),
			cost: costEl.value.trim(),
			desc: descEl.value.trim(),
		}))
		.filter((f) => f.name);
};
