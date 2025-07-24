import { Modal, Editor } from 'obsidian';
import type DaggerForgePlugin from '../../main';
import {
	createField,
	createShortTripleFields,
    createInlineField
} from '../../utils/formHelpers';
import { FormInputs, FeatureElements, SavedFeatureState, EnvironmentDatas} from '../environmentTypes';
// import { ADVERSARIES } from '@/data/adversaries';
import { environmentToHTML } from '../environmentsToHTML';

export class EnvironmentModal extends Modal {
	plugin: DaggerForgePlugin;
	editor: Editor;
	inputs: FormInputs = {};
	features: FeatureElements[] = [];
	featureContainer: HTMLElement;
    onSubmit: (result: EnvironmentDatas) => void;

	constructor(plugin: DaggerForgePlugin, editor: Editor, onSubmit: (result: EnvironmentDatas) => void) {
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
            label: 'desc',
            key: 'desc',
            type: 'input',
            savedValues: saved,
            customClass: 'env-desc-input'
        });

		const thirdRow = contentEl.createDiv({ cls: 'env-form-third-row'});
		createInlineField(thirdRow, this.inputs, {
			label: 'Impulses',
			key: 'impulses',
			type: 'input',
			savedValues: saved,
			customClass: 'env-impulse-input'
		})

        const forthRow = contentEl.createDiv({ cls: 'env-form-forth-row' });
		createInlineField(forthRow, this.inputs, {
            label: 'Potentioal Adversaries',
            key: 'potentioal-adversaries',
            type: 'select',
            options: ['monster1','monster2'],
            savedValues: saved,
            customClass: 'env-type-select'
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
			cls: "add-feature-btn"
		});
		addBtn.onclick = () => this.addFeature();

		const insertBtn = contentEl.createEl("button", {
			text: "Insert Environment",
			cls: "insert-card-btn"
		});

		insertBtn.onclick = () => {
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([k, el]) => [k, el.value.trim()])
			);
			const features = this.getFeatureValues();

			const env: EnvironmentDatas = {
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
    ["Action", "Reaction", "Passive", "Trait"].forEach(opt =>
        typeEl.createEl("option", { text: opt, value: opt })
    );
    typeEl.value = savedFeature?.type || "Passive";
    
    // Cost dropdown
    const costEl = headerRow.createEl('select', { cls: 'input-feature-cost' });
    ['', 'Mark Stress', 'Spend Resource'].forEach(opt =>
        costEl.createEl("option", { text: opt || 'none', value: opt })
    );
    costEl.value = savedFeature?.cost || '';
    
    // Add colon between type and cost for display
    headerRow.createSpan({ text: ": ", cls: 'feature-header-separator' });
    
    // Main feature description
    const descEl = wrapper.createEl('textarea', {
        cls: 'feature-desc',
        placeholder: 'Feature description text...'
    });
    descEl.value = savedFeature?.text || '';
    
    // // Bullet points section
    // const bulletsContainer = wrapper.createDiv({ cls: 'bullets-container' });
    // const bulletsHeader = bulletsContainer.createDiv({ 
    //     cls: 'bullets-header',
    //     text: 'Bullet Points:' 
    // });
    
    // const bulletEls: HTMLTextAreaElement[] = [];
    // const addBulletBtn = bulletsContainer.createEl('button', {
    //     text: '+ Add Bullet Point',
    //     cls: 'add-bullet-btn'
    // });
    
    // addBulletBtn.onclick = () => {
    //     const bulletEl = bulletsContainer.createEl('textarea', {
    //         cls: 'feature-bullet',
    //         placeholder: '• Enter bullet point text...'
    //     });
    //     bulletEls.push(bulletEl);
    // };
    
    // // Initialize with saved bullets
    // savedFeature?.bullets?.forEach(bullet => {
    //     const bulletEl = bulletsContainer.createEl('textarea', {
    //         cls: 'feature-bullet',
    //         value: `• ${bullet.replace(/^•\s*/, '')}`
    //     });
    //     bulletEls.push(bulletEl);
    // });
    
    // Questions section
    const questionsContainer = wrapper.createDiv({ cls: 'questions-container' });
    const questionsHeader = questionsContainer.createDiv({
        cls: 'questions-header',
        text: 'Questions for Players:'
    });
    
    const questionEls: HTMLTextAreaElement[] = [];
    const addQuestionBtn = questionsContainer.createEl('button', {
        text: '+ Add Question',
        cls: 'add-question-btn'
    });
    
    addQuestionBtn.onclick = () => {
        const questionEl = questionsContainer.createEl('textarea', {
            cls: 'feature-question',
            placeholder: 'Q: Enter question for players...'
        });
        questionEls.push(questionEl);
    };
    
    // Initialize with saved questions
    savedFeature?.questions?.forEach(question => {
        const questionEl = questionsContainer.createEl('textarea', {
            cls: 'feature-question',
            value: question.startsWith('Q:') ? question : `Q: ${question}`
        });
        questionEls.push(questionEl);
    });
    
    // Remove button
    const removeBtn = wrapper.createEl('button', { 
        text: 'Remove Feature', 
        cls: 'remove-feature-btn' 
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
        questionEls 
    });
}

	getFeatureValues(): EnvironmentDatas["features"] {
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