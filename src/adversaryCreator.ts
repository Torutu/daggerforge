import { App, Editor, Modal } from "obsidian";

export class TextInputModal extends Modal {
	inputs: Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = {};
	insertBtn: HTMLButtonElement;
	addFeatureBtn: HTMLButtonElement;
	featureContainer: HTMLElement;
	features: { nameEl: HTMLInputElement; typeEl: HTMLSelectElement; costEl: HTMLSelectElement; descEl: HTMLTextAreaElement }[] = [];

	constructor(app: App, private editor: Editor) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'Adversary stat block', cls: 'df-modal-title' });

		const createField = (
			label: string,
			key: string,
			type: 'input' | 'textarea' = 'input',
			customClass?: string
		) => {
			const wrapper = contentEl.createDiv({ cls: 'df-field-row' });
			wrapper.createEl('label', {
				text: label,
				cls: 'inline-label',
			});

			if (type === 'input') {
				const field = wrapper.createEl('input', {
					cls: ['df-input-field', customClass].filter(Boolean) as string[],
				});
				this.inputs[key] = field;
			} else {
				const field = wrapper.createEl('textarea', {
					cls: ['df-input-field', customClass].filter(Boolean) as string[],
				});
				this.inputs[key] = field;
			}
		};

		const createShortTripleFields = (
			label1: string, key1: string,
			label2: string, key2: string,
			label3: string, key3: string,
			parent: HTMLElement,
			dropdownFieldKey?: string,
			dropdownOptions?: string[]
			) => {
			const row = parent.createDiv();
			row.addClass('df-flex-row');

		const create = (label: string, key: string) => {
			const wrapper = row.createDiv({ cls: 'df-inline-field' });
			wrapper.createEl('label', { text: label });

			if (dropdownFieldKey === key) {
			// Create select dropdown instead of input
			const select = wrapper.createEl('select', { cls: 'df-input-field' }) as HTMLSelectElement;
			if (dropdownOptions) {
				dropdownOptions.forEach(opt => {
				select.createEl('option', { text: opt, value: opt });
				});
			}
			this.inputs[key] = select;
			} else {
			// Create regular input
			const input = wrapper.createEl('input', {
				cls: 'df-input-field',
				attr: { type: 'text' }
			}) as HTMLInputElement;
			this.inputs[key] = input;
			}
		};
		create(label1, key1);
		create(label2, key2);
		create(label3, key3);
	};

		// Create all base fields
		// createField('Name ', 'name', 'textarea', 'adversary-name-textarea');
		contentEl.createEl('label', { text: 'Name ' });
		const nameField = contentEl.createEl('input', {
			cls:'df-adversary-name-textarea'
		});
		this.inputs['name'] = nameField;
		// === Tier dropdown ===
		contentEl.createEl('label', { text: ' Tier ' });
		const tierSelect = contentEl.createEl('select', { cls: 'df-input-field-first-row-tier' });
		['1', '2', '3', '4'].forEach(level => {
			tierSelect.createEl('option', { text: level, value: level });
		});
		this.inputs['tier'] = tierSelect;

		// === Type dropdown ===
		contentEl.createEl('label', { text: ' Type ' });
		const typeSelect = contentEl.createEl('select', { cls: 'df-input-field-first-row' });
		['Bruiser', 'Horde', 'Leader', 'Minion', 'Ranged', 'Skulk', 'Social', 'Solo', 'Standard', 'Support'].forEach(type => {
			typeSelect.createEl('option', { text: type, value: type });
		});
		this.inputs['type'] = typeSelect;
		contentEl.createEl('br');
		createField('Description', 'desc', 'textarea', 'df-description-textarea');
		createField('Motives ', 'motives', 'input', 'motives-input');
		// Create a row container for just these three fields

		createShortTripleFields(
			'Difficulty', 'difficulty',
			'Major', 'thresholdMajor',
			'Severe', 'thresholdSevere', contentEl)
		createShortTripleFields(
			'HP', 'hp',
			'Stress (optional)', 'stress',
			'ATK mod', 'atk', contentEl);
		createShortTripleFields(
		'Weapon name', 'weaponName',
		'Weapon range', 'weaponRange',
		'Weapon damage', 'weaponDamage',
		contentEl,
		'weaponRange',
		['Melee', 'Very close', 'Close', 'Far', 'Very far']
		);
		createField('Experience (optional) ', 'xp', 'input', 'experience-input');

		this.featureContainer = contentEl.createDiv('feature-container'); // Container for features

		this.addFeature(); // Add first feature by default
		this.addFeatureBtn = contentEl.createEl('button', {
			text: 'Add feature',
			cls: 'df-add-feature-btn'
		});

		this.addFeatureBtn.onclick = () => this.addFeature();

		// contentEl.createEl('br');
		// === Insert Button ===
		this.insertBtn = contentEl.createEl('button', {
		text: 'Insert card',
		cls: 'df-insert-card-btn'
		});

		this.insertBtn.onclick = () => {
			const values = Object.fromEntries(
				Object.entries(this.inputs).map(([key, el]) => [key, (el as HTMLInputElement | HTMLTextAreaElement).value.trim()])
			);
			
			const features = this.features.map(({ nameEl, typeEl, costEl, descEl }) => ({
				name: nameEl.value.trim(),
				type: typeEl.value.trim(),
				cost: costEl.value.trim(),
				desc: descEl.value.trim()
			})).filter(f => f.name); // only include features with a name
			
			this.editor.replaceSelection(this.buildCardHTML(values, features) + '\n');
			this.close();
		};
	}

	addFeature() {
		const wrapper = this.featureContainer.createDiv({ cls: 'df-feature-block' });

		// Flex container for name and type side by side
		const row = wrapper.createDiv({ cls: 'df-feature-row' });

		const nameEl = row.createEl('input', {
		cls: 'df-input-feature-name',
		placeholder: 'Feature name'
		});


		const typeEl = row.createEl('select', { cls: 'df-field-feature-type' });
		['Action', 'Reaction', 'Passive'].forEach(type => {
		typeEl.createEl('option', { text: type, value: type });
		});


		const costEl = row.createEl('select', { cls: 'df-input-feature-cost' });
		['', 'Mark a stress', 'Spend a fear'].forEach(opt => {
		costEl.createEl('option', { text: opt === '' ? 'none' : opt, value: opt });
		});


		const descEl = wrapper.createEl('textarea', {
		cls: 'df-feature-desc-input',
		placeholder: 'Feature description'
		});

		const removeBtn = wrapper.createEl('button', { text: 'Remove', cls: 'df-remove-feature-btn' });

		removeBtn.onclick = () => {
			const index = this.features.findIndex(f => f.nameEl === nameEl);
			if (index !== -1) {
				this.features.splice(index, 1);
				wrapper.remove();
			}
		};

		this.features.push({ nameEl, typeEl, costEl, descEl });
	}

	buildCardHTML(values: Record<string, string>, features: { name: string; type: string; cost: string; desc: string }[]): string {
		const {
			name, tier, type, desc, motives, difficulty,
			thresholdMajor, thresholdSevere, hp, stress, atk,
			weaponName, weaponRange, weaponDamage, xp
		} = values;

		const stressBlock = stress ? `Stress: <span class="df-stat">${stress}</span>` : '';

		const featuresHTML = features.map(f => `
			<div class="df-feature">
			<span class="df-feature-title">
				${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ':'}
			</span>
			<span class="df-feature-desc">${f.desc}</span>
			</div>`).join('');


		return `
<div class="df-card-outer df-pseudo-cut-corners outer">
	<div class="df-card-inner df-pseudo-cut-corners inner">
		<h2>${name}</h2>
			<div class="df-subtitle">Tier ${tier} ${type} </div>
			<div class="df-desc">${desc}</div>
			<div class="df-motives">Motices & tactics:
			<span class="df-motives-desc">${motives}</span>
			</div>
			<div class="df-stats">
			Difficulty: <span class="df-stat">${difficulty} |</span>
			Thresholds: <span class="df-stat">${thresholdMajor}/${thresholdSevere} |</span>
			HP: <span class="df-stat">${hp} |</span>
			${stressBlock}
			<br>ATK: <span class="df-stat">${atk} |</span>
			${weaponName}: <span class="df-stat">${weaponRange} | ${weaponDamage}</span><br>
			<div class="experience-line">Experience: <span class="df-stat">${xp}</span></div>
			</div>
			<div class="df-section">Features</div>
			${featuresHTML}
	</div>
</div>
`.trim();
	}
	onClose() {
		this.contentEl.empty();
	}
}