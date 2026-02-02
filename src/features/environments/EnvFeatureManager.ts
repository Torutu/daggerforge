import { EnvFeatureElements, EnvSavedFeatureState } from "../../types/index";

// Add Feature
// Creates a complete feature block with name, type, cost, description,
// bullet points, continuation text, and GM prompt questions.
// Mirrors the adversary addFeature pattern but adapted for environment-specific fields.

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
	const textEl = wrapper.createEl("textarea", {
		cls: "df-env-feature-input-desc",
		attr: { placeholder: "Feature description...", rows: "3" },
	});
	textEl.value = savedFeature?.text || "";

	const bulletEls = createBulletSection(wrapper, savedFeature?.bullets);

	wrapper.createDiv({
		cls: "df-env-feature-after-desc-header",
		text: "Continue description (after bullets):",
	});
	const afterTextEl = wrapper.createEl("textarea", {
		cls: "df-env-feature-input-after-desc",
		attr: {
			placeholder: "Additional description text (appears after bullet points)...",
			rows: "3",
		},
	});
	afterTextEl.value = savedFeature?.textAfter || "";

	const questionEls = createQuestionSection(wrapper, savedFeature?.questions);

	const removeBtn = wrapper.createEl("button", {
		text: "Remove Feature",
		cls: "df-env-btn-remove-feature",
	});
	removeBtn.onclick = () => {
		const idx = features.findIndex((f) => f.nameEl === nameEl);
		if (idx !== -1) {
			features.splice(idx, 1);
			wrapper.remove();
		}
	};

	features.push({ nameEl, typeEl, costEl, textEl, bulletEls, afterTextEl, questionEls });
};

// Get Feature Values
// Extracts all feature data from the DOM elements, filtering out empty entries.
// Parallel to adversary getFeatureValues but returns environment-specific structure.

export const getEnvFeatureValues = (
	features: EnvFeatureElements[],
): EnvSavedFeatureState[] => {
	return features
		.map((f) => ({
			name: f.nameEl.value.trim(),
			type: f.typeEl.value.trim(),
			cost: f.costEl?.value.trim() || undefined,
			text: f.textEl.value.trim(),
			bullets: f.bulletEls.map((b) => b.value.trim()).filter(Boolean) || null,
			textAfter: f.afterTextEl.value.trim() || undefined,
			questions: f.questionEls.map((q) => q.value.trim()).filter(Boolean),
		}))
		.filter((f) => f.name);
};

// Helper: Create Feature Input
// Creates an input element with saved value restoration.

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

// Helper: Create Feature Select
// Creates a select dropdown with options and optional "none" label for empty value.

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

// Helper: Create Bullet Section
// Creates the bullet points container with dynamic add/remove functionality.

function createBulletSection(
	wrapper: HTMLElement,
	saved?: string[] | null,
): HTMLInputElement[] {
	wrapper.createDiv({ cls: "df-env-feature-bullets-header", text: "Bullet Points:" });
	const container = wrapper.createDiv({ cls: "df-env-feature-bullets-container" });

	const bulletEls: HTMLInputElement[] = [];
	const addBtn = document.createElement("button");
	addBtn.textContent = "+ Add bullet point";
	addBtn.className = "df-env-btn-add-bullet";
	container.appendChild(addBtn);

	const createBullet = (text?: string) => {
		const el = document.createElement("input");
		el.className = "df-env-feature-input-bullet";
		el.placeholder = "Bullet point...";
		el.value = text || "";
		container.insertBefore(el, addBtn);
		bulletEls.push(el);
	};

	if (saved && saved.length > 0) {
		saved.forEach((b) => createBullet(b));
	} else {
		createBullet();
	}

	addBtn.onclick = () => createBullet();
	return bulletEls;
}

// Helper: Create Question Section
// Creates the GM prompt questions container with dynamic add functionality.

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
