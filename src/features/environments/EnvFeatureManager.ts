import { EnvFeatureElements, EnvSavedFeatureState } from "../../types/index";
import { RichTextEditor } from "../../utils/RichTextEditor";

export const addEnvFeature = (
	featureContainer: HTMLElement,
	features: EnvFeatureElements[],
	savedFeature?: EnvSavedFeatureState,
) => {
	const wrapper = featureContainer.createDiv({ cls: "df-env-feature-block" });
	const headerRow = wrapper.createDiv({ cls: "df-env-feature-row" });

	const nameEl = createFeatureInput(
		headerRow,
		savedFeature?.name,
		"Feature Name",
		"df-env-feature-input-name",
	);
	const typeEl = createFeatureSelect(
		headerRow,
		savedFeature?.type ?? "Passive",
		["Action", "Reaction", "Passive"],
		"df-env-feature-input-type",
	);
	const costEl = createFeatureSelect(
		headerRow,
		savedFeature?.cost ?? "",
		["", "Spend a Fear"],
		"df-env-feature-input-cost",
		true,
	);

	wrapper.createDiv({ cls: "df-env-feature-desc-label", text: "Description:" });
	const editorContainer = wrapper.createDiv({ cls: "df-env-feature-editor-container" });
	const richEditor = new RichTextEditor(editorContainer, savedFeature?.richContent);

	const questionEls = createQuestionSection(wrapper, savedFeature?.questions);

	const removeBtn = wrapper.createEl("button", {
		text: "Remove Feature",
		cls: "df-env-btn-remove-feature",
	});
	removeBtn.onclick = () => {
		const idx = features.findIndex((f) => f.nameEl === nameEl);
		if (idx !== -1) {
			features[idx].richEditor.destroy();
			features.splice(idx, 1);
			wrapper.remove();
		}
	};

	features.push({ nameEl, typeEl, costEl, richEditor, questionEls });
};

export const getEnvFeatureValues = (
	features: EnvFeatureElements[],
): EnvSavedFeatureState[] => {
	return features
		.map((f) => ({
			name: f.nameEl.value.trim(),
			type: f.typeEl.value.trim(),
			cost: f.costEl?.value.trim() || undefined,
			richContent: f.richEditor.getHTML(),
			questions: f.questionEls.map((q) => q.value.trim()).filter(Boolean),
		}))
		.filter((f) => f.name);
};

function createFeatureInput(
	container: HTMLElement,
	value: string | undefined,
	placeholder: string,
	cls: string,
): HTMLInputElement {
	const el = container.createEl("input", { cls, placeholder });
	el.value = value || "";
	return el;
}

function createFeatureSelect(
	container: HTMLElement,
	value: string,
	options: string[],
	cls: string,
	showNoneLabel = false,
): HTMLSelectElement {
	const el = container.createEl("select", { cls });
	options.forEach((opt) =>
		el.createEl("option", {
			text: showNoneLabel && opt === "" ? "none" : opt,
			value: opt,
			cls: "df-tier-option",
		}),
	);
	el.value = value;
	return el;
}

function createQuestionSection(
	wrapper: HTMLElement,
	saved?: string[],
): HTMLTextAreaElement[] {
	const container = wrapper.createDiv({ cls: "df-env-feature-question-container" });
	container.createDiv({
		cls: "df-env-feature-question-header",
		text: "GM Prompt Questions:",
	});
	const questionsWrapper = container.createDiv({ cls: "df-env-questions-wrapper" });
	const questionEls: HTMLTextAreaElement[] = [];

	const addBtn = questionsWrapper.createEl("button", {
		text: "+ Add question",
		cls: "df-env-btn-add-question",
	});

	const createQuestion = (text?: string) => {
		const el = questionsWrapper.createEl("textarea", {
			cls: "df-env-feature-input-question",
			attr: { placeholder: 'e.g. "Why did this feature occur?"', rows: "2" },
		});
		el.value = text || "";
		questionEls.push(el);
		questionsWrapper.appendChild(addBtn);
	};

	if (saved && saved.length > 0) {
		saved.forEach((q) => createQuestion(q));
	} else {
		createQuestion();
	}

	addBtn.onclick = () => createQuestion();
	return questionEls;
}
