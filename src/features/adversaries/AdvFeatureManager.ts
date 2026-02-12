import { FeatureElements, Feature } from "../../types/index";

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
		typeEl.createEl("option", {
			text: type,
			value: type,
			cls: "df-tier-option",
		});
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

	const descEl = wrapper.createEl("textarea", {
		cls: "df-feature-desc-input",
		placeholder: "Feature Description",
	});
	descEl.value = savedFeature?.desc || "";

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

export const getAdvFeatureValues = (features: FeatureElements[]) => {
	return features
		.map(({ nameEl, typeEl, costEl, descEl }) => ({
			name: nameEl.value.trim(),
			type: typeEl.value.trim(),
			cost: costEl.value.trim(),
			desc: descEl.value.trim(),
		}))
		.filter((f) => f.name);
};
