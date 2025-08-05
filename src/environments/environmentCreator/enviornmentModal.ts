import { Modal, Editor } from 'obsidian';
import type DaggerForgePlugin from '../../main';
import {
	createField,
	createShortTripleFields,
    createInlineField
} from '../../utils/formHelpers';
import { FormInputs, FeatureElements, SavedFeatureState, EnvironmentData} from '../environmentTypes';
// import { ADVERSARIES } from '@/data/adversaries';
import { environmentToHTML } from '../environmentsToHTML';

export class EnvironmentModal extends Modal {
	plugin: DaggerForgePlugin;
	editor: Editor;
	inputs: FormInputs = {};
	features: FeatureElements[] = [];
	featureContainer: HTMLElement;
    onSubmit: (result: EnvironmentData) => void;

	constructor(plugin: DaggerForgePlugin, editor: Editor, onSubmit: (result: EnvironmentData) => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		const saved = this.plugin.savedInputState || {};
		contentEl.empty();
        const firstRow = contentEl.createDiv({ cls: 'env-form-row' });
		// === Main input fields ===
        createInlineField(firstRow, this.inputs, {
            label: 'Name',
            key: 'name',
            type: 'input',
            savedValues: saved,
            customClass: 'env-name-input'
        });

                // Tier dropdown
        createInlineField(firstRow, this.inputs, {
            label: 'Tier',
            key: 'tier',
            type: 'select',
            options: ['1', '2', '3', '4'],
            savedValues: saved,
            customClass: 'env-tier-select'
        });

                // Type dropdown
        createInlineField(firstRow, this.inputs, {
            label: 'Type',
            key: 'type',
            type: 'select',
            options: ["Event", "Exploration", "Social", "Traversal"],
            savedValues: saved,
            customClass: 'env-type-select'
        });

		const secondRow = contentEl.createDiv({ cls: 'env-form-second-row' });
		createInlineField(secondRow, this.inputs, {
            label: 'Description',
            key: 'desc',
            type: 'input',
            savedValues: saved,
            customClass: 'env-desc-input'
        });

		const thirdRow = contentEl.createDiv({ cls: 'env-form-third-row'});
		createInlineField(thirdRow, this.inputs, {
			label: 'Impulses',
			key: 'impulse',
			type: 'input',
			savedValues: saved,
			customClass: 'env-impulse-input'
		})

		const forthRow = contentEl.createDiv({ cls: 'env-form-forth-row' });
		createInlineField(forthRow, this.inputs, {
            label: 'Difficulity',
            key: 'difficulty',
            type: 'input',
            savedValues: saved,
            customClass: 'env-difficulity-input'
        });
		
		createInlineField(forthRow, this.inputs, {
            label: 'Potential Adversaries',
            key: 'potentialAdversaries',
            type: 'input',
            savedValues: saved,
            customClass: 'env-Potential-input'
        });

		// === Features ===
		this.featureContainer = contentEl.createDiv('feature-container');
		this.features = [];

		const setValueIfSaved = (key: string, el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
			if (saved[key] !== undefined) {
				el.value = saved[key];
			}
		};

		// Load saved features if available
		const savedFeatures: SavedFeatureState[] = saved.features || [];
		savedFeatures.forEach((f) => {
			this.addFeature(f);
		});

		if (savedFeatures.length === 0) this.addFeature();

		const addBtn = contentEl.createEl("button", {
			text: "Add Feature",
			cls: "env-add-feature-btn"
		});
		addBtn.onclick = () => this.addFeature();

		const insertBtn = contentEl.createEl("button", {
			text: "Insert Environment",
			cls: "env-insert-card-btn"
		});

		insertBtn.onclick = () => {
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([k, el]) => [k, el.value.trim()])
			);
			const features = this.getFeatureValues();
			console.log("difficulty:", values.impulse)
			const env: EnvironmentData = {
				name: values.name,
				tier: Number(values.tier),
				type: values.type,
				desc: values.desc,
				impulse: values.impulse,
				difficulty: values.difficulty,
				potentialAdversaries: values.potentialAdversaries,
				features
			};

			// Use environmentToHTML to generate HTML instead of JSON
			const htmlContent = environmentToHTML(env);
			
			// Insert as HTML with a surrounding div for Obsidian compatibility
			this.editor.replaceSelection(
				`<div class="environment-block">\n${htmlContent}\n</div>\n`
			);
			
			// Reset form inputs (similar to your first example)
			for (const el of Object.values(this.inputs)) {
				if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
					el.value = "";
				} else if (el instanceof HTMLSelectElement) {
					el.selectedIndex = 0;
				}
			}
			
			// Reset features if you have feature inputs to clear
			if (this.features) {
				this.features.forEach(({ nameEl, typeEl, costEl, textEl }) => {
					nameEl.value = "";
					typeEl.selectedIndex = 0;
                    if (costEl) {
                        costEl.selectedIndex = 0;
                    }
					textEl.value = "";
				});
				this.features = [];
				// If you have a feature container to clear:
				if (this.featureContainer) {
					this.featureContainer.empty();
				}
			}
			
			// Clear any saved state if needed
			if (this.plugin?.savedInputState) {
				this.plugin.savedInputState = {};
			}
			
			this.close();
		};
	}

	addFeature(savedFeature?: SavedFeatureState) {
		const wrapper = this.featureContainer.createDiv({ cls: 'feature-block' });
		
		// Feature header row (name - type : cost)
		const headerRow = wrapper.createDiv({ cls: 'feature-header' });
		
		// Name input
		const nameEl = headerRow.createEl('input', { 
			cls: 'input-feature-name', 
			placeholder: 'Feature Name'
		});
		nameEl.value = savedFeature?.name || '';
		
		// Type dropdown
		const typeEl = headerRow.createEl('select', { cls: 'field-feature-type' });
		["Action", "Reaction", "Passive"].forEach(opt =>
			typeEl.createEl("option", { text: opt, value: opt })
		);
		typeEl.value = savedFeature?.type || "Passive";
		
		// Cost dropdown
		const costEl = headerRow.createEl('select', { cls: 'input-feature-cost' });
		['', 'Spend a Fear'].forEach(opt =>
			costEl.createEl("option", { text: opt || 'none', value: opt })
		);
		costEl.value = savedFeature?.cost || '';
		
		// Main feature description
		const descEl = wrapper.createEl('textarea', {
			cls: 'feature-desc',
			placeholder: 'Feature description text...'
		});
		descEl.value = savedFeature?.text || '';
		
		// Single question section
		const questionContainer = wrapper.createDiv({ cls: 'question-container' });
		questionContainer.createDiv({
			cls: 'question-header',
			text: 'GM Prompt Question:'
		});
		
		const questionEl = questionContainer.createEl('textarea', {
			cls: 'feature-question',
			placeholder: 'Q: Enter question for players...'
		});
		
		// Set value if saved question exists (take first question only if multiple existed)
		if (savedFeature?.questions && savedFeature.questions.length > 0) {
			questionEl.value = savedFeature.questions[0] 
				? savedFeature.questions[0] 
				: `${savedFeature.questions[0]}`;
		}
		
		// Remove button
		const removeBtn = wrapper.createEl('button', { 
			text: 'Remove Feature', 
			cls: 'env-remove-feature-btn' 
		});
		removeBtn.onclick = () => {
			const index = this.features.findIndex(f => f.nameEl === nameEl);
			if (index !== -1) {
				this.features.splice(index, 1);
				wrapper.remove();
			}
		};
		
		this.features.push({ 
			nameEl, 
			typeEl, 
			costEl, 
			textEl: descEl,
			bulletEls: [], 
			questionEls: [questionEl] // Single question as array with one element
		});
	}

	getFeatureValues(): EnvironmentData["features"] {
		return this.features.map(f => ({
			name: f.nameEl.value.trim(),
			type: f.typeEl.value.trim(),
			cost: f.costEl?.value.trim() || undefined,
			text: f.textEl.value.trim(),
			bullets: f.bulletEls.map(b => b.value.trim()).filter(b => b),
			questions: f.questionEls.map(q => q.value.trim()).filter(q => q)
		}));
	}

	onClose(): void {
		this.plugin.savedInputState = {};

		for (const [key, el] of Object.entries(this.inputs)) {
			this.plugin.savedInputState[key] = el.value;
		}

		this.plugin.savedInputState.features = this.getFeatureValues();
	}
}