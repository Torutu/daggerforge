import { ItemView, WorkspaceLeaf, Notice, MarkdownView } from "obsidian";
import { ADVERSARIES } from "../../../data/adversaries";
import {
	getAdversaryCount,
	incrementAdversaryCount,
	decrementAdversaryCount,
} from "../../../utils/adversaryCounter";

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
	thresholdMajor: string;
	thresholdSevere: string;
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

// Type for raw adversary data from JSON that may have either naming convention
type RawAdversaryData = {
	[K in keyof Adversary]: Adversary[K];
} | {
	Name: string;
	Type: string;
	Tier: string | number;
	Desc: string;
	Motives: string;
	Difficulty: string;
	Thresholds: string;
	HP: string;
	Stress?: string;
	ATK: string;
	WeaponName: string;
	WeaponRange: string;
	WeaponDamage: string;
	XP: string;
	Features: AdversaryFeature[];
	Source?: string;
};

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
		return "Adversary Browser";
	}

	getIcon(): string {
		return "venetian-mask";
	}

	private async deleteCustomAdversary(adversary: Adversary): Promise<void> {
	try {
		const plugin = (this.app as any).plugins?.plugins?.['daggerforge'] as any;
		if (!plugin || !plugin.dataManager) {
			new Notice("DaggerForge plugin not found.");
			return;
		}

		// Find the index of the adversary in custom adversaries
		const customAdvs = plugin.dataManager.getAdversaries();
		const index = customAdvs.findIndex((a: Adversary) => a.name === adversary.name);

		if (index !== -1) {
			await plugin.dataManager.deleteAdversary(index);
			new Notice(`Deleted adversary: ${adversary.name}`);
			this.refresh(); // Refresh the view
		} else {
			new Notice("Adversary not found in custom list.");
		}
	} catch (error) {
		console.error("Error deleting custom adversary:", error);
		new Notice("Failed to delete adversary.");
	}
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
		this.loadAdversaryData();
	}

	private initializeView() {
		const container = this.containerEl.children[1];
		container.empty();
		// Create title
		container.createEl("h2", {
			text: "Adversary Browser",
			cls: "df-adv-title",
		});
		// Create controls row
		const controlsRow = container.createDiv({
			cls: "df-adversary-controls-row",
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

	private normalizeAdversary(a: RawAdversaryData): Adversary {
		// Handle both lowercase and uppercase property names
		const raw = a as any; // Cast to any to access both property naming conventions
		return {
			name: raw.name || raw.Name || "",
			type: raw.type || raw.Type || "",
			tier: typeof (raw.tier || raw.Tier) === "string" 
				? parseInt(raw.tier || raw.Tier, 10) 
				: (raw.tier || raw.Tier || 1),
			desc: raw.desc || raw.Desc || "",
			motives: raw.motives || raw.Motives || "",
			difficulty: raw.difficulty || raw.Difficulty || "",
			thresholdMajor: raw.thresholdMajor || (raw.Thresholds ? raw.Thresholds.split('/')[0] : "") || "",
			thresholdSevere: raw.thresholdSevere || (raw.Thresholds ? raw.Thresholds.split('/')[1] : "") || "",
			hp: raw.hp || raw.HP || "",
			stress: raw.stress || raw.Stress,
			atk: raw.atk || raw.ATK || "",
			weaponName: raw.weaponName || raw.WeaponName || "",
			weaponRange: raw.weaponRange || raw.WeaponRange || "",
			weaponDamage: raw.weaponDamage || raw.WeaponDamage || "",
			xp: raw.xp || raw.XP || "",
			features: raw.features || raw.Features || [],
			source: raw.source || raw.Source || "core",
			isCustom: raw.isCustom || false,
		};
	}

	private loadCustomAdversaries(): Adversary[] {
		try {
			// Get plugin instance to access dataManager
			const plugin = (this.app as any).plugins?.plugins?.['daggerforge'] as any;
			if (!plugin || !plugin.dataManager) {
				console.warn("DaggerForge plugin or dataManager not found");
				return [];
			}

			// Load custom adversaries from DataManager (Obsidian storage)
			const customAdvs = plugin.dataManager.getAdversaries();
			// console.log("source of custom adversaries:", customAdvs.map((adv: any) => adv.source));
			// Convert to display format and mark as custom
			return customAdvs.map((adv: any) => ({
				...adv,
				tier: typeof adv.tier === "string" ? parseInt(adv.tier, 10) : adv.tier,
				isCustom: true,
				source: adv.source || "custom",
			}));
		} catch (error) {
			console.error("Error loading custom adversaries from DataManager:", error);
			return [];
		}
	}

	private loadAdversaryData() {
		const container = this.containerEl.children[1];
		const resultsDiv = container.querySelector(
			".df-adversary-results",
		) as HTMLElement;

		try {
			// Load built-in adversaries - all are now in one flat array
			const builtInAdversaries = ADVERSARIES.map((a) => 
				this.normalizeAdversary({
					...(a as any),
					isCustom: false,
					source: (a as any).source ?? (a as any).Source ?? "core",
					//print the source field
					tier: (a as any).tier ?? (a as any).Tier ?? "1",
				})
			);

			// Load custom adversaries from DataManager (Obsidian storage)
			const custom_Adversaries = this.loadCustomAdversaries();

			// Combine all lists
			this.adversaries = [
				...builtInAdversaries,
				...custom_Adversaries,
			];

			this.renderResults(this.adversaries);
		} catch (e) {
			console.error("Error loading adversary data:", e);
			new Notice("Failed to load adversary data.");
			if (resultsDiv) {
				resultsDiv.setText("Error loading adversary data.");
			}
		}
	}

	private createCounterControls(container: HTMLElement): HTMLElement {
		const counterContainer = container.createDiv({
			cls: "df-adversary-counter-container",
		});

		const minusBtn = counterContainer.createEl("button", {
			text: "-",
			cls: "df-adversary-counter-btn",
		});

		const counterInput = counterContainer.createEl("input", {
			attr: {
				type: "number",
				min: "1",
				value: getAdversaryCount().toString(),
				placeholder: "Count",
			},
			cls: "df-inline-input count-input",
		});

		const plusBtn = counterContainer.createEl("button", {
			text: "+",
			cls: "df-adversary-counter-btn",
		});

		minusBtn.onclick = () => {
			decrementAdversaryCount();
			counterInput.value = getAdversaryCount().toString();
		};

		plusBtn.onclick = () => {
			incrementAdversaryCount(1);
			counterInput.value = getAdversaryCount().toString();
		};

		counterInput.addEventListener("change", () => {
			let value = parseInt(counterInput.value, 10);
			if (isNaN(value) || value < 1) {
				value = 1;
			}
			// Update the adversary count to the new value
			const currentCount = getAdversaryCount();
			const difference = value - currentCount;
			if (difference > 0) {
				incrementAdversaryCount(difference);
			} else if (difference < 0) {
				for (let i = 0; i < Math.abs(difference); i++) {
					decrementAdversaryCount();
				}
			}
			counterInput.value = getAdversaryCount().toString();
		});

		counterInput.addEventListener("input", () => {
			// Allow typing but only validate on blur or change
			if (counterInput.value === "" || counterInput.value === "-") {
				return;
			}
		});

		return counterContainer;
	}

	private createSearchInput(container: HTMLElement): HTMLInputElement {
		const input = container.createEl("input", {
			attr: {
				type: "text",
				placeholder: "Search adversaries...",
			},
			cls: "df-adversary-search-box",
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
			cls: "df-tier-dropdown",
		});

		const defaultOption = document.createElement("option");
		defaultOption.value = "ALL";
		defaultOption.textContent = "All Tiers";
		defaultOption.selected = true;
		defaultOption.classList.add("df-tier-option");
		dropdown.appendChild(defaultOption);

		["1", "2", "3", "4"].forEach((tier) => {
			const option = document.createElement("option");
			option.value = tier;
			option.textContent = `Tier ${tier}`;
			option.classList.add("df-tier-option");
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
			".df-adversary-results",
		) as HTMLElement;

		if (!resultsDiv) {
			resultsDiv = container.createEl("div", {
				cls: "df-adversary-results",
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
		card.classList.add("df-adversary-card");

		// Add source-specific class to card
		const source = adversary.source || "core";
		card.classList.add(`df-source-${source.toLowerCase()}`);

		// Tier and type
		const tier = document.createElement("p");
		tier.classList.add("df-tier-text");
		tier.textContent = `Tier ${adversary.tier} ${adversary.type}`;

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
		sourceBadge.textContent = badgeTexts[source] || source;
		tier.appendChild(sourceBadge);

		card.appendChild(tier);
		if (badgeTexts[source] == "Custom") {
			const deleteBtn = document.createElement("button");
			deleteBtn.textContent = "Delete";
			deleteBtn.addEventListener("click", (e: MouseEvent) => {
				e.stopPropagation();
				this.deleteCustomAdversary(adversary);
			});
			card.appendChild(deleteBtn);
		}

		// Name
		const title = document.createElement("h3");
		title.classList.add("df-title-small-padding");
		title.textContent = adversary.name || "Unnamed Adversary";
		card.appendChild(title);

		// Description
		const desc = document.createElement("p");
		desc.classList.add("df-desc-small-padding");
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
<section class="df-card-outer df-pseudo-cut-corners outer">
    <div class="df-card-inner df-pseudo-cut-corners inner">
        ${multipleTickboxes}
        <h2>${adversary.name}</h2>
        <div class="df-subtitle">Tier ${adversary.tier} ${adversary.type}</div>
        <div class="df-desc">${adversary.desc}</div>
        <div class="df-motives">Motives & Tactics:
            <span class="df-motives-desc">${adversary.motives}</span>
        </div>
        <div class="df-stats">
            Difficulty: <span class="df-stat">${adversary.difficulty} |</span>
            Thresholds: <span class="df-stat">${adversary.thresholdMajor}/${adversary.thresholdSevere} |</span>
            HP: <span class="df-stat">${adversary.hp} |</span>
            Stress: <span class="df-stat">${adversary.stress || ""}</span>
            <div>ATK: <span class="df-stat">${adversary.atk} |</span>
            ${adversary.weaponName}: <span class="df-stat">${adversary.weaponRange} | ${adversary.weaponDamage}</span></div>
            <div class="df-experience-line">Experience: <span class="df-stat">${adversary.xp}</span></div>
        </div>
        <div class="df-section">FEATURES</div>
        ${featuresHTML}
    </div>
</section>
`;
	}

	private generateFeaturesHTML(features: AdversaryFeature[]): string {
		return features
			.map(
				(feature) => `
            <div class="df-feature">
                <span class="df-feature-title">
                    ${feature.name} - ${feature.type}${feature.cost ? `: ${feature.cost}` : ":"}
                </span>
                <span class="df-feature-desc">${feature.desc}</span>
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
            <div class="df-hp-tickboxes">
                <span class="df-hp-stress">HP</span>${this.generateTickboxes(adversary.hp, "hp-tick")}
                <span class="df-adversary-count">${index + 1}</span>
            </div>
            <div class="df-stress-tickboxes">
                <span class="df-hp-stress">Stress</span>${this.generateTickboxes(String(adversary.stress ?? 0), "stress-tick")}
            </div>
        `,
		).join("");
	}

	private generateTickboxes(count: string, prefix: string): string {
		const numCount = Number(count);
		return Array.from(
			{ length: numCount },
			(_, i) =>
				`<input type="checkbox" id="${prefix}-${i}" class="df-${prefix}box" />`,
		).join("");
	}
}
