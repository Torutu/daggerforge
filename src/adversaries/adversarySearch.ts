import { ItemView, WorkspaceLeaf, Notice, MarkdownView } from "obsidian";
import { ADVERSARIES } from '../data/adversaries';
import { getAdversaryCount, incrementAdversaryCount, decrementAdversaryCount, resetAdversaryCount } from "@/utils/adversaryCounter";
// Remove individual JSON imports

export const ADVERSARY_VIEW_TYPE = "adversary-view";

export class AdversaryView extends ItemView {
	private adversaries: any[] = [];
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType(): string {
		return ADVERSARY_VIEW_TYPE;
	}
	getDisplayText(): string {
		return "Adversary Creator";
	}
    getIcon(): string {
	return "venetian-mask";
    }
    private lastActiveMarkdown: MarkdownView | null = null; // Store the last active markdown view
	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
        
        this.registerEvent( // Listen for active leaf changes
        this.app.workspace.on('active-leaf-change', (leaf) => {
            const view = leaf?.view;
                if (view instanceof MarkdownView) {
                    this.lastActiveMarkdown = view;
                }
            })
        );
		container.createEl("h2", { 
            text: "Adversary Creator",
            cls: "adv-title" });
		const input = container.createEl("input", { // Create search input
			attr: {
				type: "text",
				placeholder: "Search adversaries...",
			},
			cls: "adversary-search-box"
		});
        // Create dropdown container
        const dropdownContainer = container.createDiv({ cls: 'tier-dropdown-container' });

        // Create the dropdown select element
        const dropdown = dropdownContainer.createEl('select', {
            cls: 'tier-dropdown'
        });

        // Create default "All Tiers" option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'ALL';
        defaultOption.textContent = 'All Tiers';
        defaultOption.selected = true;
        dropdown.appendChild(defaultOption);

        // Add tier options
        ['1', '2', '3', '4'].forEach(tier => {
            const option = document.createElement('option');
            option.value = tier;
            option.textContent = `Tier ${tier}`;
            dropdown.appendChild(option);
        });

        // Add event listener for dropdown changes
        dropdown.addEventListener('change', (e) => {
            const selectedTier = (e.target as HTMLSelectElement).value;
            input.value = ''; // Clear search box on tier filter
            
            let filtered = [];
            if (selectedTier === 'ALL') {
                filtered = this.adversaries;
            } else {
                filtered = this.adversaries.filter(a => a.tier.toString() === selectedTier);
            }
            
            renderResults(filtered);
        });

        const counterContainer = container.createDiv({ cls: 'adversary-counter-container' });
        // Create minus button
        const minusBtn = counterContainer.createEl('button', {
            text: '-',
            cls: 'adversary-counter-btn'
        });
        minusBtn.style.marginRight = '8px';

        // Create counter display
        const counterDisplay = counterContainer.createEl('span', {
            text: '1',  // Default to 1
            cls: 'adversary-counter-display'
        });
        counterDisplay.style.margin = '0 8px';

        // Create plus button
        const plusBtn = counterContainer.createEl('button', {
            text: '+',
            cls: 'adversary-counter-btn'
        });
        plusBtn.style.marginLeft = '8px';

        // Then update your button handlers:
        minusBtn.onclick = () => {
            decrementAdversaryCount(); // Uses default amount of 1
            counterDisplay.textContent = getAdversaryCount().toString();
        };

        plusBtn.onclick = () => {
            incrementAdversaryCount(); // Uses default amount of 1
            counterDisplay.textContent = getAdversaryCount().toString();
        };
        container.appendChild(dropdownContainer); // Append before search input or result list
        const resultsDiv = container.createEl("div", {
        cls: "adversary-results",
        text: "Results will appear here."
        });
        try {
            const allAdversaries = [
            ...ADVERSARIES.tier1,
            ...ADVERSARIES.tier2,
            ...ADVERSARIES.tier3,
            ...ADVERSARIES.tier4,
            ];
        this.adversaries = allAdversaries;
        } catch (e) {
        new Notice("Failed to load adversary data.");
        resultsDiv.setText("Error loading adversary data.");
        return;
        }
		// Function to render filtered adversaries
		const renderResults = (filtered: any[]) => {
			resultsDiv.empty();
			if (filtered.length === 0) {
				resultsDiv.setText("No adversaries found.");
				return;
			}
			filtered.forEach(a => {
				const card = this.createAdversaryCard(a);
				resultsDiv.appendChild(card);
			});
		};
		// Initial render of all adversaries
		renderResults(this.adversaries);
		// Search input listener
		input.addEventListener('input', () => {
			const query = input.value.toLowerCase();
			const filtered = this.adversaries.filter(a =>
				a.name.toLowerCase().includes(query)
                || a.type.toLowerCase().includes(query)
			);
			renderResults(filtered);
		});
	}
    createAdversaryCard(adversary: any): HTMLElement { // Create a card for each adversary
        const card = document.createElement('div');
        card.classList.add('adversary-card');
        const tier = document.createElement('p');
        tier.classList.add('tier-text');
        tier.textContent = `Tier ${adversary.tier} ${adversary.type}`;
        card.appendChild(tier);
        const title = document.createElement('h3');
        title.classList.add('title-small-padding');
        title.textContent = adversary.name || 'Unnamed Adversary';
        card.appendChild(title);
        const desc = document.createElement('p');
        desc.classList.add('desc-small-padding');
        desc.textContent = adversary.desc || 'No description available.';
        card.appendChild(desc);
card.addEventListener('click', () => {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView) || this.lastActiveMarkdown; // Use the last active markdown view if available

    if (!view) {
        new Notice("No note is open. Click on a note to activate it.");
        return;
    }
    if (view.getMode() !== 'source') {
		new Notice("You must be in edit mode to insert the adversary card.");
		return;
	}
    const editor = view.editor;
    if (!editor) {
        new Notice("Cannot find editor in markdown view.");
        return;
    }

    type Feature = {
        name: string;
        type: string;
        cost?: string;
        desc: string;
    };

        // Then in your adversary creation code:
        const currentCount = getAdversaryCount(); // Get the current count


        const features = adversary.features as Feature[] || [];
        const hp = adversary.hp || 0;
        const stress = adversary.stress ?? 0;

        // Create tickboxes templates
        const hpTickboxes = Array.from({ length: hp }, (_, i) => 
            `<input type="checkbox" id="hp-tick-${i}" class="hp-tickbox" />`
        ).join('');

        const stressTickboxes = Array.from({ length: stress }, (_, i) => 
            `<input type="checkbox" id="stress-tick-${i}" class="stress-tickbox" />`
        ).join('');

        // Create multiple instances of tickboxes with proper numbering
        const multipleTickboxes = Array.from({ length: currentCount }, (_, index) => `
            <div class="hp-tickboxes">
                <span class="hp-stress">HP</span>${hpTickboxes}
                <span class="adversary-count">${index + 1}</span>
            </div>
            <div class="stress-tickboxes">
                <span class="hp-stress">Stress</span>${stressTickboxes}
            </div>
        `).join('');

        const featuresHTML = features.map((f: Feature) => `
            <div class="feature">
                <span class="feature-title">
                    ${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ':'}
                </span>
                <span class="feature-desc">${f.desc}</span>
            </div>`
        ).join('');

        const adversaryText = `
 <div class="card-outer pseudo-cut-corners outer">
            <div class="card-inner pseudo-cut-corners inner">
                ${multipleTickboxes}
                <h2>${adversary.name}</h2>
                <div class="subtitle">Tier ${adversary.tier} ${adversary.type}</div>
                <div class="desc">${adversary.desc}</div>
                <div class="motives">Motives & Tactics:
                    <span class="motives-desc">${adversary.motives}</span>
                </div>
                <div class="stats">
                    Difficulty: <span class="stat">${adversary.difficulty} |</span>
                    Thresholds: <span class="stat">${adversary.thresholds} |</span>
                    HP: <span class="stat">${adversary.hp} |</span>
                    Stress: <span class="stat">${adversary.stress || ''}</span>
                    <div>ATK: <span class="stat">${adversary.atk} |</span>
                    ${adversary.weaponName}: <span class="stat">${adversary.weaponRange} | ${adversary.weaponDamage}</span></div>
                    <div class="experience-line">Experience: <span class="stat">${adversary.xp}</span></div>
                </div>
                <div class="section">FEATURES</div>
                ${featuresHTML}
            </div>
        </div>
`;
                editor.replaceSelection(adversaryText);
        new Notice(`Inserted ${adversary.name} into the note.`);
    });

        return card;
    }
}
