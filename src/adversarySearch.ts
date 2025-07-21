import { ItemView, WorkspaceLeaf, Notice, MarkdownView } from "obsidian";
import adversariesTier1 from '../../adversaries/Adversaries-Tier-1.json';
import adversariesTier2 from '../../adversaries/Adversaries-Tier-2.json';
import adversariesTier3 from '../../adversaries/Adversaries-Tier-3.json';
import adversariesTier4 from '../../adversaries/Adversaries-Tier-4.json';


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
		container.createEl("h2", { text: "Adversary Creator" });
		const input = container.createEl("input", { // Create search input
			attr: {
				type: "text",
				placeholder: "Search adversaries...",
			},
			cls: "adversary-search-box"
		});
        const buttonContainer = document.createElement('span');
        buttonContainer.className = 'tier-buttons';
        const tiers = ['ALL', '1', '2', '3', '4'];
        tiers.forEach(tierLabel => {
            const button = document.createElement('button');
            button.textContent = tierLabel === 'ALL' ? 'ALL' : `Tier ${tierLabel}`;
            button.classList.add('tier-filter-btn');
            button.addEventListener('click', () => {
                input.value = ''; // Clear search box on tier filter
                let filtered = [];
                if (tierLabel === 'ALL') {
                    filtered = this.adversaries;
                } else {
                    filtered = this.adversaries.filter(a => a.tier.toString() === tierLabel);
                }
                renderResults(filtered);
            });
            buttonContainer.appendChild(button);
        });
        container.appendChild(buttonContainer); // Append before search input or result list
        const resultsDiv = container.createEl("div", {
        cls: "adversary-results",
        text: "Results will appear here."
        });
        try {
            const allAdversaries = [
            ...adversariesTier1,
            ...adversariesTier2,
            ...adversariesTier3,
            ...adversariesTier4,
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
        new Notice("No markdown file is open.");
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

    const features = adversary.features as Feature[] || []; // Fallback to empty array if features are not defined
    const featuresHTML = features.map((f: Feature) => `
            <div class="feature">
            <span class="feature-title">
                ${f.name} - ${f.type}${f.cost ? `: ${f.cost}` : ':'}
            </span>
            <span class="feature-desc">${f.desc}</span>
            </div>`).join('');

const adversaryText = `
<div class="card-outer pseudo-cut-corners outer">
    <div class="card-inner pseudo-cut-corners inner">
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
