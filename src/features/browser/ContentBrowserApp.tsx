import React, { useState, useEffect, useRef, useCallback } from "react";
import { App, MarkdownView, Notice, setIcon } from "obsidian";
import type { AdvData, EnvironmentData } from "../../types/index";
import { ADVERSARIES } from "../../data/index";
import { ENVIRONMENTS } from "../../data/index";
import {
	SearchEngine,
	SearchControlsUI,
	type SearchControlsConfig,
	getAdversaryCount,
	incrementAdversaryCount,
	decrementAdversaryCount,
	setAdversaryCount,
	resetAdversaryCount,
	resolveInsertDestination,
	createCanvasCard,
	getAvailableCanvasPosition,
	injectDiceBadgesIntoHtml,
	getDaggerForgePlugin,
	generateEnvUniqueId,
} from "../../utils/index";
import { buildCardHTML } from "../adversaries/index";
import { envToHtml } from "../environments/EnvToHtml";

export type BrowserTab = "adversary" | "environment";

interface Props {
	app: App;
	scrollContainer: HTMLElement;
	onTabSetter: (fn: (tab: BrowserTab) => void) => void;
	refreshToken?: number;
}

// ── Counter ───────────────────────────────────────────────────────────────────

function CounterControls() {
	const [count, setCount] = useState(getAdversaryCount());

	const decrement = () => {
		decrementAdversaryCount();
		setCount(getAdversaryCount());
	};
	const increment = () => {
		incrementAdversaryCount(1);
		setCount(getAdversaryCount());
	};
	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let v = parseInt(e.target.value, 10);
		if (isNaN(v) || v < 1) v = 1;
		if (v > 99) v = 99;
		setAdversaryCount(v);
		setCount(v);
		e.target.value = String(v);
	};

	return (
		<div className="df-adversary-counter-container">
			<LucideBtn icon="minus" title="Decrease" onClick={decrement} cls="df-adversary-counter-btn" />
			<input
				type="number" min={1} max={99}
				value={count}
				className="df-inline-input count-input"
				onChange={onChange}
				onFocus={e => e.target.select()}
				onBlur={e => {
					const v = parseInt(e.target.value, 10);
					if (isNaN(v) || v < 1) { setAdversaryCount(1); setCount(1); }
				}}
			/>
			<LucideBtn icon="plus" title="Increase" onClick={increment} cls="df-adversary-counter-btn" />
		</div>
	);
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function LucideBtn({ icon, title, onClick, cls }: { icon: string; title: string; onClick: (e: React.MouseEvent) => void; cls?: string }) {
	const ref = useRef<HTMLButtonElement>(null);
	useEffect(() => { if (ref.current) setIcon(ref.current, icon); }, [icon]);
	return <button ref={ref} title={title} className={cls} onClick={onClick} />;
}

function LucideIcon({ icon, cls }: { icon: string; cls?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => { if (ref.current) setIcon(ref.current, icon); }, [icon]);
	return <span ref={ref} className={cls} />;
}

// ── SearchPane — mounts vanilla SearchControlsUI into a ref ───────────────────
// configFactory is called once at mount time (after data is ready) so options
// are populated when create() builds the DOM panels.

function SearchPane({ configFactory, onUiReady }: {
	configFactory: () => SearchControlsConfig;
	onUiReady?: (ui: SearchControlsUI) => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!ref.current) return;
		ref.current.empty();
		const ui = new SearchControlsUI(configFactory());
		ui.create(ref.current);
		onUiReady?.(ui);
		return () => { ui.destroy(); };
	}, []);
	return <div ref={ref} className="df-search-controls-container" />;
}

// ── Adversary Pane ────────────────────────────────────────────────────────────

const ADV_TYPES = [
	"Bruiser", "Horde", "Leader", "Minion", "Ranged", "Skulk",
	"Social", "Solo", "Standard", "Support",
	"Leader (Umbra-Touched)", "Minion (Umbra-Touched)", "Solo (Umbra-Touched)",
];

function AdversaryPane({ app, refreshToken }: { app: App; refreshToken?: number }) {
	const [cards, setCards] = useState<AdvData[]>([]);
	const [ready, setReady] = useState(false);
	const engineRef = useRef(new SearchEngine<AdvData>());
	const uiRef = useRef<SearchControlsUI | null>(null);

	const load = useCallback(() => {
		const plugin = getDaggerForgePlugin(app);
		const custom = plugin?.dataManager?.getAdversaries()?.map(a => ({ ...a, source: a.source || "custom" })) ?? [];
		const all = [...ADVERSARIES, ...custom];
		engineRef.current.setCards(all);
		setCards([...engineRef.current.search()]);
		setReady(true);
	}, [app, refreshToken]);

	useEffect(() => { load(); }, [load]);

	const buildConfig = useCallback((): SearchControlsConfig => {
		const eng = engineRef.current;
		const rerender = () => setCards([...eng.search()]);
		return {
			availableTiers:   eng.getAvailableOptions("tiers"),
			availableSources: eng.getAvailableOptions("sources"),
			availableTypes:   ADV_TYPES,
			onSearchChange:   (q) => { eng.setFilters({ query: q }); rerender(); },
			onTierChange:     (t) => { eng.setFilters({ tiers: t }); rerender(); },
			onSourceChange:   (s) => { eng.setFilters({ sources: s }); rerender(); },
			onTypeChange:     (t) => { eng.setFilters({ types: t }); rerender(); },
			onClear:          () => { resetAdversaryCount(); eng.clearFilters(); rerender(); },
		};
	}, []);

	const insert = useCallback((adversary: AdvData) => {
		const plugin = getDaggerForgePlugin(app);
		const { kind, canvas } = resolveInsertDestination(app, plugin?.lastMainLeaf ?? null);
		const count = getAdversaryCount();
		const wide = uiRef.current?.getWideCard() ?? false;
		const html = buildCardHTML(
			{ name: adversary.name, tier: adversary.tier, type: adversary.type, desc: adversary.desc,
			  motives: adversary.motives, difficulty: adversary.difficulty,
			  thresholdMajor: adversary.thresholdMajor, thresholdSevere: adversary.thresholdSevere,
			  hp: adversary.hp, stress: adversary.stress ?? 0, atk: adversary.atk,
			  weaponName: adversary.weaponName, weaponRange: adversary.weaponRange,
			  weaponDamage: adversary.weaponDamage, xp: adversary.xp,
			  count: String(count), source: adversary.source || "core" },
			adversary.features.map(f => ({ ...f, cost: f.cost || "" })), wide,
		);
		if (kind === "canvas") {
			const pos = getAvailableCanvasPosition(canvas);
			createCanvasCard(app, html, canvas, { x: pos.x, y: pos.y, width: 400, height: 600 });
			new Notice(`Inserted ${adversary.name} in canvas.`); return;
		}
		// Fall back to lastMainLeaf — the browser panel steals focus on click
		const leaf = plugin?.lastMainLeaf;
		const view = (leaf?.view instanceof MarkdownView ? leaf.view : null)
			?? app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || view.getMode() !== "source") { new Notice("Open a note in edit mode first."); return; }
		view.editor.replaceSelection(injectDiceBadgesIntoHtml(html));
		new Notice(`Inserted ${adversary.name}.`);
	}, [app]);

	const deleteAdv = useCallback(async (adversary: AdvData) => {
		const plugin = getDaggerForgePlugin(app);
		if (!plugin || !adversary.id) return;
		await plugin.dataManager.deleteAdversaryById(adversary.id);
		new Notice(`Deleted ${adversary.name}`);
		load();
	}, [app, load]);

	return (
		<>
			<CounterControls />
			{ready && (
				<SearchPane
					configFactory={buildConfig}
					onUiReady={(ui) => { uiRef.current = ui; }}
				/>
			)}
			<div className="df-adversary-results">
				{cards.length === 0
					? <p>No adversaries found.</p>
					: cards.map(a => (
						<AdvCard key={a.id || a.name} adversary={a} onInsert={insert} onDelete={deleteAdv} />
					))
				}
			</div>
		</>
	);
}

function AdvCard({ adversary, onInsert, onDelete }: {
	adversary: AdvData;
	onInsert: (a: AdvData) => void;
	onDelete: (a: AdvData) => void;
}) {
	const source = adversary.source || "core";
	const isCustom = source.toLowerCase() === "custom";
	return (
		<div className={`df-adversary-card df-source-${source.toLowerCase()}`} onClick={() => onInsert(adversary)}>
			<p className="df-tier-text">
				Tier {adversary.tier} {adversary.type}{" "}
				<span className={`df-source-badge-${source.toLowerCase()}`}>{source.toLowerCase()}</span>
			</p>
			{isCustom && (
				<LucideBtn icon="trash" title="Delete" cls="df-adv-delete-btn"
					onClick={(e: any) => { e.stopPropagation(); onDelete(adversary); }} />
			)}
			<h3 className="df-title-small-padding">{adversary.name || "Unnamed"}</h3>
			<p className="df-desc-small-padding">{adversary.desc || ""}</p>
		</div>
	);
}

// ── Environment Pane ──────────────────────────────────────────────────────────

function EnvironmentPane({ app, refreshToken }: { app: App; refreshToken?: number }) {
	const [cards, setCards] = useState<EnvironmentData[]>([]);
	const [ready, setReady] = useState(false);
	const engineRef = useRef(new SearchEngine<EnvironmentData>());
	const uiRef = useRef<SearchControlsUI | null>(null);

	const load = useCallback(() => {
		const plugin = getDaggerForgePlugin(app);
		const customRaw = plugin?.dataManager?.getEnvironments() ?? [];
		const custom = customRaw.map((e: any) => ({ ...e, id: e.id || generateEnvUniqueId(), source: e.source || "custom" }));
		const builtIn = ENVIRONMENTS.map((e: any) => ({ ...e, id: e.id || generateEnvUniqueId(), source: e.source ?? "core" }));
		const all = [...builtIn, ...custom];
		engineRef.current.setCards(all);
		setCards([...engineRef.current.search()]);
		setReady(true);
	}, [app, refreshToken]);

	useEffect(() => { load(); }, [load]);

	const buildConfig = useCallback((): SearchControlsConfig => {
		const eng = engineRef.current;
		const rerender = () => setCards([...eng.search()]);
		return {
			availableTiers:   eng.getAvailableOptions("tiers"),
			availableSources: eng.getAvailableOptions("sources"),
			availableTypes:   eng.getAvailableOptions("types"),
			onSearchChange:   (q) => { eng.setFilters({ query: q }); rerender(); },
			onTierChange:     (t) => { eng.setFilters({ tiers: t }); rerender(); },
			onSourceChange:   (s) => { eng.setFilters({ sources: s }); rerender(); },
			onTypeChange:     (t) => { eng.setFilters({ types: t }); rerender(); },
			onClear:          () => { eng.clearFilters(); rerender(); },
		};
	}, []);

	const insert = useCallback((env: EnvironmentData) => {
		const plugin = getDaggerForgePlugin(app);
		const { kind, canvas } = resolveInsertDestination(app, plugin?.lastMainLeaf ?? null);
		const wide = uiRef.current?.getWideCard() ?? false;
		const html = injectDiceBadgesIntoHtml(envToHtml(env, wide));
		if (kind === "canvas") {
			const pos = getAvailableCanvasPosition(canvas);
			createCanvasCard(app, html, canvas, { x: pos.x, y: pos.y, width: 400, height: 650 });
			new Notice(`Inserted ${env.name}.`); return;
		}
		// Fall back to lastMainLeaf — the browser panel steals focus on click
		const leaf = plugin?.lastMainLeaf;
		const view = (leaf?.view instanceof MarkdownView ? leaf.view : null)
			?? app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || view.getMode() !== "source") { new Notice("Open a note in edit mode first."); return; }
		view.editor.replaceSelection(html);
		new Notice(`Inserted ${env.name}.`);
	}, [app]);

	const deleteEnv = useCallback(async (env: EnvironmentData) => {
		const plugin = getDaggerForgePlugin(app);
		if (!plugin || !env.id) return;
		await plugin.dataManager.deleteEnvironmentById(env.id);
		new Notice(`Deleted ${env.name}`);
		load();
	}, [app, load]);

	const BADGE_LABELS: Record<string, string> = { core: "Core", custom: "Custom", sablewood: "Sablewood", umbra: "Umbra", void: "Void" };

	return (
		<>
			{ready && (
				<SearchPane
					configFactory={buildConfig}
					onUiReady={(ui) => { uiRef.current = ui; }}
				/>
			)}
			<div className="df-environment-results">
				{cards.length === 0
					? <p>No environments found.</p>
					: cards.map(e => (
						<EnvCard key={e.id || e.name} env={e} badgeLabels={BADGE_LABELS} onInsert={insert} onDelete={deleteEnv} />
					))
				}
			</div>
		</>
	);
}

function EnvCard({ env, badgeLabels, onInsert, onDelete }: {
	env: EnvironmentData;
	badgeLabels: Record<string, string>;
	onInsert: (e: EnvironmentData) => void;
	onDelete: (e: EnvironmentData) => void;
}) {
	const source = env.source || "core";
	const isCustom = (badgeLabels[source] ?? source) === "Custom";
	return (
		<div className={`df-env-card df-source-${source.toLowerCase()}`} onClick={() => onInsert(env)}>
			<p className="df-tier-text">
				Tier {env.tier} {env.type}{" "}
				<span className={`df-source-badge-${source.toLowerCase()}`}>{badgeLabels[source] || source}</span>
			</p>
			{isCustom && (
				<LucideBtn icon="trash" title="Delete" cls="df-env-delete-btn"
					onClick={(e: any) => { e.stopPropagation(); onDelete(env); }} />
			)}
			<h3 className="df-title-small-padding">{env.name || "Unnamed"}</h3>
			<p className="df-desc-small-padding">{env.desc || ""}</p>
		</div>
	);
}

// ── Root App ──────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<BrowserTab, string> = {
	adversary:   "sword",
	environment: "mountain",
};

const TAB_LABELS: Record<BrowserTab, string> = {
	adversary:   "Adversaries",
	environment: "Environments",
};

export function ContentBrowserApp({ app, scrollContainer, onTabSetter, refreshToken }: Props) {
	const [activeTab, setActiveTab] = useState<BrowserTab>("adversary");
	const [showScrollTop, setShowScrollTop] = useState(false);

	// Expose tab setter to the Obsidian ItemView layer
	useEffect(() => { onTabSetter(setActiveTab); }, [onTabSetter]);

	// Scroll-to-top detection
	useEffect(() => {
		const handler = () => setShowScrollTop(scrollContainer.scrollTop > 200);
		scrollContainer.addEventListener("scroll", handler);
		return () => scrollContainer.removeEventListener("scroll", handler);
	}, [scrollContainer]);

	return (
		<>
			{/* Tab strip */}
			<div className="df-browser-tabs">
				{(["adversary", "environment"] as BrowserTab[]).map(tab => (
					<div
						key={tab}
						className={`df-browser-tab${activeTab === tab ? " df-browser-tab--active" : ""}`}
						data-tab={tab}
						onClick={() => setActiveTab(tab)}
					>
						<LucideIcon icon={TAB_ICONS[tab]} cls="df-tab-icon" />
						{TAB_LABELS[tab]}
					</div>
				))}
			</div>

			{/* Panes */}
			<div className={`df-browser-pane${activeTab === "adversary" ? " df-browser-pane--active" : ""}`} data-pane="adversary">
				<AdversaryPane app={app} refreshToken={refreshToken} />
			</div>
			<div className={`df-browser-pane${activeTab === "environment" ? " df-browser-pane--active" : ""}`} data-pane="environment">
				<EnvironmentPane app={app} refreshToken={refreshToken} />
			</div>

			{/* Scroll-to-top */}
			<button
				className={`df-scroll-to-top${showScrollTop ? " df-scroll-to-top--visible" : ""}`}
				aria-label="Scroll to top"
				onClick={() => scrollContainer.scrollTo({ top: 0, behavior: "smooth" })}
			>↑</button>
		</>
	);
}
