import { App, Editor, Modal } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { createField, createShortTripleFields, createSelectField } from "./formHelpers";
import { addFeature, getFeatureValues } from "./featureManager";
import { buildCardHTML } from "./cardBuilder";
import { FormInputs, FeatureElements } from "./types";

export class TextInputModal extends Modal {
    inputs: FormInputs = {};
    insertBtn: HTMLButtonElement;
    addFeatureBtn: HTMLButtonElement;
    featureContainer: HTMLElement;
    cardElement?: HTMLElement;
    features: FeatureElements[] = [];
    plugin: DaggerForgePlugin;
    savedInputState: Record<string, string> = {};
    editor: Editor;
    onSubmit?: (newHTML: string) => void;  // Add this new property
    isEditMode: boolean = false;          // Add this flag

    constructor(plugin: DaggerForgePlugin, editor: Editor, cardElement?: HTMLElement) {
        super(plugin.app);
        this.plugin = plugin;
        this.editor = editor;
        this.cardElement = cardElement;
        this.isEditMode = !!cardElement;
    }

    onOpen() {
        const saved = this.plugin.savedInputState || {};
        const { contentEl } = this;
        
        const setValueIfSaved = (
            key: string,
            el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        ) => {
            if (saved[key] !== undefined) {
                el.value = saved[key];
            }
        };

        contentEl.empty();
        const title = this.cardElement ? 'Edit Adversary' : 'Create Adversary';
        contentEl.createEl('h2', { text: title, cls: 'modal-title' });

        // Name field
        contentEl.createEl('label', { text: 'Name ' });
        const nameField = contentEl.createEl('input', { cls: 'adversary-name-textarea' });
        this.inputs['name'] = nameField;
        setValueIfSaved('name', nameField);

        // Tier dropdown
        createSelectField(
            contentEl,
            this.inputs,
            ' Tier ',
            'tier',
            ['1', '2', '3', '4'],
            saved,
            'input-field-first-row-tier'
        );

        // Type dropdown
        createSelectField(
            contentEl,
            this.inputs,
            ' Type ',
            'type',
            ['Bruiser', 'Horde', 'Leader', 'Minion', 'Ranged', 'Skulk', 'Social', 'Solo', 'Standard', 'Support'],
            saved,
            'input-field-first-row'
        );

        contentEl.createEl('br');
        createField(contentEl, this.inputs, 'Description', 'desc', 'textarea', 'description-textarea', saved);
        createField(contentEl, this.inputs, 'Motives ', 'motives', 'input', 'motives-input', saved);

        // Create stat fields
        createShortTripleFields(
            contentEl,
            this.inputs,
            'Difficulty', 'difficulty',
            'Major', 'thresholdMajor',
            'Severe', 'thresholdSevere',
            undefined, undefined, saved
        );

        createShortTripleFields(
            contentEl,
            this.inputs,
            'HP', 'hp',
            'Stress (optional)', 'stress',
            'ATK Mod', 'atk',
            undefined, undefined, saved
        );

        createShortTripleFields(
            contentEl,
            this.inputs,
            'Weapon Name', 'weaponName',
            'Weapon Range', 'weaponRange',
            'Weapon Damage', 'weaponDamage',
            'weaponRange',
            ['Melee', 'Very Close', 'Close', 'Far', 'Very Far'],
            saved
        );

        createField(contentEl, this.inputs, 'Experience (optional) ', 'xp', 'input', 'experience-input', saved);

        this.featureContainer = contentEl.createDiv('feature-container');
        this.features = [];
        this.featureContainer.empty();

        if (Array.isArray(saved.features) && saved.features.length > 0) {
            saved.features.forEach((data: Record<string, string>) => {
                addFeature(this.featureContainer, this.features, (key, el) => {
                    if (data[key] !== undefined) el.value = data[key];
                });
            });
        } else {
            addFeature(this.featureContainer, this.features, setValueIfSaved);
        }

        this.addFeatureBtn = contentEl.createEl('button', {
            text: 'Add Feature',
            cls: 'add-feature-btn'
        });
        this.addFeatureBtn.onclick = () => addFeature(this.featureContainer, this.features, setValueIfSaved);

        // Modified button handling
        this.insertBtn = contentEl.createEl('button', {
            text: this.cardElement ? 'Update Card' : 'Insert Card',
            cls: 'insert-card-btn'
        });

        this.insertBtn.onclick = () => {
            const values = Object.fromEntries(
                Object.entries(this.inputs).map(([key, el]) => [key, (el as HTMLInputElement | HTMLTextAreaElement).value.trim()])
            );

            const features = getFeatureValues(this.features);
            const newHTML = buildCardHTML(values, features);
            
            if (this.cardElement) {
                // Edit mode - replace existing card
                this.cardElement.outerHTML = newHTML;
            } else {
                // Create mode - insert new card
                this.editor.replaceSelection(newHTML + '\n');
            }
            
            // Reset form (keep this as is)
            for (const el of Object.values(this.inputs)) {
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                    el.value = "";
                } else if (el instanceof HTMLSelectElement) {
                    el.selectedIndex = 0;
                }
            }
            
            this.features.forEach(({ nameEl, typeEl, costEl, descEl }) => {
                nameEl.value = "";
                typeEl.selectedIndex = 0;
                costEl.selectedIndex = 0;
                descEl.value = "";
            });
            
            this.plugin.savedInputState = {};
            this.features = [];
            this.featureContainer.empty();
            this.close();
        };
    }

    onClose() {
        this.plugin.savedInputState = {};

        // Save top-level inputs
        for (const [key, el] of Object.entries(this.inputs)) {
            const value = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
            this.plugin.savedInputState[key] = value;
        }

        // Save features
        this.plugin.savedInputState.features = this.features.map(({ nameEl, typeEl, costEl, descEl }) => ({
            featureName: nameEl.value,
            featureType: typeEl.value,
            featureCost: costEl.value,
            featureDesc: descEl.value
        }));
    }
}