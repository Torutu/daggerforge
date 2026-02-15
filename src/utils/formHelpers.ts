import { FormStateElements } from "../types/shared";

export const createField = (
	parent: HTMLElement,
	inputs: FormStateElements,
	label: string,
	key: string,
	type: "input" | "textarea" = "input",
	customClass?: string,
	savedValues?: Record<string, unknown>,
) => {
	const wrapper = parent.createDiv({ cls: "df-field-row" });
	wrapper.createEl("label", {
		text: label,
		cls: "df-field-label",
	});

	const field =
		type === "input"
			? wrapper.createEl("input", {
				cls: ["df-field-input", customClass].filter(
					Boolean,
				) as string[],
			})
			: wrapper.createEl("textarea", {
				cls: ["df-field-textarea", customClass].filter(
					Boolean,
				) as string[],
			});

	inputs[key] = field;

	if (savedValues?.[key] !== undefined) {
		field.value = String(savedValues[key]);
	}

	return field;
};

export const createShortTripleFields = (
	parent: HTMLElement,
	inputs: FormStateElements,
	label1: string,
	key1: string,
	label2: string,
	key2: string,
	label3: string,
	key3: string,
	dropdownFieldKey?: string,
	dropdownOptions?: string[],
	savedValues?: Record<string, unknown>,
) => {
	const row = parent.createDiv({ cls: "df-triple-fields-row" });

	const createField = (label: string, key: string) => {
		const wrapper = row.createDiv({ cls: "df-triple-field-item" });
		wrapper.createEl("label", { text: label, cls: "df-field-label" });

		if (dropdownFieldKey === key) {
			const select = wrapper.createEl("select", { cls: "df-field-select" });
			dropdownOptions?.forEach((opt) => {
				select.createEl("option", {
					text: opt,
					value: opt,
					cls: "df-select-option",
				});
			});
			inputs[key] = select;
			if (savedValues?.[key] !== undefined)
				select.value = String(savedValues[key]);
		} else {
			const input = wrapper.createEl("input", {
				cls: "df-field-input",
				attr: { type: "text" },
			});
			inputs[key] = input;
			if (savedValues?.[key] !== undefined)
				input.value = String(savedValues[key]);
		}
	};

	createField(label1, key1);
	createField(label2, key2);
	createField(label3, key3);
};

export const createInlineField = (
	parent: HTMLElement,
	inputs: FormStateElements,
	config: {
		label: string;
		key: string;
		type?: "input" | "select";
		options?: string[];
		savedValues?: Record<string, unknown>;
		customClass?: string;
	},
) => {
	const wrapper = parent.createDiv({ cls: "df-inline-field-wrapper" });
	wrapper.createEl("label", { text: config.label, cls: "df-field-label" });

	if (config.type === "select" && config.options) {
		const select = wrapper.createEl("select", {
			cls: ["df-field-select", config.customClass].filter(
				Boolean,
			) as string[],
		});

		config.options.forEach((opt) => {
			select.createEl("option", {
				text: opt,
				value: opt,
				cls: "df-select-option",
			});
		});

		inputs[config.key] = select;

		if (config.savedValues?.[config.key] !== undefined) {
			select.value = String(config.savedValues[config.key]);
		} else {
			select.selectedIndex = 0;
		}

		return select;
	} else {
		const input = wrapper.createEl("input", {
			cls: ["df-field-input", config.customClass].filter(
				Boolean,
			) as string[],
		});
		inputs[config.key] = input;

		if (config.savedValues?.[config.key] !== undefined) {
			input.value = String(config.savedValues[config.key]);
		}

		return input;
	}
};
