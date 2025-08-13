import { ItemView, WorkspaceLeaf, Notice, MarkdownView, TFile } from "obsidian";
import { ADVERSARIES } from "../data/adversaries";
import {
	getAdversaryCount,
	incrementAdversaryCount,
	decrementAdversaryCount,
} from "@/utils/adversaryCounter";

export const ADVERSARY_VIEW_TYPE = "adversary-view";

interface AdversaryFeature {
	name: string;
	type: string;
	cost?: string;
	desc: string;
}

interface Adversary {
	name: string;
	type: string;
	tier: number;
	desc: string;
	motives: string;
	difficulty: string;
	thresholds: string;
	hp: string;
	stress?: string;
	atk: string;
	weaponName: string;
	weaponRange: string;
	weaponDamage: string;
	xp: string;
	features: AdversaryFeature[];
	source?: string; // New field for source/version
	isCustom?: boolean;
}

export class AdversaryView extends ItemView {
	private adversaries: Adversary[] = [];
	private lastActiveMarkdown: MarkdownView | null = null;

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

	async onOpen() {
		this.initializeView();
		this.registerEventListeners();
		this.loadAdversaryData();
	}

	public async refresh() {
		const container = this.containerEl.children[1];
		container.empty();
		this.initializeView();
		await this.loadAdversaryData();
	}

	private initializeView() {
		const container = this.containerEl.children[1];
		container.empty();
		// Create title
		container.createEl("h2", {
			text: "Adversary Creator",
			cls: "adv-title",
		});
		// Create controls row
		const controlsRow = container.createDiv({
			cls: "adversary-controls-row",
		});
		// Add counter controls
		this.createCounterControls(controlsRow);
		// Add search input
		this.createSearchInput(controlsRow);
		// Add tier dropdown
		this.createTierDropdown(controlsRow);
	}

	private registerEventListeners() {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView) {
					this.lastActiveMarkdown = view;
				}
			}),
		);
	}

	private async loadCustomAdversaries(): Promise<Adversary[]> {
		const CUSTOM_FILE = "custom@Adversaries.md";
		try {
			const vault = this.app.vault;
			const file = vault.getAbstractFileByPath(CUSTOM_FILE) as TFile;

			if (!file) {
				return []; // File doesn't exist yet
			}

			const content = await vault.read(file);
			const customAdversaries: Adversary[] = [];

			// Parse the markdown file for JSON blocks
			const jsonBlocks = content.match(/```json\n([\s\S]*?)\n```/g);

			if (jsonBlocks) {
				jsonBlocks.forEach((block) => {
					try {
						const jsonContent = block.replace(
							/```json\n|\n```/g,
							"",
						);
						const adversary = JSON.parse(jsonContent) as Adversary;

						// Convert tier to number if it's a string
						if (typeof adversary.tier === "string") {
							adversary.tier = parseInt(adversary.tier, 10);
						}

						// Mark as custom
						adversary.isCustom = true;
						customAdversaries.push(adversary);
					} catch (e) {
						console.error("Error parsing custom adversary:", e);
					}
				});
			}

			return customAdversaries;
		} catch (error) {
			console.error("Error loading custom adversaries:", error);
			return [];
		}
	}

	private async loadAdversaryData() {
		const container = this.containerEl.children[1];
		const resultsDiv = container.createEl("div", {
			cls: "adversary-results",
			text: "Loading adversaries...",
		});

		try {
			// Load built-in adversaries with source="core"
			const builtInAdversaries = [
				...ADVERSARIES.tier1,
				...ADVERSARIES.tier2,
				...ADVERSARIES.tier3,
				...ADVERSARIES.tier4,
			].map((a) => ({
				...a,
				tier:
					typeof a.tier === "string" ? parseInt(a.tier, 10) : a.tier,
				isCustom: false,
				source: a.source || "core", // Default to core if not specified
			}));

			// Load expansion adversaries (example for umbra) //UMBRA
			// const umbraAdversaries = [
			//     ...UMBRA_ADVERSARIES.tier1,
			//     ...UMBRA_ADVERSARIES.tier2,
			//     // ... etc ...
			// ].map(a => ({
			//     ...a,
			//     tier: typeof a.tier === "string" ? parseInt(a.tier, 10) : a.tier,
			//     isCustom: false,
			//     source: "umbra" // Explicitly set
			// }));

			// Load custom adversaries with source="custom"
			const customAdversaries = (await this.loadCustomAdversaries()).map(
				(a) => ({
					...a,
					source: "custom", // Always custom
				}),
			);

			// Combine all lists
			this.adversaries = [
				...builtInAdversaries,
				// ...umbraAdversaries, //UMBRA
				...customAdversaries,
			];

			this.renderResults(this.adversaries);
		} catch (e) {
			new Notice("Failed to load adversary data.");
			resultsDiv.setText("Error loading adversary data.");
		}
	}

	private createCounterControls(container: HTMLElement): HTMLElement {
		const counterContainer = container.createDiv({
			cls: "adversary-counter-container",
		});

		const minusBtn = counterContainer.createEl("button", {
			text: "-",
			cls: "adversary-counter-btn",
		});

		const counterDisplay = counterContainer.createEl("span", {
			text: getAdversaryCount().toString(),
			cls: "adversary-counter-display",
		});

		const plusBtn = counterContainer.createEl("button", {
			text: "+",
			cls: "adversary-counter-btn",
		});

		minusBtn.onclick = () => {
			decrementAdversaryCount();
			counterDisplay.textContent = getAdversaryCount().toString();
		};

		plusBtn.onclick = () => {
			incrementAdversaryCount();
			counterDisplay.textContent = getAdversaryCount().toString();
		};

		return counterContainer;
	}

	private createSearchInput(container: HTMLElement): HTMLInputElement {
		const input = container.createEl("input", {
			attr: {
				type: "text",
				placeholder: "Search adversaries...",
			},
			cls: "adversary-search-box",
		});

		input.addEventListener("input", () => {
			const query = input.value.toLowerCase();
			const filtered = this.adversaries.filter(
				(a) =>
					a.name.toLowerCase().includes(query) ||
					a.type.toLowerCase().includes(query) ||
					a.source?.toLowerCase().includes(query),
			);
			this.renderResults(filtered);
		});

		return input;
	}

	private createTierDropdown(container: HTMLElement): HTMLSelectElement {
		const dropdown = container.createEl("select", {
			cls: "tier-dropdown",
		});

		const defaultOption = document.createElement("option");
		defaultOption.value = "ALL";
		defaultOption.textContent = "All Tiers";
		defaultOption.selected = true;
		defaultOption.classList.add("tier-option"); // custom class
		dropdown.appendChild(defaultOption);

		["1", "2", "3", "4"].forEach((tier) => {
			const option = document.createElement("option");
			option.value = tier;
			option.textContent = `Tier ${tier}`;
			option.classList.add("tier-option"); // custom class
			dropdown.appendChild(option);
		});

		dropdown.addEventListener("change", (e) => {
			const selectedTier = (e.target as HTMLSelectElement).value;
			const filtered =
				selectedTier === "ALL"
					? this.adversaries
					: this.adversaries.filter(
							(a) => a.tier.toString() === selectedTier,
						);

			this.renderResults(filtered);
		});

		return dropdown;
	}

	private renderResults(adversaries: Adversary[]) {
		const container = this.containerEl.children[1];
		let resultsDiv = container.querySelector(
			".adversary-results",
		) as HTMLElement;

		if (!resultsDiv) {
			resultsDiv = container.createEl("div", {
				cls: "adversary-results",
			});
		} else {
			resultsDiv.empty();
		}

		if (adversaries.length === 0) {
			resultsDiv.setText("No adversaries found.");
			return;
		}

		adversaries.forEach((adversary) => {
			const card = this.createAdversaryCard(adversary);
			resultsDiv.appendChild(card);
		});
	}

	private createAdversaryCard(adversary: Adversary): HTMLElement {
		const card = document.createElement("div");
		card.classList.add("adversary-card");

		// Add source-specific class to card
		const source = adversary.source || "core"; // Default to 'core' if not specified
		card.classList.add(`source-${source.toLowerCase()}`);

		// Tier and type
		const tier = document.createElement("p");
		tier.classList.add("tier-text");
		tier.textContent = `Tier ${adversary.tier} ${adversary.type}`;

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
		title.textContent = adversary.name || "Unnamed Adversary";
		card.appendChild(title);

		// Description
		const desc = document.createElement("p");
		desc.classList.add("desc-small-padding");
		desc.textContent = adversary.desc || "No description available.";
		card.appendChild(desc);

		// Click handler
		card.addEventListener("click", () =>
			this.insertAdversaryIntoNote(adversary),
		);

		return card;
	}

	private insertAdversaryIntoNote(adversary: Adversary) {
		const view =
			this.app.workspace.getActiveViewOfType(MarkdownView) ||
			this.lastActiveMarkdown;

		if (!view) {
			new Notice("No note is open. Click on a note to activate it.");
			return;
		}

		if (view.getMode() !== "source") {
			new Notice(
				"You must be in edit mode to insert the adversary card.",
			);
			return;
		}

		const editor = view.editor;
		if (!editor) {
			new Notice("Cannot find editor in markdown view.");
			return;
		}

		const adversaryText = this.generateAdversaryMarkdown(adversary);
		editor.replaceSelection(adversaryText);
		new Notice(`Inserted ${adversary.name} into the note.`);
	}

	private generateAdversaryMarkdown(adversary: Adversary): string {
		const currentCount = getAdversaryCount();
		const featuresHTML = this.generateFeaturesHTML(adversary.features);
		const multipleTickboxes = this.generateMultipleTickboxes(
			adversary,
			currentCount,
		);

		return `
<section class="card-outer pseudo-cut-corners outer">
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
            Stress: <span class="stat">${adversary.stress || ""}</span>
            <div>ATK: <span class="stat">${adversary.atk} |</span>
            ${adversary.weaponName}: <span class="stat">${adversary.weaponRange} | ${adversary.weaponDamage}</span></div>
            <div class="experience-line">Experience: <span class="stat">${adversary.xp}</span></div>
        </div>
        <div class="section">FEATURES</div>
        ${featuresHTML}
    </div>
</section>
`;
	}

	private generateFeaturesHTML(features: AdversaryFeature[]): string {
		return features
			.map(
				(feature) => `
            <div class="feature">
                <span class="feature-title">
                    ${feature.name} - ${feature.type}${feature.cost ? `: ${feature.cost}` : ":"}
                </span>
                <span class="feature-desc">${feature.desc}</span>
            </div>`,
			)
			.join("");
	}

	private generateMultipleTickboxes(
		adversary: Adversary,
		count: number,
	): string {
		return Array.from(
			{ length: count },
			(_, index) => `
            <div class="hp-tickboxes">
                <span class="hp-stress">HP</span>${this.generateTickboxes(adversary.hp, "hp-tick")}
                <span class="adversary-count">${index + 1}</span>
            </div>
            <div class="stress-tickboxes">
                <span class="hp-stress">Stress</span>${this.generateTickboxes(String(adversary.stress ?? 0), "stress-tick")}
            </div>
        `,
		).join("");
	}

	private generateTickboxes(count: string, prefix: string): string {
		const numCount = Number(count);
		return Array.from(
			{ length: numCount },
			(_, i) =>
				`<input type="checkbox" id="${prefix}-${i}" class="${prefix}box" />`,
		).join("");
	}
}
