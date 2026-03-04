import { ItemView, WorkspaceLeaf, MarkdownView, Notice, setIcon } from "obsidian";
import { ENVIRONMENTS } from "../../../data/index";
import { EnvironmentData } from "../../../types/index";
import {
	resolveInsertDestination,
	createCanvasCard,
	getAvailableCanvasPosition,
	SearchEngine,
	SearchControlsUI,
	generateEnvUniqueId
} from "../../../utils/index";
import { envToHtml } from "../EnvToHtml";

export const Env_View_Type = "daggerforge:environment-view";

interface Environment extends EnvironmentData {
}

export class EnvironmentView extends ItemView {
	private environments: Environment[] = [];
	private lastActiveMarkdown: MarkdownView | null = null;
	private searchEngine: SearchEngine<Environment> = new SearchEngine<Environment>();
	private searchControlsUI: SearchControlsUI | null = null;
	private resultsDiv: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return Env_View_Type;
	}

	getDisplayText(): string {
		return "Environment Browser";
	}

	getIcon(): string {
		return "mountain";
	}

	public refresh() {
		const currentFilters = this.searchEngine.getFilters();
		this.loadEnvironmentData();

		const availableSources = this.searchEngine.getAvailableOptions("sources");
		const availableTiers = this.searchEngine.getAvailableOptions("tiers");
		const availableTypes = this.searchEngine.getAvailableOptions("types");

		currentFilters.tiers = currentFilters.tiers.filter(t => availableTiers.includes(t));
		currentFilters.sources = currentFilters.sources.filter(s => availableSources.includes(s));
		currentFilters.types = currentFilters.types.filter(tp => availableTypes.includes(tp));

		this.searchEngine.setFilters(currentFilters);

		if (this.searchControlsUI) {
			this.searchControlsUI.setFilterValues(currentFilters);
		}

		this.renderResults(this.searchEngine.search());
	}

	private initializeView() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		container.createEl("h2", {
			text: "Environment Browser",
			cls: "df-env-title",
		});

		// Create search controls placeholder - will be rebuilt after data loads
		container.createDiv({ cls: "df-search-controls-container" });

		this.resultsDiv = container.createEl("div", {
			cls: "df-environment-results",
		});
	}

	/**
	 * Delete a custom environment by its unique ID
	 * @param env The environment object to delete
	 */
	private async deleteCustomEnvironment(env: EnvironmentData): Promise<void> {
		try {
			const plugin = (this.app as any).plugins.plugins['daggerforge'] as any;
			if (!plugin || !plugin.dataManager) {
				new Notice("DaggerForge plugin not found.");
				return;
			}

			const envId = env.id;

			if (!envId) {
				new Notice("Cannot delete environment: missing ID.");
				return;
			}

			await plugin.dataManager.deleteEnvironmentById(envId);
			new Notice(`Deleted environment: ${env.name}`);
			this.refresh();
		} catch (error) {
			console.error("Error deleting custom environment:", error);
			new Notice("Failed to delete environment.");
		}
	}

	private loadCustomEnvironments(): Environment[] {
		try {
			const plugin = (this.app as any).plugins.plugins['daggerforge'];
			if (!plugin || !plugin.dataManager) {
				console.warn("DaggerForge plugin or dataManager not found");
				return [];
			}

			const customEnvs = plugin.dataManager.getEnvironments();

			return customEnvs.map((env: any) => ({
				...env,
				id: env.id || generateEnvUniqueId(),
				tier: typeof env.tier === "number" ? env.tier : parseInt(env.tier, 10),
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
				id: e.id || generateEnvUniqueId(),
				source: e.source ?? "core",
				type: e.type,
			}));

			const custom = this.loadCustomEnvironments();
			this.environments = [...builtIn, ...custom];

			this.searchEngine.setCards(this.environments);

			// Rebuild search controls with actual data
			const searchContainer = this.containerEl.querySelector(".df-search-controls-container") as HTMLElement;
			if (searchContainer) {
				searchContainer.empty();
				this.searchControlsUI = new SearchControlsUI({
					placeholderText: "Search by name, type, or description...",
					availableTiers: this.searchEngine.getAvailableOptions("tiers"),
					availableSources: this.searchEngine.getAvailableOptions("sources"),
					availableTypes: this.searchEngine.getAvailableOptions("types"),
					onSearchChange: (query) => this.handleSearchChange(query),
					onTierChange: (tiers) => this.handleTierChange(tiers),
					onSourceChange: (sources) => this.handleSourceChange(sources),
					onTypeChange: (types) => this.handleTypeChange(types),
					onClear: () => this.handleClearFilters(),
				});
				this.searchControlsUI.create(searchContainer);
			}

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

	private handleTierChange(tiers: string[]) {
		this.searchEngine.setFilters({ tiers });
		this.renderResults(this.searchEngine.search());
	}

	private handleSourceChange(sources: string[]) {
		this.searchEngine.setFilters({ sources });
		this.renderResults(this.searchEngine.search());
	}

	private handleTypeChange(types: string[]) {
		this.searchEngine.setFilters({ types });
		this.renderResults(this.searchEngine.search());
	}

	private handleClearFilters() {
		this.searchEngine.clearFilters();
		this.renderResults(this.searchEngine.search());
	}

	private renderResults(filtered: Environment[]) {
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
				if (!leaf) return;
				const view = leaf.view;
				if (view instanceof MarkdownView) {
					this.lastActiveMarkdown = view;
				}
			})
		);

		this.initializeView();
		this.loadEnvironmentData();
	}

	createEnvironmentCard(env: Environment): HTMLElement {
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
			sablewood: "Sablewood",
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
			const wide = this.searchControlsUI?.getWideCard() ?? false;
			const envHTML = envToHtml(env, wide);
			const plugin = (this.app as any).plugins?.plugins?.['daggerforge'];
			const { kind, canvas } = resolveInsertDestination(this.app, plugin?.lastMainLeaf ?? null);

			if (kind === "canvas") {
				const position = getAvailableCanvasPosition(canvas);
				const success = createCanvasCard(this.app, envHTML, canvas, {
					x: position.x,
					y: position.y,
					width: 400,
					height: 650
				});
				if (success) {
					new Notice(`Inserted ${env.name}.`);
				} else {
					new Notice("Failed to insert environment into canvas.");
				}
				return;
			}

			if (kind === "markdown") {
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
				return;
			}

			new Notice("No active editor or canvas. Click on a note or canvas first.");
		});

		return card;
	}
}
