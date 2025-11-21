// import { App, Editor, Modal, Notice } from "obsidian";
// import type DaggerForgePlugin from "../src/main";

// export class TextInputModal extends Modal {
// 	inputs: Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = {};
// 	insertBtn: HTMLButtonElement;
// 	addFeatureBtn: HTMLButtonElement;
// 	featureContainer: HTMLElement;
// 	cardElement: HTMLElement;
// 	features: { nameEl: HTMLInputElement; typeEl: HTMLSelectElement; costEl: HTMLSelectElement; descEl: HTMLTextAreaElement }[] = [];
// 	plugin: DaggerForgePlugin;
// 	savedInputState: Record<string, string> = {};
// 	editor: Editor;

// 		constructor(plugin: DaggerForgePlugin, editor: Editor, cardElement: HTMLElement) {
// 		super(plugin.app);
// 		this.plugin = plugin;
// 		this.editor = editor;
// 		this.cardElement = cardElement;
// 		}

//     onOpen() {
// 		const saved = this.plugin.savedInputState || {};
//         const { contentEl } = this;
// 		const setValueIfSaved = (
// 			key: string,
// 			el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
// 		) => {
// 			if (saved[key] !== undefined) {
// 				el.value = saved[key];
// 			}
// 		};

//         contentEl.empty();
//         contentEl.createEl('h2', { text: 'Adversary Stat Block', cls: 'modal-title' });
//         const createField = (
//             label: string,
//             key: string,
//             type: 'input' | 'textarea' = 'input',
//             customClass?: string
//         ) => {
//             const wrapper = contentEl.createDiv({ cls: 'field-row' });
//             wrapper.createEl('label', {
//                 text: label,
//                 cls: 'inline-label',
//             });
//             if (type === 'input') {
//                 const field = wrapper.createEl('input', {
//                     cls: ['input-field', customClass].filter(Boolean) as string[],
//                 });
//                 this.inputs[key] = field;
// 				setValueIfSaved(key, field);
//             } else {
//                 const field = wrapper.createEl('textarea', {
//                     cls: ['input-field', customClass].filter(Boolean) as string[],
//                 });
//                 this.inputs[key] = field;
// 				setValueIfSaved(key, field);
//             }
//         };
// 		const createShortTripleFields = (
// 			label1: string, key1: string,
// 			label2: string, key2: string,
// 			label3: string, key3: string,
// 			parent: HTMLElement,
// 			dropdownFieldKey?: string,
// 			dropdownOptions?: string[]
// 			) => {
// 			const row = parent.createDiv();
// 			row.addClass('flex-row');

// 			const create = (label: string, key: string) => {
// 			const wrapper = row.createDiv({ cls: 'inline-field' });
// 			wrapper.createEl('label', { text: label });
// 			if (dropdownFieldKey === key) {
// 			// Create select dropdown instead of input
// 			const select = wrapper.createEl('select', { cls: 'input-field' }) as HTMLSelectElement;
// 			if (dropdownOptions) {
// 				dropdownOptions.forEach(opt => {
// 				select.createEl('option', { text: opt, value: opt });
// 				});
// 			}
// 			this.inputs[key] = select;
// 			setValueIfSaved(key, select);
// 			} else {
// 			// Create regular input
// 			const input = wrapper.createEl('input', {
// 				cls: 'input-field',
// 				attr: { type: 'text' }
// 			}) as HTMLInputElement;
// 			this.inputs[key] = input;
// 			setValueIfSaved(key, input);
// 			}
// 		};
// 		create(label1, key1);
// 		create(label2, key2);
// 		create(label3, key3);
// 	};

// 		// createField('Name ', 'name', 'textarea', 'adversary-name-textarea');
// 		contentEl.createEl('label', { text: 'Name ' });
// 		const nameField = contentEl.createEl('input', {
// 			cls:'adversary-name-textarea'
// 		});
// 		this.inputs['name'] = nameField;
// 		setValueIfSaved('name', nameField);
// 		// === Tier dropdown ===
// 		contentEl.createEl('label', { text: ' Tier ' });
// 		const tierSelect = contentEl.createEl('select', { cls: 'input-field-first-row-tier' });
// 		['1', '2', '3', '4'].forEach((level, index) => {
// 			const option = tierSelect.createEl('option', { text: level, value: level });
// 		});
// 		tierSelect.selectedIndex = 0;
// 		this.inputs['tier'] = tierSelect;
// 		setValueIfSaved('tier', tierSelect);
// 		// === Type dropdown ===
// 		contentEl.createEl('label', { text: ' Type ' });
// 		const typeSelect = contentEl.createEl('select', { cls: 'input-field-first-row' });
// 		['Bruiser', 'Horde', 'Leader', 'Minion', 'Ranged', 'Skulk', 'Social', 'Solo', 'Standard', 'Support'].forEach((type, index) => {
// 			const option = typeSelect.createEl('option', { text: type, value: type });
// 		});
// 		typeSelect.selectedIndex = 0; // Select the first option
// 		this.inputs['type'] = typeSelect;
// 		setValueIfSaved('type', typeSelect);
// 		contentEl.createEl('br');
// 		createField('Description', 'desc', 'textarea', 'description-textarea');
// 		createField('Motives ', 'motives', 'input', 'motives-input');
// 		// Create a row container for just these three fields
// 		createShortTripleFields(
// 			'Difficulty', 'difficulty',
// 			'Major', 'thresholdMajor',
// 			'Severe', 'thresholdSevere', contentEl)
// 		createShortTripleFields(
// 			'HP', 'hp',
// 			'Stress (optional)', 'stress',
// 			'ATK Mod', 'atk', contentEl);
// 		createShortTripleFields(
// 		'Weapon Name', 'weaponName',
// 		'Weapon Range', 'weaponRange',
// 		'Weapon Damage', 'weaponDamage',
// 		contentEl,
// 		'weaponRange',
// 		['Melee', 'Very Close', 'Close', 'Far', 'Very Far']
// 		);
// 		createField('Experience (optional) ', 'xp', 'input', 'experience-input');

// 		this.featureContainer = contentEl.createDiv('feature-container'); // Container for features

// 		// Clear previous features
// 		this.features = [];
// 		this.featureContainer.empty();
// 		("feature.length:", saved.features?.length);

// 		if (Array.isArray(saved.features) && saved.features.length > 0) {
// 			saved.features.forEach((data: { [key: string]: string }) => {
// 				this.addFeature((key, el) => {
// 					if (data[key] !== undefined) el.value = data[key];
// 				});
// 			});
// 		} else {
// 			this.addFeature(setValueIfSaved);
// 		}

// 		this.addFeatureBtn = contentEl.createEl('button', {
// 			text: 'Add Feature',
// 			cls: 'add-feature-btn'
// 		});
// 		this.addFeatureBtn.onclick = () => this.addFeature(setValueIfSaved);
// 		// === Insert Button ===
// 		this.insertBtn = contentEl.createEl('button', {
// 		text: 'Insert Card',
// 		cls: 'insert-card-btn'
// 		});

// 		this.insertBtn.onclick = () => {
// 			const values = Object.fromEntries(
// 				Object.entries(this.inputs).map(([key, el]) => [key, (el as HTMLInputElement | HTMLTextAreaElement).value.trim()])
// 			);

// 			const features = this.features.map(({ nameEl, typeEl, costEl, descEl }) => ({
// 				name: nameEl.value.trim(),
// 				type: typeEl.value.trim(),
// 				cost: costEl.value.trim(),
// 				desc: descEl.value.trim()
// 			})).filter(f => f.name);
// 			this.editor.replaceSelection(this.buildCardHTML(values, features) + '\n');
// 			for (const el of Object.values(this.inputs)) {
// 				if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
// 					el.value = "";
// 				} else if (el instanceof HTMLSelectElement) {
// 					el.selectedIndex = 0; // reset to first option
// 				}
// 			}
// 			for (const { nameEl, typeEl, costEl, descEl } of this.features) {
// 				nameEl.value = "";
// 				typeEl.selectedIndex = 0;
// 				costEl.selectedIndex = 0;
// 				descEl.value = "";
// 			}
// 			this.plugin.savedInputState = {};
// 			this.features = [];
// 			this.featureContainer.empty();
// 			this.close();
// 		};
// 	}

// 	addFeature(setValueIfSaved: (key: string, el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => void) {
// 		const wrapper = this.featureContainer.createDiv({ cls: 'feature-block' });

// 		// Flex container for name and type side by side
// 		const row = wrapper.createDiv({ cls: 'feature-row' });

// 		const nameEl = row.createEl('input', {
// 		cls: 'input-feature-name',
// 		placeholder: 'Feature Name'
// 		});
// 		setValueIfSaved('featureName', nameEl);

// 		const typeEl = row.createEl('select', { cls: 'field-feature-type' });
// 		['Action', 'Reaction', 'Passive'].forEach(type => {
// 		typeEl.createEl('option', { text: type, value: type });
// 		});
// 		setValueIfSaved('featureType', typeEl);

// 		const costEl = row.createEl('select', { cls: 'input-feature-cost' });
// 		['', 'Mark a Stress', 'Spend a Fear'].forEach(opt => {
// 		costEl.createEl('option', { text: opt === '' ? 'none' : opt, value: opt });
// 		});
// 		setValueIfSaved('featureCost', costEl);

// 		const descEl = wrapper.createEl('textarea', {
// 		cls: 'feature-desc-input',
// 		placeholder: 'Feature Description'
// 		});
// 		setValueIfSaved('featureDesc', descEl);

// 		const removeBtn = wrapper.createEl('button', { text: 'Remove', cls: 'remove-feature-btn' });

// 		removeBtn.onclick = () => {
// 			const index = this.features.findIndex(f => f.nameEl === nameEl);
// 			if (index !== -1) {
// 				this.features.splice(index, 1);
// 				wrapper.remove();
// 			}
// 		};

// 		this.features.push({ nameEl, typeEl, costEl, descEl });
// 	}

// 	buildCardHTML(values: Record<string, string>, features: { name: string; type: string; cost: string; desc: string }[]): string {
// 		const {
// 			name, tier, type, desc, motives, difficulty,
// 			thresholdMajor, thresholdSevere, hp, stress, atk,
// 			weaponName, weaponRange, weaponDamage, xp
// 		} = values;

// 			const hptick = Number(hp) || 0;  // fallback to 0 if undefined
// 			const hpTickboxes = Array.from({ length: hptick }, (_, i) => `
// 			<input type="checkbox" id="hp-tick-${i}" class="hp-tickbox" />
// 			`).join('');
// 			const stresstick = Number(stress) ?? 0; // nullish coalescing fallback to 0
// 			const stressTickboxes = Array.from({ length: stresstick }, (_, i) => `
// 			<input type="checkbox" id="stress-tick-${i}" class="stress-tickbox" />
// 			`).join('');
// 		const stressBlock = stress ? `Stress: <span class="stat">${stress}</span>` : '';

// 		const featuresHTML = features.map(f => `
// 			<div class="feature">
// 			<span class="feature-title">
// 				${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ':'}
// 			</span>
// 			<span class="feature-desc">${f.desc}</span>
// 			</div>`).join('');

// 		return `
// <div class="card-outer pseudo-cut-corners outer">
// 	<div class="card-inner pseudo-cut-corners inner">
// 		1<button class="edit-button">Edit</button>
// 	    <div class="hp-tickboxes">
// 		<span class="hp-stress">HP</span>${hpTickboxes}
// 		</div>
// 		<div class="stress-tickboxes">
// 			<span class="hp-stress">Stress</span>${stressTickboxes}
// 		</div>
// 		<h2>${name}</h2>
// 			<div class="subtitle">Tier ${tier} ${type} </div>
// 			<div class="desc">${desc}</div>
// 			<div class="motives">Motives & Tactics:
// 			<span class="motives-desc">${motives}</span>
// 			</div>
// 			<div class="stats">
// 			Difficulty: <span class="stat">${difficulty} |</span>
// 			Thresholds: <span class="stat">${thresholdMajor}/${thresholdSevere} |</span>
// 			HP: <span class="stat">${hp} |</span>
// 			${stressBlock}
// 			<br>ATK: <span class="stat">${atk} |</span>
// 			${weaponName}: <span class="stat">${weaponRange} | ${weaponDamage}</span><br>
// 			<div class="experience-line">Experience: <span class="stat">${xp}</span></div>
// 			</div>
// 			<div class="section">FEATURES</div>
// 			${featuresHTML}
// 	</div>
// </div>
// `.trim();
// 	}
// 	onClose() {
// 		this.plugin.savedInputState = {};

// 		// Save top-level inputs
// 		for (const [key, el] of Object.entries(this.inputs)) {
// 			const value = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
// 			this.plugin.savedInputState[key] = value;
// 		}

// 		// ✅ Save features too
// 		this.plugin.savedInputState.features = this.features.map(({ nameEl, typeEl, costEl, descEl }) => ({
// 			featureName: nameEl.value,
// 			featureType: typeEl.value,
// 			featureCost: costEl.value,
// 			featureDesc: descEl.value
// 		}));
// 	}
// }
