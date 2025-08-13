import { ItemView, WorkspaceLeaf, MarkdownView, Notice, TFile } from "obsidian";
import { ENVIRONMENTS } from "../data/environments";
import { EnvironmentData } from "./environmentTypes";

export const ENVIRONMENT_VIEW_TYPE = "environment-view";

export async function buildCustomEnvironment(
	app: any,
	values: any,
	features: any[],
) {
	const customEnvironment: EnvironmentData = {
		name: values.name || "",
		tier: Number(values.tier) || 1,
		type: values.type || "",
		desc: values.desc || "",
		impulse: values.impulse || "",
		difficulty: values.difficulty || "",
		potentialAdversaries: values.potentialAdversaries || "",
		source: "custom", // Always set to custom for user-created
		features: features.map((f) => ({
			name: f.name || "",
			type: f.type || "",
			cost: f.cost || "",
			text: f.text || "",
			bullets: f.bullets || [],
			questions: f.questions || [],
		})),
	};

	try {
		// Define the filename and path
		const filename = "custom@Environments.md";
		const vault = app.vault;

		// Check if file exists, create if it doesn't
		let file = vault.getAbstractFileByPath(filename) as TFile;
		if (!file) {
			file = await vault.create(filename, "## Custom Environments\n\n");
			new Notice(`Created new custom environments file: ${filename}`);
		}

		// Read current content
		let content = await vault.read(file);

		// Prepare the new environment entry
		const environmentHeader = `\n\n### ${customEnvironment.name}\n`;
		const environmentContent =
			"```json\n" +
			JSON.stringify(customEnvironment, null, 2) +
			"\n```\n";

		// Append the new environment to the file
		await vault.modify(
			file,
			content + environmentHeader + environmentContent,
		);

		new Notice(
			`Custom environment "${customEnvironment.name}" added to ${filename}`,
		);
		return customEnvironment;
	} catch (error) {
		console.error("Error saving custom environment:", error);
		new Notice(
			"Failed to save custom environment. Check console for details.",
		);
		return null;
	}
}

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
		return "Environment Cards";
	}

	getIcon(): string {
		return "mountain";
	}

	public async refresh() {
		if (!this.resultsDiv) return;
		await this.loadEnvironmentData(); // will also re-render
	}

	private createTierButtons(container: HTMLElement, input: HTMLInputElement) {
		const buttonContainer = document.createElement("span");
		buttonContainer.className = "tier-buttons";
		const tiers = ["ALL", "1", "2", "3", "4"];

		tiers.forEach((tierLabel) => {
			const button = document.createElement("button");
			button.textContent =
				tierLabel === "ALL" ? "ALL" : `Tier ${tierLabel}`;
			button.classList.add("tier-filter-btn");
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

	private async loadCustomEnvironments(): Promise<EnvironmentData[]> {
		const CUSTOM_FILE = "custom@Environments.md";
		try {
			const vault = this.app.vault;
			const file = vault.getAbstractFileByPath(CUSTOM_FILE) as TFile;

			if (!file) return [];

			const content = await vault.read(file);
			const customEnvironments: EnvironmentData[] = [];

			const jsonBlocks = content.match(/```json\n([\s\S]*?)\n```/g);

			if (jsonBlocks) {
				jsonBlocks.forEach((block) => {
					try {
						const jsonContent = block.replace(
							/```json\n|\n```/g,
							"",
						);
						const environment = JSON.parse(
							jsonContent,
						) as EnvironmentData;
						environment.source = "custom"; // Ensure source is set
						customEnvironments.push(environment);
					} catch (e) {
						console.error("Error parsing custom environment:", e);
					}
				});
			}

			return customEnvironments;
		} catch (error) {
			console.error("Error loading custom environments:", error);
			return [];
		}
	}

	private async loadEnvironmentData() {
		if (!this.resultsDiv) return;

		try {
			const scrollTop = this.resultsDiv.scrollTop;

			const builtInEnvironments = [
				...ENVIRONMENTS.tier1,
				...ENVIRONMENTS.tier2,
				...ENVIRONMENTS.tier3,
				...ENVIRONMENTS.tier4,
			].map((e) => ({ ...e, source: e.source || "core" }));

			const customEnvironments = await this.loadCustomEnvironments();
			this.environments = [...builtInEnvironments, ...customEnvironments];

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
			text: "Environment Cards",
			cls: "env-title",
		});

		const input = container.createEl("input", {
			attr: { type: "text", placeholder: "Search environments..." },
			cls: "env-search-box",
		}) as HTMLInputElement;
		this.searchInput = input;

		const resultsDiv = container.createEl("div", {
			cls: "env-results",
			text: "Results will appear here.",
		});
		this.resultsDiv = resultsDiv;

		this.createTierButtons(container, input);

		try {
			this.environments = [
				...ENVIRONMENTS.tier1,
				...ENVIRONMENTS.tier2,
				...ENVIRONMENTS.tier3,
				...ENVIRONMENTS.tier4,
			];
			await this.loadEnvironmentData(); // loads custom + renders
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
		card.classList.add("env-card");

		// Add source-specific class
		const source = env.source || "core"; // Default to 'core' if not specified
		card.classList.add(`source-${source.toLowerCase()}`);

		// Tier and type
		const tier = document.createElement("p");
		tier.classList.add("tier-text");
		tier.textContent = `Tier ${env.tier} ${env.type}`;

		// Add source badge
		const sourceBadge = document.createElement("span");
		sourceBadge.classList.add(
			`source-badge-${source.toLowerCase()}`,
			`source-${source.toLowerCase()}`,
		);

		// Customize badge text based on source
		const badgeTexts: Record<string, string> = {
			core: "Core",
			custom: "Custom",
			umbra: "Umbra",
			// Add more sources as needed
		};
		sourceBadge.textContent = badgeTexts[source] || source;
		tier.appendChild(sourceBadge);

		card.appendChild(tier);

		// Name
		const title = document.createElement("h3");
		title.classList.add("title-small-padding");
		title.textContent = env.name || "Unnamed Environment";
		card.appendChild(title);

		// Description
		const desc = document.createElement("p");
		desc.classList.add("desc-small-padding");
		desc.textContent = env.desc || "No description available.";
		card.appendChild(desc);

		card.addEventListener("click", () => {
			const view =
				this.app.workspace.getActiveViewOfType(MarkdownView) ||
				this.lastActiveMarkdown;
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
			const featuresHTML = (env.features || [])
				.map((f: any) => {
					const costHTML = f.cost ? `<span>${f.cost}</span>` : "";

					const bulletsHTML =
						Array.isArray(f.bullets) && f.bullets.length
							? f.bullets
									.map(
										(b: string) =>
											`<div class="env-bullet">${b}</div>`,
									)
									.join("")
							: "";

					const questionsHTML =
						f.questions && f.questions.length
							? `<div class="env-questions">${f.questions.map((q: string) => `${q}`).join("")}</div>`
							: "";

					return `
				<div class="feature">
					<div class="env-feat-name-type">${f.name} - ${f.type}: ${costHTML}
						<span class="env-feat-text"> ${f.text}</span>
					</div>
					
					${bulletsHTML}
					${questionsHTML}
				</div>
			`;
				})
				.join("");
			// Compose the full HTML block
			const envHTML = `
<div class="env-card-outer">
			<div class="env-card-inner">
				<div class="env-name">${env.name}</div>
				<div class="env-feat-tier-type">Tier ${env.tier} ${env.type}</div>
				<p class="env-desc">${env.desc}</p>
				<p><strong>Impulse:</strong> ${env.impulse || ""}</p>
				<div class="env-card-diff-pot">
				<p><span class="bold-title">Difficulty</span>: ${env.difficulty || ""}</p>
				<p><span class="bold-title">Potential Adversaries</span>: ${env.potentialAdversaries || ""}</p>
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
