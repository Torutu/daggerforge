import { ItemView, WorkspaceLeaf, MarkdownView, Notice, setIcon } from "obsidian";
import { ENVIRONMENTS } from "../../../data/environments";
import { EnvironmentData } from "../../../types/environment";
import { isMarkdownActive, isCanvasActive, createCanvasCard, getAvailableCanvasPosition } from "../../../utils/canvasHelpers";

export const ENVIRONMENT_VIEW_TYPE = "environment-view";

export class EnvironmentView extends ItemView {
	private environments: any[] = [];
	private lastActiveMarkdown: MarkdownView | null = null;
	private resultsDiv: HTMLElement | null = null;
	private searchInput: HTMLInputElement | null = null;

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
		if (!this.resultsDiv) return;
		this.loadEnvironmentData(); // will also re-render
	}

	private async deleteCustomEnvironment(env: EnvironmentData): Promise<void> {
	try {
		const plugin = (this.app as any).plugins.plugins['daggerforge'] as any;
		if (!plugin || !plugin.dataManager) {
			new Notice("DaggerForge plugin not found.");
			return;
		}

		// Find the index of the environment in custom environments
		const customEnvs = plugin.dataManager.getEnvironments();
		const index = customEnvs.findIndex((e: EnvironmentData) => e.name === env.name);

		if (index !== -1) {
			await plugin.dataManager.deleteEnvironment(index);
			new Notice(`Deleted environment: ${env.name}`);
			this.refresh(); // Refresh the view
		} else {
			new Notice("Environment not found in custom list.");
		}
	} catch (error) {
		console.error("Error deleting custom environment:", error);
		new Notice("Failed to delete environment.");
	}
}

	private createTierButtons(container: HTMLElement, input: HTMLInputElement) {
		const buttonContainer = document.createElement("span");
		buttonContainer.className = "tier-buttons";
		const tiers = ["ALL", "1", "2", "3", "4"];

		tiers.forEach((tierLabel) => {
			const button = document.createElement("button");
			button.textContent =
				tierLabel === "ALL" ? "ALL" : `Tier ${tierLabel}`;
			button.classList.add("df-tier-filter-btn");
			button.addEventListener("click", () => {
				input.value = "";
				const filtered =
					tierLabel === "ALL"
						? this.environments
						: this.environments.filter(
								(e) => e.tier.toString() === tierLabel,
							);
				this.renderResults(filtered);
			});
			buttonContainer.appendChild(button);
		});

		if (this.resultsDiv)
			container.insertBefore(buttonContainer, this.resultsDiv);
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

	private loadCustomEnvironments(): EnvironmentData[] {
		try {
			// Get plugin instance to access dataManager (exactly like Adversary)
			const plugin = (this.app as any).plugins.plugins['daggerforge'];
			if (!plugin || !plugin.dataManager) {
				console.warn("DaggerForge plugin or dataManager not found");
				return [];
			}

			// Load custom environments from DataManager (Obsidian storage)
			const customEnvs = plugin.dataManager.getEnvironments();

			// Convert to display format and mark as custom
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
		if (!this.resultsDiv) return;

		try {
			const scrollTop = this.resultsDiv.scrollTop;

			const builtInEnvironments = [
				...ENVIRONMENTS.coreEnv,
			].map((e) => ({ ...e, source: e.source || "core" }));

			const custom_Environments = this.loadCustomEnvironments();
			this.environments = [...builtInEnvironments, ...custom_Environments];

			const q = (this.searchInput?.value || "").toLowerCase();
			const filtered = q
				? this.environments.filter(
						(env) =>
							env.name.toLowerCase().includes(q) ||
							env.type.toLowerCase().includes(q),
					)
				: this.environments;

			this.renderResults(filtered);
			this.resultsDiv.scrollTop = scrollTop;
		} catch (e) {
			new Notice("Failed to refresh environment data.");
			console.error(e);
		}
	}

	private setupSearchInput(input: HTMLInputElement) {
		input.addEventListener("input", () => {
			const q = input.value.toLowerCase();
			const filtered = this.environments.filter(
				(env) =>
					env.name.toLowerCase().includes(q) ||
					env.type.toLowerCase().includes(q) ||
					env.source.toLowerCase().includes(q),
			);
			this.renderResults(filtered);
		});
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView)
					this.lastActiveMarkdown = view;
			}),
		);

		container.createEl("h2", {
			text: "Environment Browser",
			cls: "df-env-title",
		});

		const input = container.createEl("input", {
			attr: { type: "text", placeholder: "Search environments..." },
			cls: "df-env-search-box",
		}) as HTMLInputElement;
		this.searchInput = input;

		const resultsDiv = container.createEl("div", {
			cls: "df-env-results",
			text: "Results will appear here.",
		});
		this.resultsDiv = resultsDiv;

		this.createTierButtons(container, input);

		try {
			this.environments = [
				...ENVIRONMENTS.coreEnv,
			];
			this.loadEnvironmentData(); // loads custom + renders
		} catch (e) {
			new Notice("Failed to load environment data.");
			resultsDiv.setText("Error loading environment data.");
			return;
		}

		this.renderResults(this.environments);
		this.setupSearchInput(input);
	}

	createEnvironmentCard(env: any): HTMLElement {
		const card = document.createElement("div");
		card.classList.add("df-env-card");

		// Add source-specific class
		const source = env.source || "core";
		card.classList.add(`df-source-${source.toLowerCase()}`);

		// Tier and type
		const tier = document.createElement("p");
		tier.classList.add("df-tier-text");
		tier.textContent = `Tier ${env.tier} ${env.type}`;

		// Add source badge
		const sourceBadge = document.createElement("span");
		sourceBadge.classList.add(
			`df-source-badge-${source.toLowerCase()}`,
		);

		// Customize badge text based on source
		const badgeTexts: Record<string, string> = {
			core: "Core",
			custom: "Custom",
			incredible: "Incredible"
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

		// Name
		const title = document.createElement("h3");
		title.classList.add("df-title-small-padding");
		title.textContent = env.name || "Unnamed Environment";
		card.appendChild(title);

		// Description
		const desc = document.createElement("p");
		desc.classList.add("df-desc-small-padding");
		desc.textContent = env.desc || "No description available.";
		card.appendChild(desc);

		card.addEventListener("click", () => {
			// Format features as HTML blocks
			const featuresHTML = (env.features || [])
				.map((f: any) => {
					const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

					const bulletsHTML =
						Array.isArray(f.bullets) && f.bullets.length
							? f.bullets
									.map(
										(b: string) =>
											`<div class="df-env-bullet">${b}</div>`,
									)
									.join("")
							: "";

					const questionsHTML =
						f.questions && f.questions.length
							? `<div class="df-env-questions">${f.questions.map((q: string) => `${q}`).join("")}</div>`
							: "";

					return `
				<div class="df-feature">
					<div class="df-env-feat-name-type">${f.name} - ${f.type}: ${costHTML}
						<span class="df-env-feat-text"> ${f.text}</span>
					</div>
					
					${bulletsHTML}
					${questionsHTML}
				</div>
			`;
				})
				.join("");
			// Compose the full HTML block
			const envHTML = `
<div class="df-env-card-outer">
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
</div>
`;
			const isCanvas = isCanvasActive(this.app);
			const isMarkdown = isMarkdownActive(this.app);
			// Check if we're on a canvas
			if (isCanvas)  {
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
			// Otherwise, insert into markdown note
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
