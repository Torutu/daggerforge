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
		this.loadEnvironmentData();
		if (this.searchInput instanceof HTMLElement) {
			this.searchInput.focus();
		}
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
			this.renderResults(this.environments);
		} catch (e) {
			console.error("Error loading environment data:", e);
			new Notice("Failed to load environment data.");
			this.resultsDiv?.setText("Error loading environment data.");
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
			})
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
			this.loadEnvironmentData();
		} catch (e) {
			new Notice("Failed to load environment data.");
			resultsDiv.setText("Error loading environment data.");
			return;
		}

		this.setupSearchInput(input);
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
			// Build features HTML with data attributes
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

					// ADD DATA ATTRIBUTES TO FEATURE DIV
					return `
				<div class="df-feature" data-feature-name="${f.name}" data-feature-type="${f.type}" data-feature-cost="${f.cost || ''}">
					<div class="df-env-feat-name-type">
						<span class="df-env-feat-name">${f.name}</span> - <span class="df-env-feat-type">${f.type}:</span> ${costHTML}
						<div class="df-env-feat-text">${f.text}</div>
					</div>
					${bulletsHTML}
					${afterTextHTML}
					${questionsHTML}
				</div>
			`;
				})
				.join("");

			const envHTML = `
<section class="df-env-card-outer">
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
</section>
`;

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
