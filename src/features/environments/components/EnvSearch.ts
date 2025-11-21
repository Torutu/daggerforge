import { ItemView, WorkspaceLeaf, MarkdownView, Notice, setIcon } from "obsidian";
import { ENVIRONMENTS } from "../../../data/environments";
import { EnvironmentData } from "../../../types/environment";
import { isMarkdownActive, isCanvasActive, createCanvasCard, getAvailableCanvasPosition } from "../../../utils/canvasHelpers";
import { SearchEngine } from "../../../utils/searchEngine";
import { SearchControlsUI } from "../../../utils/searchControlsUI";

export const ENVIRONMENT_VIEW_TYPE = "environment-view";

export class EnvironmentView extends ItemView {
	private environments: any[] = [];
	private lastActiveMarkdown: MarkdownView | null = null;
	private searchEngine: SearchEngine = new SearchEngine();
	private searchControlsUI: SearchControlsUI | null = null;
	private resultsDiv: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return ENVIRONMENT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Environment Browser";
	}

	getIcon(): string {
		return "mountain";
	}

	public refresh() {
		this.initializeView();
		this.loadEnvironmentData();
	}

	private initializeView() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		// Create title
		container.createEl("h2", {
			text: "Environment Browser",
			cls: "df-env-title",
		});

		// Create search controls (will be populated with available options after data loads)
		this.searchControlsUI = new SearchControlsUI({
			placeholderText: "Search by name, type, or description...",
			showTypeFilter: true,
			availableTiers: [1, 2, 3, 4],
			availableSources: ["core", "void", "custom"],
			availableTypes: ["Social", "Exploration", "Event", "Traversal"],
			onSearchChange: (query) => this.handleSearchChange(query),
			onTierChange: (tier) => this.handleTierChange(tier),
			onSourceChange: (source) => this.handleSourceChange(source),
			onTypeChange: (type) => this.handleTypeChange(type),
			onClear: () => this.handleClearFilters(),
		});

		this.searchControlsUI.create(container);

		// Create results container
		this.resultsDiv = container.createEl("div", {
			cls: "df-environment-results",
		});
	}

	private async deleteCustomEnvironment(env: EnvironmentData): Promise<void> {
		try {
			const plugin = (this.app as any).plugins.plugins['daggerforge'] as any;
			if (!plugin || !plugin.dataManager) {
				new Notice("DaggerForge plugin not found.");
				return;
			}

			const customEnvs = plugin.dataManager.getEnvironments();
			const index = customEnvs.findIndex((e: EnvironmentData) => e.name === env.name);

			if (index !== -1) {
				await plugin.dataManager.deleteEnvironment(index);
				new Notice(`Deleted environment: ${env.name}`);
				this.refresh();
			} else {
				new Notice("Environment not found in custom list.");
			}
		} catch (error) {
			console.error("Error deleting custom environment:", error);
			new Notice("Failed to delete environment.");
		}
	}

	private loadCustomEnvironments(): EnvironmentData[] {
		try {
			const plugin = (this.app as any).plugins.plugins['daggerforge'];
			if (!plugin || !plugin.dataManager) {
				console.warn("DaggerForge plugin or dataManager not found");
				return [];
			}

			const customEnvs = plugin.dataManager.getEnvironments();

			return customEnvs.map((env: any) => ({
				...env,
				tier: typeof env.tier === "number" ? env.tier : parseInt(env.tier, 10),
				isCustom: true,
				source: env.source || "custom",
			}));
		} catch (error) {
			console.error("Error loading custom environments from DataManager:", error);
			return [];
		}
	}

	private loadEnvironmentData() {
		try {
			const builtIn = ENVIRONMENTS.map((e: any) => ({
				...e,
				isCustom: false,
				source: e.source ?? "core",
				type: e.type,
			}));

			const custom = this.loadCustomEnvironments();
			this.environments = [...builtIn, ...custom];

			// Initialize search engine
			this.searchEngine.setItems(this.environments);

			// Update filter UI with available options
			if (this.searchControlsUI) {
				const sources = this.searchEngine.getAvailableOptions("source");
				const types = this.searchEngine.getAvailableOptions("type");
				this.searchControlsUI.updateAvailableOptions("sources", sources);
				this.searchControlsUI.updateAvailableOptions("types", types);
			}

			// Render initial results
			this.renderResults(this.environments);
		} catch (e) {
			console.error("Error loading environment data:", e);
			new Notice("Failed to load environment data.");
			if (this.resultsDiv) {
				this.resultsDiv.setText("Error loading environment data.");
			}
		}
	}

	private handleSearchChange(query: string) {
		this.searchEngine.setFilters({ query });
		this.renderResults(this.searchEngine.search());
	}

	private handleTierChange(tier: number | null) {
		this.searchEngine.setFilters({ tier });
		this.renderResults(this.searchEngine.search());
	}

	private handleSourceChange(source: string | null) {
		this.searchEngine.setFilters({ source });
		this.renderResults(this.searchEngine.search());
	}

	private handleTypeChange(type: string | null) {
		this.searchEngine.setFilters({ type });
		this.renderResults(this.searchEngine.search());
	}

	private handleClearFilters() {
		// No specific action needed for environment clear,
		// filters are already reset by SearchControlsUI
	}

	private renderResults(filtered: any[]) {
		if (!this.resultsDiv) return;
		this.resultsDiv.empty();
		if (filtered.length === 0) {
			this.resultsDiv.setText("No environments found.");
			return;
		}
		filtered.forEach((env) => {
			const card = this.createEnvironmentCard(env);
			this.resultsDiv!.appendChild(card);
		});
	}

	async onOpen() {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView)
					this.lastActiveMarkdown = view;
			})
		);

		this.initializeView();
		this.loadEnvironmentData();
	}

	createEnvironmentCard(env: any): HTMLElement {
		const card = document.createElement("div");
		card.classList.add("df-env-card");

		const source = env.source || "core";
		card.classList.add(`df-source-${source.toLowerCase()}`);

		const tier = document.createElement("p");
		tier.classList.add("df-tier-text");
		tier.textContent = `Tier ${env.tier} ${env.type}`;

		const sourceBadge = document.createElement("span");
		sourceBadge.classList.add(
			`df-source-badge-${source.toLowerCase()}`,
		);

		const badgeTexts: Record<string, string> = {
			core: "Core",
			custom: "Custom",
			incredible: "Incredible",
			umbra: "Umbra",
			void: "Void",
		};

		if (badgeTexts[source] == "Custom") {
			const deleteBtn = document.createElement("button");
			deleteBtn.classList.add("df-env-delete-btn");
			setIcon(deleteBtn, "trash");
			deleteBtn.addEventListener("click", (e: MouseEvent) => {
				e.stopPropagation();
				this.deleteCustomEnvironment(env);
			});
			card.appendChild(deleteBtn);
		}

		sourceBadge.textContent = badgeTexts[source] || source;
		tier.appendChild(sourceBadge);

		card.appendChild(tier);

		const title = document.createElement("h3");
		title.classList.add("df-title-small-padding");
		title.textContent = env.name || "Unnamed Environment";
		card.appendChild(title);

		const desc = document.createElement("p");
		desc.classList.add("df-desc-small-padding");
		desc.textContent = env.desc || "No description available.";
		card.appendChild(desc);

		card.addEventListener("click", () => {
			const featuresHTML = (env.features || [])
				.map((f: any) => {
					const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

					const bulletsHTML =
						Array.isArray(f.bullets) && f.bullets.length
							? `<ul class="df-env-bullet">${f.bullets
									.map(
										(b: string) =>
											`<li class="df-env-bullet-item">${b}</li>`,
									)
									.join("")}</ul>`
							: "";

					const questionsHTML =
						f.questions && f.questions.length
							? `<div class="df-env-questions">${f.questions.map((q: string) => `<div class="df-env-question">${q}</div>`).join("")}</div>`
							: "";

					const afterTextHTML = f.textAfter
						? `<div id="textafter" class="df-env-feat-text">${f.textAfter}</div>`
						: "";

					return `<div class="df-feature" data-feature-name="${f.name}" data-feature-type="${f.type}" data-feature-cost="${f.cost || ''}">
<div class="df-env-feat-name-type">
<span class="df-env-feat-name">${f.name}</span> - <span class="df-env-feat-type">${f.type}:</span> ${costHTML}
<div class="df-env-feat-text">${f.text}</div>
</div>${bulletsHTML}${afterTextHTML}${questionsHTML}</div>`;
				})
				.join("");

			const envHTML = `<section class="df-env-card-outer">
<div class="df-env-card-inner">
<button class="df-env-edit-button" data-edit-mode-only="true">📝</button>
<div class="df-env-name">${env.name}</div>
<div class="df-env-feat-tier-type">Tier ${env.tier} ${env.type}</div>
<p class="df-env-desc">${env.desc}</p>
<p><strong>Impulse:</strong> ${env.impulse || ""}</p>
<div class="df-env-card-diff-pot">
<p><span class="df-bold-title">Difficulty</span>: ${env.difficulty || ""}</p>
<p><span class="df-bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ""}</p>
</div>
<div class="df-features-section">
<h3>Features</h3>
${featuresHTML}
</div>
</div>
</section>`.trim();

			const isCanvas = isCanvasActive(this.app);
			const isMarkdown = isMarkdownActive(this.app);

			if (isCanvas) {
				const position = getAvailableCanvasPosition(this.app);
				const success = createCanvasCard(this.app, envHTML, {
					x: position.x,
					y: position.y,
					width: 400,
					height: 650
				});
				if (success) {
					new Notice(`Inserted environment ${env.name}.`);
				} else {
					new Notice("Failed to insert environment into canvas.");
				}
				return;
			} else if (isMarkdown) {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView) ||
					this.lastActiveMarkdown;
				if (!view) {
					new Notice("No markdown file or canvas is open.");
					return;
				}
				const editor = view.editor;
				if (!editor) {
					new Notice("Cannot find editor in markdown view.");
					return;
				}
				editor.replaceSelection(envHTML);
				new Notice(`Inserted environment ${env.name}.`);
			} else {
				new Notice("No active editor or canvas");
			}
		});

		return card;
	}
}
