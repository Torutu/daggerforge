import { FormInputs } from "../adversaries/adversaryCreator/types";

export const createField = (
	parent: HTMLElement,
	inputs: FormInputs,
	label: string,
	key: string,
	type: "input" | "textarea" = "input",
	customClass?: string,
	savedValues?: Record<string, string>,
) => {
	const wrapper = parent.createDiv({ cls: "field-row" });
	wrapper.createEl("label", {
		text: label,
		cls: "inline-label",
	});

	const field =
		type === "input"
			? wrapper.createEl("input", {
					cls: ["input-field", customClass].filter(
						Boolean,
					) as string[],
				})
			: wrapper.createEl("textarea", {
					cls: ["input-field", customClass].filter(
						Boolean,
					) as string[],
				});

	inputs[key] = field;

	if (savedValues?.[key] !== undefined) {
		field.value = savedValues[key];
	}

	return field;
};

export const createShortTripleFields = (
	parent: HTMLElement,
	inputs: FormInputs,
	label1: string,
	key1: string,
	label2: string,
	key2: string,
	label3: string,
	key3: string,
	dropdownFieldKey?: string,
	dropdownOptions?: string[],
	savedValues?: Record<string, string>,
) => {
	const row = parent.createDiv({ cls: "flex-row" });

	const createField = (label: string, key: string) => {
		const wrapper = row.createDiv({ cls: "inline-field" });
		wrapper.createEl("label", { text: label });

		if (dropdownFieldKey === key) {
			const select = wrapper.createEl("select", { cls: "input-field" });
			dropdownOptions?.forEach((opt) => {
				select.createEl("option", {
					text: opt,
					value: opt,
					cls: "tier-option",
				});
			});
			inputs[key] = select;
			if (savedValues?.[key] !== undefined)
				select.value = savedValues[key];
		} else {
			const input = wrapper.createEl("input", {
				cls: "input-field",
				attr: { type: "text" },
			});
			inputs[key] = input;
			if (savedValues?.[key] !== undefined)
				input.value = savedValues[key];
		}
	};

	createField(label1, key1);
	createField(label2, key2);
	createField(label3, key3);
};

export const createInlineField = (
	parent: HTMLElement,
	inputs: FormInputs,
	config: {
		label: string;
		key: string;
		type?: "input" | "select";
		options?: string[];
		savedValues?: Record<string, string>;
		customClass?: string;
	},
) => {
	const wrapper = parent.createDiv({ cls: "adv-first-inline-field" });
	wrapper.createEl("label", { text: config.label, cls: "inline-label" });

	if (config.type === "select" && config.options) {
		const select = wrapper.createEl("select", {
			cls: ["inline-input", config.customClass].filter(
				Boolean,
			) as string[],
		});

		config.options.forEach((opt) => {
			select.createEl("option", {
				text: opt,
				value: opt,
				cls: "tier-option",
			});
		});

		inputs[config.key] = select;

		if (config.savedValues?.[config.key] !== undefined) {
			select.value = config.savedValues[config.key];
		} else {
			select.selectedIndex = 0;
		}

		return select;
	} else {
		const input = wrapper.createEl("input", {
			cls: ["inline-input", config.customClass].filter(
				Boolean,
			) as string[],
		});
		inputs[config.key] = input;

		if (config.savedValues?.[config.key] !== undefined) {
			input.value = config.savedValues[config.key];
		}

		return input;
	}
};
