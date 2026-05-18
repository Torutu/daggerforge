import { ItemView, MarkdownView, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import { ADVERSARIES } from "../../data/index";
import { ENVIRONMENTS } from "../../data/index";
import type { AdvData, EnvironmentData } from "../../types/index";
import {
	getAdversaryCount,
	incrementAdversaryCount,
	decrementAdversaryCount,
	setAdversaryCount,
	resetAdversaryCount,
	resolveInsertDestination,
	createCanvasCard,
	getAvailableCanvasPosition,
	SearchEngine,
	SearchControlsUI,
	injectDiceBadgesIntoHtml,
	getDaggerForgePlugin,
	generateEnvUniqueId,
} from "../../utils/index";
import { buildCardHTML } from "../adversaries/index";
import { envToHtml } from "../environments/EnvToHtml";

export const Content_Browser_View_Type = "daggerforge:content-browser";
export type BrowserTab = "adversary" | "environment";

export class ContentBrowserView extends ItemView {
	private activeTab: BrowserTab = "adversary";
	private lastActiveMarkdown: MarkdownView | null = null;

	// Adversary pane
	private advEngine = new SearchEngine<AdvData>();
	private advSearchUI: SearchControlsUI | null = null;
	private advResultsDiv: HTMLElement | null = null;
	private advSearchContainer: HTMLElement | null = null;
	private adversaries: AdvData[] = [];

	// Environment pane
	private envEngine = new SearchEngine<EnvironmentData>();
	private envSearchUI: SearchControlsUI | null = null;
	private envResultsDiv: HTMLElement | null = null;
	private envSearchContainer: HTMLElement | null = null;
	private environments: EnvironmentData[] = [];

	private scrollToTopBtn: HTMLButtonElement | null = null;

	constructor(leaf: WorkspaceLeaf) { super(leaf); }

	getViewType() { return Content_Browser_View_Type; }
	getDisplayText() { return "Content Browser"; }
	getIcon() { return "layout-grid"; }

	// ── Lifecycle ────────────────────────────────────────────────────────────

	async onOpen() {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (!leaf) return;
				if (leaf.view instanceof MarkdownView) {
					this.lastActiveMarkdown = leaf.view;
				}
			}),
		);
		this.buildLayout();
		this.loadAllData();
		this.attachScrollToTop();
	}

	async onClose() {
		this.advSearchUI?.destroy();
		this.envSearchUI?.destroy();
		this.advSearchUI = null;
		this.envSearchUI = null;
		this.scrollToTopBtn?.remove();
		this.scrollToTopBtn = null;
	}

	public refresh() {
		this.loadAllData();
	}

	public switchTab(tab: BrowserTab) {
		this.activeTab = tab;
		this.containerEl.querySelectorAll(".df-browser-tab").forEach((t) => {
			t.classList.toggle("df-browser-tab--active", t.getAttribute("data-tab") === tab);
		});
		this.containerEl.querySelectorAll(".df-browser-pane").forEach((p) => {
			p.classList.toggle("df-browser-pane--active", p.getAttribute("data-pane") === tab);
		});
	}

	// ── Layout ───────────────────────────────────────────────────────────────

	private buildLayout() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("df-content-browser");

		// Tab strip
		const tabStrip = container.createDiv({ cls: "df-browser-tabs" });

		const advTab = tabStrip.createDiv({ cls: "df-browser-tab df-browser-tab--active", attr: { "data-tab": "adversary" } });
		setIcon(advTab.createSpan(), "venetian-mask");
		advTab.createSpan({ text: " Adversaries" });
		advTab.addEventListener("click", () => this.switchTab("adversary"));

		const envTab = tabStrip.createDiv({ cls: "df-browser-tab", attr: { "data-tab": "environment" } });
		setIcon(envTab.createSpan(), "mountain");
		envTab.createSpan({ text: " Environments" });
		envTab.addEventListener("click", () => this.switchTab("environment"));

		// ── Adversary pane ───────────────────────────────────────────────────
		const advPane = container.createDiv({ cls: "df-browser-pane df-browser-pane--active", attr: { "data-pane": "adversary" } });

		const counterContainer = advPane.createDiv({ cls: "df-adversary-counter-container" });
		this.buildCounterControls(counterContainer);

		this.advSearchContainer = advPane.createDiv({ cls: "df-search-controls-container" });
		this.advResultsDiv = advPane.createEl("div", { cls: "df-adversary-results" });

		// ── Environment pane ─────────────────────────────────────────────────
		const envPane = container.createDiv({ cls: "df-browser-pane", attr: { "data-pane": "environment" } });

		this.envSearchContainer = envPane.createDiv({ cls: "df-search-controls-container" });
		this.envResultsDiv = envPane.createEl("div", { cls: "df-environment-results" });
	}

	// ── Data loading ─────────────────────────────────────────────────────────

	private loadAllData() {
		this.loadAdversaryData();
		this.loadEnvironmentData();
	}

	private loadAdversaryData() {
		try {
			const plugin = getDaggerForgePlugin(this.app);
			const custom: AdvData[] = plugin?.dataManager?.getAdversaries()?.map(a => ({ ...a, source: a.source || "custom" })) ?? [];
			this.adversaries = [...ADVERSARIES, ...custom];
			this.advEngine.setCards(this.adversaries);

			if (this.advSearchContainer) {
				this.advSearchContainer.empty();
				this.advSearchUI?.destroy();
				this.advSearchUI = new SearchControlsUI({
					placeholderText: "Search adversaries…",
					availableTiers: this.advEngine.getAvailableOptions("tiers"),
					availableSources: this.advEngine.getAvailableOptions("sources"),
					availableTypes: ["Bruiser", "Horde", "Leader", "Minion", "Ranged", "Skulk",
						"Social", "Solo", "Standard", "Support",
						"Leader (Umbra-Touched)", "Minion (Umbra-Touched)", "Solo (Umbra-Touched)"],
					onSearchChange: (q) => { this.advEngine.setFilters({ query: q }); this.renderAdversaries(this.advEngine.search()); },
					onTierChange:   (t) => { this.advEngine.setFilters({ tiers: t });  this.renderAdversaries(this.advEngine.search()); },
					onSourceChange: (s) => { this.advEngine.setFilters({ sources: s }); this.renderAdversaries(this.advEngine.search()); },
					onTypeChange:   (t) => { this.advEngine.setFilters({ types: t });   this.renderAdversaries(this.advEngine.search()); },
					onClear:        ()  => { resetAdversaryCount(); this.containerEl.querySelectorAll<HTMLInputElement>(".count-input").forEach(i => i.value = "1"); },
				});
				this.advSearchUI.create(this.advSearchContainer);
			}
			this.renderAdversaries(this.adversaries);
		} catch (e) {
			console.error("ContentBrowserView: adversary load error", e);
			this.advResultsDiv?.setText("Error loading adversaries.");
		}
	}

	private loadEnvironmentData() {
		try {
			const plugin = getDaggerForgePlugin(this.app);
			const customRaw = plugin?.dataManager?.getEnvironments() ?? [];
			const custom = customRaw.map((e: any) => ({ ...e, id: e.id || generateEnvUniqueId(), source: e.source || "custom" }));
			const builtIn = ENVIRONMENTS.map((e: any) => ({ ...e, id: e.id || generateEnvUniqueId(), source: e.source ?? "core" }));
			this.environments = [...builtIn, ...custom];
			this.envEngine.setCards(this.environments);

			if (this.envSearchContainer) {
				this.envSearchContainer.empty();
				this.envSearchUI?.destroy();
				this.envSearchUI = new SearchControlsUI({
					placeholderText: "Search environments…",
					availableTiers: this.envEngine.getAvailableOptions("tiers"),
					availableSources: this.envEngine.getAvailableOptions("sources"),
					availableTypes: this.envEngine.getAvailableOptions("types"),
					onSearchChange: (q) => { this.envEngine.setFilters({ query: q }); this.renderEnvironments(this.envEngine.search()); },
					onTierChange:   (t) => { this.envEngine.setFilters({ tiers: t });  this.renderEnvironments(this.envEngine.search()); },
					onSourceChange: (s) => { this.envEngine.setFilters({ sources: s }); this.renderEnvironments(this.envEngine.search()); },
					onTypeChange:   (t) => { this.envEngine.setFilters({ types: t });   this.renderEnvironments(this.envEngine.search()); },
					onClear:        ()  => { this.envEngine.clearFilters(); this.renderEnvironments(this.envEngine.search()); },
				});
				this.envSearchUI.create(this.envSearchContainer);
			}
			this.renderEnvironments(this.environments);
		} catch (e) {
			console.error("ContentBrowserView: environment load error", e);
			this.envResultsDiv?.setText("Error loading environments.");
		}
	}

	// ── Render ───────────────────────────────────────────────────────────────

	private renderAdversaries(list: AdvData[]) {
		if (!this.advResultsDiv) return;
		this.advResultsDiv.empty();
		if (list.length === 0) { this.advResultsDiv.setText("No adversaries found."); return; }
		list.forEach(a => this.advResultsDiv!.appendChild(this.buildAdvCard(a)));
	}

	private renderEnvironments(list: EnvironmentData[]) {
		if (!this.envResultsDiv) return;
		this.envResultsDiv.empty();
		if (list.length === 0) { this.envResultsDiv.setText("No environments found."); return; }
		list.forEach(e => this.envResultsDiv!.appendChild(this.buildEnvCard(e)));
	}

	private buildAdvCard(adversary: AdvData): HTMLElement {
		const card = document.createElement("div");
		const source = adversary.source || "core";
		card.className = `df-adversary-card df-source-${source.toLowerCase()}`;

		const tier = card.createEl("p", { cls: "df-tier-text" });
		tier.textContent = `Tier ${adversary.tier} ${adversary.type} `;
		const badge = tier.createSpan({ cls: `df-source-badge-${source.toLowerCase()}`, text: source.toLowerCase() });

		if (source.toLowerCase() === "custom") {
			const del = card.createEl("button", { cls: "df-adv-delete-btn" });
			setIcon(del, "trash");
			del.addEventListener("click", async (e) => {
				e.stopPropagation();
				const plugin = getDaggerForgePlugin(this.app);
				if (!plugin || !adversary.id) return;
				await plugin.dataManager.deleteAdversaryById(adversary.id);
				new Notice(`Deleted ${adversary.name}`);
				this.loadAdversaryData();
			});
		}

		card.createEl("h3", { cls: "df-title-small-padding", text: adversary.name || "Unnamed" });
		card.createEl("p", { cls: "df-desc-small-padding", text: adversary.desc || "" });
		card.addEventListener("click", () => this.insertAdversary(adversary));
		return card;
	}

	private buildEnvCard(env: EnvironmentData): HTMLElement {
		const card = document.createElement("div");
		const source = env.source || "core";
		card.className = `df-env-card df-source-${source.toLowerCase()}`;

		const badgeLabels: Record<string, string> = { core: "Core", custom: "Custom", sablewood: "Sablewood", umbra: "Umbra", void: "Void" };

		if ((badgeLabels[source] ?? source) === "Custom") {
			const del = card.createEl("button", { cls: "df-env-delete-btn" });
			setIcon(del, "trash");
			del.addEventListener("click", async (e) => {
				e.stopPropagation();
				const plugin = getDaggerForgePlugin(this.app);
				if (!plugin || !env.id) return;
				await plugin.dataManager.deleteEnvironmentById(env.id);
				new Notice(`Deleted ${env.name}`);
				this.loadEnvironmentData();
			});
		}

		const tier = card.createEl("p", { cls: "df-tier-text", text: `Tier ${env.tier} ${env.type}` });
		tier.createSpan({ cls: `df-source-badge-${source.toLowerCase()}`, text: badgeLabels[source] || source });

		card.createEl("h3", { cls: "df-title-small-padding", text: env.name || "Unnamed" });
		card.createEl("p", { cls: "df-desc-small-padding", text: env.desc || "" });
		card.addEventListener("click", () => this.insertEnvironment(env));
		return card;
	}

	// ── Insert ───────────────────────────────────────────────────────────────

	private insertAdversary(adversary: AdvData) {
		const plugin = getDaggerForgePlugin(this.app);
		const { kind, canvas } = resolveInsertDestination(this.app, plugin?.lastMainLeaf ?? null);
		const html = this.buildAdvHtml(adversary);

		if (kind === "canvas") {
			const pos = getAvailableCanvasPosition(canvas);
			createCanvasCard(this.app, html, canvas, { x: pos.x, y: pos.y, width: 400, height: 600 });
			new Notice(`Inserted ${adversary.name} in canvas.`);
			return;
		}
		const view = this.app.workspace.getActiveViewOfType(MarkdownView) || this.lastActiveMarkdown;
		if (!view || view.getMode() !== "source") { new Notice("Open a note in edit mode first."); return; }
		view.editor.replaceSelection(injectDiceBadgesIntoHtml(html));
		new Notice(`Inserted ${adversary.name}.`);
	}

	private insertEnvironment(env: EnvironmentData) {
		const plugin = getDaggerForgePlugin(this.app);
		const { kind, canvas } = resolveInsertDestination(this.app, plugin?.lastMainLeaf ?? null);
		const wide = this.envSearchUI?.getWideCard() ?? false;
		const html = injectDiceBadgesIntoHtml(envToHtml(env, wide));

		if (kind === "canvas") {
			const pos = getAvailableCanvasPosition(canvas);
			createCanvasCard(this.app, html, canvas, { x: pos.x, y: pos.y, width: 400, height: 650 });
			new Notice(`Inserted ${env.name}.`);
			return;
		}
		const view = this.app.workspace.getActiveViewOfType(MarkdownView) || this.lastActiveMarkdown;
		if (!view || view.getMode() !== "source") { new Notice("Open a note in edit mode first."); return; }
		view.editor.replaceSelection(html);
		new Notice(`Inserted ${env.name}.`);
	}

	private buildAdvHtml(adversary: AdvData): string {
		const count = getAdversaryCount();
		const wide = this.advSearchUI?.getWideCard() ?? false;
		return buildCardHTML(
			{
				name: adversary.name, tier: adversary.tier, type: adversary.type,
				desc: adversary.desc, motives: adversary.motives,
				difficulty: adversary.difficulty, thresholdMajor: adversary.thresholdMajor,
				thresholdSevere: adversary.thresholdSevere, hp: adversary.hp,
				stress: adversary.stress ?? 0, atk: adversary.atk,
				weaponName: adversary.weaponName, weaponRange: adversary.weaponRange,
				weaponDamage: adversary.weaponDamage, xp: adversary.xp,
				count: String(count), source: adversary.source || "core",
			},
			adversary.features.map(f => ({ ...f, cost: f.cost || "" })),
			wide,
		);
	}

	// ── Counter ──────────────────────────────────────────────────────────────

	private buildCounterControls(container: HTMLElement) {
		const minusBtn = container.createEl("button", { cls: "df-adversary-counter-btn", attr: { title: "Decrease" } });
		setIcon(minusBtn, "minus");

		const input = container.createEl("input", {
			cls: "df-inline-input count-input",
			attr: { type: "number", min: "1", max: "99", value: getAdversaryCount().toString() },
		}) as HTMLInputElement;

		const plusBtn = container.createEl("button", { cls: "df-adversary-counter-btn", attr: { title: "Increase" } });
		setIcon(plusBtn, "plus");

		minusBtn.onclick = () => { decrementAdversaryCount(); input.value = getAdversaryCount().toString(); };
		plusBtn.onclick  = () => { incrementAdversaryCount(1); input.value = getAdversaryCount().toString(); };
		input.addEventListener("focus", () => input.select());
		input.addEventListener("input", () => {
			let v = parseInt(input.value, 10);
			if (isNaN(v) || v < 1) v = 1;
			if (v > 99) { v = 99; input.value = "99"; }
			setAdversaryCount(v);
		});
		input.addEventListener("blur", () => {
			const v = parseInt(input.value, 10);
			input.value = (isNaN(v) || v < 1) ? "1" : String(v);
		});
	}

	// ── Scroll-to-top ────────────────────────────────────────────────────────

	private attachScrollToTop() {
		const container = this.containerEl.children[1] as HTMLElement;
		this.scrollToTopBtn = container.createEl("button", { cls: "df-scroll-to-top", text: "↑", attr: { "aria-label": "Scroll to top" } });
		container.addEventListener("scroll", () => {
			this.scrollToTopBtn?.classList.toggle("df-scroll-to-top--visible", container.scrollTop > 200);
		});
		this.scrollToTopBtn.addEventListener("click", () => container.scrollTo({ top: 0, behavior: "smooth" }));
	}
}
