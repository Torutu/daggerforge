import { ItemView, WorkspaceLeaf, MarkdownView, Notice } from "obsidian";
import envTier1 from '../../env/env-tier-1.json';
import envTier2 from '../../env/env-tier-2.json';
import envTier3 from '../../env/env-tier-3.json';
import envTier4 from '../../env/env-tier-4.json';

export const ENVIRONMENT_VIEW_TYPE = "environment-view";

export class EnvironmentView extends ItemView {
	private environments: any[] = [];

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return ENVIRONMENT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Environment Cards";
	}

	getIcon(): string {
		return "mountain";
	}

	private lastActiveMarkdown: MarkdownView | null = null;

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			const view = leaf?.view;
			if (view instanceof MarkdownView) {
				this.lastActiveMarkdown = view;
			}
		}));

		container.createEl("h2", { text: "Environment Cards" });

		const input = container.createEl("input", {
			attr: {
				type: "text",
				placeholder: "Search environments...",
			},
			cls: "env-search-box"
		});

		const buttonContainer = document.createElement('span');
		buttonContainer.className = 'tier-buttons';
		const tiers = ['ALL', '1', '2', '3', '4'];
		tiers.forEach(tierLabel => {
			const button = document.createElement('button');
			button.textContent = tierLabel === 'ALL' ? 'ALL' : `Tier ${tierLabel}`;
			button.classList.add('tier-filter-btn');
			button.addEventListener('click', () => {
				input.value = '';
				let filtered = [];
				if (tierLabel === 'ALL') {
					filtered = this.environments;
				} else {
					filtered = this.environments.filter(e => e.tier.toString() === tierLabel);
				}
				renderResults(filtered);
			});
			buttonContainer.appendChild(button);
		});
		container.appendChild(buttonContainer);

		const resultsDiv = container.createEl("div", {
			cls: "env-results",
			text: "Results will appear here."
		});

		try {
			const allEnv = [
				...envTier1,
				...envTier2,
				...envTier3,
				...envTier4,
			];
			this.environments = allEnv;
		} catch (e) {
			new Notice("Failed to load environment data.");
			resultsDiv.setText("Error loading environment data.");
			return;
		}

		const renderResults = (filtered: any[]) => {
			resultsDiv.empty();
			if (filtered.length === 0) {
				resultsDiv.setText("No environments found.");
				return;
			}
			filtered.forEach(env => {
				const card = this.createEnvironmentCard(env);
				resultsDiv.appendChild(card);
			});
		};

		// Initial render
		renderResults(this.environments);

		input.addEventListener('input', () => {
			const query = input.value.toLowerCase();
			const filtered = this.environments.filter(env =>
				env.name.toLowerCase().includes(query) ||
				env.type.toLowerCase().includes(query)
			);
			renderResults(filtered);
		});
	}

    createEnvironmentCard(env: any): HTMLElement {
        const card = document.createElement("div");
        card.classList.add("env-card"); // You can keep this or rename it to "adversary-card" for uniform styling

        const tier = document.createElement("p");
        tier.classList.add("tier-text");
        tier.textContent = `Tier ${env.tier} ${env.type}`;
        card.appendChild(tier);

        const title = document.createElement("h3");
        title.classList.add("title-small-padding");
        title.textContent = env.name || "Unnamed Environment";
        card.appendChild(title);

        const desc = document.createElement("p");
        desc.classList.add("desc-small-padding");
        desc.textContent = env.desc || "No description available.";
        card.appendChild(desc);

		card.addEventListener('click', () => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView) || this.lastActiveMarkdown;
		if (!view) {
			new Notice("No markdown file is open.");
			return;
		}
		const editor = view.editor;
		if (!editor) {
			new Notice("Cannot find editor in markdown view.");
			return;
		}
		// Format features as HTML blocks
		const featuresHTML = (env.features || []).map((f: any) => {
			const costHTML = f.cost ? `<span><strong>Cost:</strong> ${f.cost}</span>` : '';
			const questionsHTML = f.questions && f.questions.length
			? `<p>${f.questions.map((q: string) => `${q}`).join('')}</p>`
			: '';
			return `
			<div class="feature">
				<div class="env-feat-name-type">${f.name} - ${f.type}<span class="env-feat-text"> ${f.text}</span></div>
				${costHTML}
				${questionsHTML}
			</div>
			`;
		}).join('');
		// Compose the full HTML block
		const envHTML = `
<div class="env-card-outer">
			<div class="env-card-inner">
				<div class="env-name">${env.name}</div>
				<div class="env-feat-tier-type">Tier ${env.tier} ${env.type}</div>
				<p class="env-desc">${env.desc}</p>
				<p><strong>Impulse:</strong> ${env.impulse || ''}</p>
				<div class="env-card-diff-pot">
				<p><span class="bold-title">Difficulty</span>: ${env.difficulty || ''}</p>
				<p><span class="bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ''}</p>
				</div>
				<div class="features-section">
				<h3>Features</h3>
				${featuresHTML}
				</div>
			</div>
</div>
		`;
		editor.replaceSelection(envHTML);
		new Notice(`Inserted environment ${env.name} into the note.`);
		});
		return card;
	}
}
