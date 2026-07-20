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
	getDaggerForgePlugin,
	generateEnvUniqueId,
} from "../../utils/index";
import { buildAdversaryEmbedBlock } from "../adversaries/AdversaryEmbed";
import { buildEnvironmentEmbedBlock } from "../environments/EnvironmentEmbed";
import { encodeAdversaryCode, encodeEnvironmentCode, encodeGearCode } from "../embeds/embedCode";
import { insertAtFocusedTarget } from "../embeds/insertDestination";
import { buildCharacterEmbedBlock, characterEmbedCode } from "../characters/CharacterSheetEmbed";
import { ConfirmModal } from "../characters/components/ConfirmModal";
import type { CharacterData } from "../../types/character";
import { CLASS_COLORS, GEAR_KIND_COLORS, GEAR_KIND_LABELS, GearData } from "../../types/srd";
import { ALL_GEAR } from "../../data/srd";
import { buildItemEmbedBlock } from "../items/ItemEmbed";
import { hexTint } from "../characters/components/SheetSections";

export type BrowserTab = "adversary" | "environment" | "character" | "item";

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

/** Custom records need a `code:` snapshot on insert - bundled ones ship with the plugin. */
function isCustomRecord(record: { id?: string; source?: string }): boolean {
	return (record.source ?? "custom").toLowerCase() === "custom" || /^CU[AEI]_/.test(record.id ?? "");
}

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

// ── SearchPane - mounts vanilla SearchControlsUI into a ref ───────────────────
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
		uiRef.current?.updateFacetCounts({
			tiers:   engineRef.current.getFacetCounts("tiers"),
			sources: engineRef.current.getFacetCounts("sources"),
			types:   engineRef.current.getFacetCounts("types"),
		});
	}, [app, refreshToken]);

	useEffect(() => { load(); }, [load]);

	const buildConfig = useCallback((): SearchControlsConfig => {
		const eng = engineRef.current;
		const pushCounts = () => uiRef.current?.updateFacetCounts({
			tiers:   eng.getFacetCounts("tiers"),
			sources: eng.getFacetCounts("sources"),
			types:   eng.getFacetCounts("types"),
		});
		const rerender = () => { setCards([...eng.search()]); pushCounts(); };
		return {
			availableTiers:   ["1", "2", "3", "4"],
			availableSources: Array.from(new Set(["core", "custom", ...eng.getAvailableOptions("sources")])),
			availableTypes:   ADV_TYPES,
			onSearchChange:   (q) => { eng.setFilters({ query: q }); rerender(); },
			onTierChange:     (t) => { eng.setFilters({ tiers: t }); rerender(); },
			onSourceChange:   (s) => { eng.setFilters({ sources: s }); rerender(); },
			onTypeChange:     (t) => { eng.setFilters({ types: t }); rerender(); },
			onClear:          () => { resetAdversaryCount(); eng.clearFilters(); rerender(); },
		};
	}, []);

	const insert = useCallback(async (adversary: AdvData) => {
		const plugin = getDaggerForgePlugin(app);
		if (!plugin || !adversary.id) return;
		// Live id-based embed: interactive card that follows the stored record.
		// Each insert gets its own instance token, so copies track HP separately.
		// Custom records also carry a `code:` snapshot so the card renders in
		// vaults whose plugin data doesn't include them (sync).
		const code = isCustomRecord(adversary) ? await encodeAdversaryCode(adversary) : undefined;
		const block = buildAdversaryEmbedBlock(adversary.id, getAdversaryCount(), code);
		insertAtFocusedTarget(plugin, block, { width: 460, height: 620 }, adversary.name);
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
					onUiReady={(ui) => {
						uiRef.current = ui;
						const eng = engineRef.current;
						ui.updateFacetCounts({
							tiers:   eng.getFacetCounts("tiers"),
							sources: eng.getFacetCounts("sources"),
							types:   eng.getFacetCounts("types"),
						});
					}}
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
		uiRef.current?.updateFacetCounts({
			tiers:   engineRef.current.getFacetCounts("tiers"),
			sources: engineRef.current.getFacetCounts("sources"),
			types:   engineRef.current.getFacetCounts("types"),
		});
	}, [app, refreshToken]);

	useEffect(() => { load(); }, [load]);

	const buildConfig = useCallback((): SearchControlsConfig => {
		const eng = engineRef.current;
		const pushCounts = () => uiRef.current?.updateFacetCounts({
			tiers:   eng.getFacetCounts("tiers"),
			sources: eng.getFacetCounts("sources"),
			types:   eng.getFacetCounts("types"),
		});
		const rerender = () => { setCards([...eng.search()]); pushCounts(); };
		return {
			availableTiers:   ["1", "2", "3", "4"],
			availableSources: Array.from(new Set(["core", "custom", "sablewood", "umbra", "void", ...eng.getAvailableOptions("sources")])),
			availableTypes:   eng.getAvailableOptions("types"),
			onSearchChange:   (q) => { eng.setFilters({ query: q }); rerender(); },
			onTierChange:     (t) => { eng.setFilters({ tiers: t }); rerender(); },
			onSourceChange:   (s) => { eng.setFilters({ sources: s }); rerender(); },
			onTypeChange:     (t) => { eng.setFilters({ types: t }); rerender(); },
			onClear:          () => { eng.clearFilters(); rerender(); },
		};
	}, []);

	const insert = useCallback(async (env: EnvironmentData) => {
		const plugin = getDaggerForgePlugin(app);
		if (!plugin || !env.id) return;
		const code = isCustomRecord(env) ? await encodeEnvironmentCode(env) : undefined;
		insertAtFocusedTarget(plugin, buildEnvironmentEmbedBlock(env.id, code), { width: 460, height: 760 }, env.name);
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
					onUiReady={(ui) => {
						uiRef.current = ui;
						const eng = engineRef.current;
						ui.updateFacetCounts({
							tiers:   eng.getFacetCounts("tiers"),
							sources: eng.getFacetCounts("sources"),
							types:   eng.getFacetCounts("types"),
						});
					}}
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

// ── Character Pane ────────────────────────────────────────────────────────────

/** Maps a sheet's free-text "Class & Subclass" to a known class and its color. */
function characterClassInfo(classSubclass: string): { className: string | null; color: string | null } {
	const text = classSubclass.toLowerCase();
	const className =
		Object.keys(CLASS_COLORS).find((name) => text.includes(name.toLowerCase())) ?? null;
	return { className, color: className ? CLASS_COLORS[className] : null };
}

function CharacterPane({ app, refreshToken }: { app: App; refreshToken?: number }) {
	const [query, setQuery] = useState("");
	// refreshToken re-renders the pane whenever stored data changes
	void refreshToken;

	const plugin = getDaggerForgePlugin(app);
	const q = query.trim().toLowerCase();
	const characters = [...(plugin?.dataManager?.getCharacters() ?? [])]
		.filter(
			(c) =>
				!q ||
				(c.name || "Unnamed character").toLowerCase().includes(q) ||
				c.classSubclass.toLowerCase().includes(q) ||
				c.heritage.toLowerCase().includes(q),
		)
		.sort((a, b) => (a.name || "Unnamed").localeCompare(b.name || "Unnamed"));

	const insert = useCallback(async (character: CharacterData) => {
		const plg = getDaggerForgePlugin(app);
		if (!plg) return;
		const code = await characterEmbedCode(plg, character.id);
		insertAtFocusedTarget(
			plg,
			buildCharacterEmbedBlock(character.id, code),
			{ width: 960, height: 1100 },
			character.name || "character",
		);
	}, [app]);

	const deleteCharacter = useCallback((character: CharacterData) => {
		const plg = getDaggerForgePlugin(app);
		if (!plg) return;
		new ConfirmModal(plg.app, {
			title: "Delete character?",
			message: `"${character.name || "Unnamed character"}" will be removed from your saved characters.`,
			confirmLabel: "Delete",
			onConfirm: () => void plg.dataManager.deleteCharacterById(character.id),
		}).open();
	}, [app]);

	return (
		<>
			<input
				type="text"
				className="df-char-search"
				placeholder="Search characters…"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			<div className="df-adversary-results">
				{characters.length === 0 ? (
					<p>{q ? "No characters match." : "No saved characters yet. Open the character sheet to create one."}</p>
				) : (
					characters.map((c) => (
						<CharacterCard key={c.id} character={c} onInsert={insert} onDelete={deleteCharacter} />
					))
				)}
			</div>
		</>
	);
}

function CharacterCard({ character, onInsert, onDelete }: {
	character: CharacterData;
	onInsert: (c: CharacterData) => void;
	onDelete: (c: CharacterData) => void;
}) {
	const { className, color } = characterClassInfo(character.classSubclass);
	const tag = className ?? (character.classSubclass.trim() || "No class");
	const badgeColor = color ?? "var(--text-faint)";
	return (
		<div
			className="df-adversary-card df-character-card"
			style={{ borderLeftColor: badgeColor }}
			onClick={() => onInsert(character)}
		>
			<p className="df-tier-text">
				{character.level.trim() ? `Level ${character.level}` : "Level -"}{" "}
				<span
					className="df-class-badge"
					style={{
						color: badgeColor,
						borderColor: badgeColor,
						background: color ? hexTint(color, 0.15) : "transparent",
					}}
				>
					{tag}
				</span>
			</p>
			<LucideBtn icon="trash" title="Delete" cls="df-adv-delete-btn"
				onClick={(e: any) => { e.stopPropagation(); onDelete(character); }} />
			<h3 className="df-title-small-padding">{character.name || "Unnamed character"}</h3>
			<p className="df-desc-small-padding">{character.heritage}</p>
		</div>
	);
}

// ── Items Pane ────────────────────────────────────────────────────────────────

const GEAR_KINDS = ["all", "weapon", "armor", "wheelchair", "item", "consumable"] as const;

function ItemsPane({ app, refreshToken }: { app: App; refreshToken?: number }) {
	const [query, setQuery] = useState("");
	const [kind, setKind] = useState<(typeof GEAR_KINDS)[number]>("all");
	void refreshToken;

	const plugin = getDaggerForgePlugin(app);
	const q = query.trim().toLowerCase();
	const gear = [...(plugin?.dataManager?.getItems() ?? []), ...ALL_GEAR].filter((g) => {
		if (kind !== "all" && g.kind !== kind) return false;
		if (q && !(g.name.toLowerCase().includes(q) || g.text.toLowerCase().includes(q) || g.meta.toLowerCase().includes(q))) return false;
		return true;
	});

	const insert = useCallback(async (item: GearData) => {
		const plg = getDaggerForgePlugin(app);
		if (!plg) return;
		const code = item.source === "custom" ? await encodeGearCode(item) : undefined;
		insertAtFocusedTarget(plg, buildItemEmbedBlock(item.id, code), { width: 420, height: 260 }, item.name);
	}, [app]);

	const deleteItem = useCallback(async (item: GearData) => {
		const plg = getDaggerForgePlugin(app);
		if (!plg) return;
		await plg.dataManager.deleteItemById(item.id);
		new Notice(`Deleted ${item.name}`);
	}, [app]);

	return (
		<>
			<input
				type="text"
				className="df-char-search"
				placeholder="Search items…"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			<select className="dropdown df-item-kind-filter" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Kind filter">
				{GEAR_KINDS.map((k) => (
					<option key={k} value={k}>{k === "all" ? "All kinds" : GEAR_KIND_LABELS[k]}</option>
				))}
			</select>
			<div className="df-adversary-results">
				{gear.length === 0
					? <p>No items match.</p>
					: gear.map((g) => (
						<div
							key={g.id}
							className="df-adversary-card df-gear-card"
							style={{ borderLeftColor: GEAR_KIND_COLORS[g.kind] }}
							onClick={() => insert(g)}
						>
							<p className="df-tier-text">
								{GEAR_KIND_LABELS[g.kind]}
								{g.tier !== null ? ` · Tier ${g.tier}` : ""}
								{g.rarity ? ` · ${g.rarity}` : ""}{" "}
								{g.source === "custom" && <span className="df-source-badge-custom">custom</span>}
							</p>
							{g.source === "custom" && (
								<LucideBtn icon="trash" title="Delete" cls="df-adv-delete-btn"
									onClick={(e: any) => { e.stopPropagation(); void deleteItem(g); }} />
							)}
							<h3 className="df-title-small-padding">{g.name}</h3>
							<p className="df-desc-small-padding">{g.meta}{g.meta && g.text ? " - " : ""}{g.text}</p>
						</div>
					))
				}
			</div>
		</>
	);
}

// ── Root App ──────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<BrowserTab, string> = {
	adversary:   "sword",
	environment: "mountain",
	character:   "user",
	item:        "backpack",
};

const TAB_LABELS: Record<BrowserTab, string> = {
	adversary:   "Adversaries",
	environment: "Environments",
	character:   "Characters",
	item:        "Items",
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
				{(["adversary", "environment", "character", "item"] as BrowserTab[]).map(tab => (
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
			<div className={`df-browser-pane${activeTab === "character" ? " df-browser-pane--active" : ""}`} data-pane="character">
				<CharacterPane app={app} refreshToken={refreshToken} />
			</div>
			<div className={`df-browser-pane${activeTab === "item" ? " df-browser-pane--active" : ""}`} data-pane="item">
				<ItemsPane app={app} refreshToken={refreshToken} />
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
