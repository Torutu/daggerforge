import { gameTerm } from "../../i18n/gameTerms";
import { translate as dfTranslate } from "../../i18n";
import { App, Modal, Notice } from "obsidian";
import { makeDraggable } from "../../utils/makeDraggable";
import { getDaggerForgePlugin } from "../../utils/index";
import { getAdversaries } from "../../data/adversaries";
import { getLanguage } from "../../i18n";
import { AdvData } from "../../types/index";
import { buildAdversaryEmbedBlock } from "../adversaries/AdversaryEmbed";
import { ConfirmModal } from "../characters/components/ConfirmModal";
import { encodeAdversaryCode } from "../embeds/embedCode";
import { insertAtFocusedTarget } from "../embeds/insertDestination";

// ── Icons ─────────────────────────────────────────────────────────────────────
const ZAP    = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const SLIDERS= `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>`;
const SWORDS = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/></svg>`;
const TRASH  = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
const X_SM   = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const WAND   = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>`;

// ── Data ──────────────────────────────────────────────────────────────────────
interface SpentItem {
	cost: number;
	label: string;
	/** Spend-option key, used to pair the slot with adversary suggestions. */
	category?: string;
	/** The adversary chosen for this slot - nothing is written to a note until
	 *  the Insert encounter button places the whole plan at once. */
	adversary?: AdvData;
}

interface EncounterState {
	baseBP: number;
	adjustments: { value: number; reason: string }[];
	spentItems: SpentItem[];
	pcCount: number;
	tier: string;   // "all" | "1".."4"
	source: string; // "all" | lowercase source name
}

const getAdjustments = () => [
	{ value: -1, label: dfTranslate("ui.less.difficult.shorter") },
	{ value: -2, label: dfTranslate("ui.2.solo.adversaries") },
	{ value: -2, label: dfTranslate("ui.1d4.or.2.damage") },
	{ value:  1, label: dfTranslate("ui.lower.tier.adversary") },
	{ value:  1, label: dfTranslate("ui.no.bruisers.hordes.leaders.solos") },
	{ value:  2, label: dfTranslate("ui.more.dangerous.longer") },
];

const getSpendOptions = () => [
	{ cost: 1, key: "minion",   label: dfTranslate("ui.minions.party.size"),              match: /minion/i },
	{ cost: 1, key: "social",   label: dfTranslate("ui.social.support"),                  match: /social|support/i },
	{ cost: 2, key: "standard", label: dfTranslate("ui.horde.ranged.skulk.standard"), match: /horde|ranged|skulk|standard/i },
	{ cost: 3, key: "leader",   label: dfTranslate("ui.leader"),                            match: /leader/i },
	{ cost: 4, key: "bruiser",  label: dfTranslate("ui.bruiser"),                           match: /bruiser/i },
	{ cost: 5, key: "solo",     label: dfTranslate("ui.solo"),                              match: /solo/i },
];

const capitalize = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);

// ── Modal ─────────────────────────────────────────────────────────────────────
export class EncounterCalcModal extends Modal {
	private state: EncounterState = {
		baseBP: 0,
		adjustments: [],
		spentItems: [],
		pcCount: 3,
		tier: "all",
		source: "all",
	};

	constructor(app: App) {
		super(app);
		this.titleEl.setText(dfTranslate("ui.battle.calculator"));
	}

	/** Custom adversaries first (they shadow bundled ids), then the bundled list. */
	private allAdversaries(): AdvData[] {
		const plugin = getDaggerForgePlugin(this.app);
		const custom = plugin?.dataManager?.getAdversaries() ?? [];
		return [...custom, ...getAdversaries(getLanguage())];
	}

	onOpen(): void {
		makeDraggable(this.modalEl, this.modalEl);
		this.modalEl.addClass("df-enc-modal");

		const { contentEl } = this;
		contentEl.addClass("df-enc-content");

		// ── Header row ────────────────────────────────────────────────────
		const headerRow = contentEl.createEl("div", { cls: "df-enc-header-row" });

		const pcGroup = headerRow.createEl("div", { cls: "df-enc-pc-group" });
		pcGroup.createEl("label", { cls: "df-enc-label", text: dfTranslate("ui.number.of.pcs") });
		const pcInput = pcGroup.createEl("input", { cls: "df-enc-pc-input" }) as HTMLInputElement;
		pcInput.type = "number";
		pcInput.min = "1";
		pcInput.max = "10";
		pcInput.value = this.state.pcCount.toString();

		const calcBtn = headerRow.createEl("button", { cls: "df-enc-calc-btn" });
		calcBtn.innerHTML = `${ZAP}<span>${dfTranslate("enc.calculate")}</span>`;

		// ── Stats bar ─────────────────────────────────────────────────────
		const statsBar = contentEl.createEl("div", { cls: "df-enc-stats" });
		const makeStatEl = (label: string, cls = "") => {
			const chip = statsBar.createEl("div", { cls: `df-enc-stat ${cls}` });
			chip.createEl("span", { cls: "df-enc-stat-label", text: label });
			const val = chip.createEl("span", { cls: "df-enc-stat-value", text: "0" });
			return val;
		};
		const svBase      = makeStatEl(dfTranslate("enc.base.bp"));
		const svAdj       = makeStatEl(dfTranslate("enc.adjustments"));
		const svSpent     = makeStatEl(dfTranslate("enc.spent"));
		const svRemaining = makeStatEl(dfTranslate("enc.remaining"), "df-enc-stat--highlight");

		// ── Log columns ───────────────────────────────────────────────────
		const columnsDiv = contentEl.createEl("div", { cls: "df-enc-columns" });

		const adjCol = columnsDiv.createEl("div", { cls: "df-enc-column" });
		const adjColHead = adjCol.createEl("div", { cls: "df-enc-col-header" });
		adjColHead.innerHTML = `${SLIDERS}<span>${dfTranslate("enc.adjustments")}</span>`;
		const adjustmentsList = adjCol.createEl("div", { cls: "df-enc-log" });

		const spendCol = columnsDiv.createEl("div", { cls: "df-enc-column" });
		const spendColHead = spendCol.createEl("div", { cls: "df-enc-col-header" });
		spendColHead.innerHTML = `${SWORDS}<span>${dfTranslate("enc.spending")}</span>`;
		const spendingList = spendCol.createEl("div", { cls: "df-enc-log" });

		// ── Adjustment buttons ────────────────────────────────────────────
		const adjSection = contentEl.createEl("div", { cls: "df-enc-section" });
		const adjHead = adjSection.createEl("div", { cls: "df-enc-section-label" });
		adjHead.innerHTML = `${SLIDERS}<span>${dfTranslate("enc.adjust.battle.points")}</span>`;
		const adjGrid = adjSection.createEl("div", { cls: "df-enc-btn-grid" });
		getAdjustments().forEach(adj => {
			const btn = adjGrid.createEl("button", { cls: "df-enc-action-btn" });
			btn.setAttribute("data-adjust", adj.value.toString());
			btn.createEl("span", { cls: "df-enc-btn-label", text: adj.label });
			btn.createEl("span", {
				cls: `df-enc-badge ${adj.value > 0 ? "df-enc-badge--pos" : "df-enc-badge--neg"}`,
				text: adj.value > 0 ? `+${adj.value}` : `${adj.value}`,
			});
		});

		// ── Spend buttons ─────────────────────────────────────────────────
		const spendSection = contentEl.createEl("div", { cls: "df-enc-section" });
		const spendHead = spendSection.createEl("div", { cls: "df-enc-section-label" });
		spendHead.innerHTML = `${SWORDS}<span>${dfTranslate("enc.spend.battle.points")}</span>`;
		const spendGrid = spendSection.createEl("div", { cls: "df-enc-btn-grid" });
		getSpendOptions().forEach(opt => {
			const btn = spendGrid.createEl("button", { cls: "df-enc-action-btn" });
			btn.setAttribute("data-cost", opt.cost.toString());
			btn.setAttribute("data-key", opt.key);
			btn.createEl("span", { cls: "df-enc-btn-label", text: opt.label });
			btn.createEl("span", { cls: "df-enc-badge df-enc-badge--cost", text: `-${opt.cost}` });
		});

		// ── Suggestions ───────────────────────────────────────────────────
		const sugSection = contentEl.createEl("div", { cls: "df-enc-section" });
		const sugHead = sugSection.createEl("div", { cls: "df-enc-section-label" });
		sugHead.innerHTML = `${WAND}<span>${dfTranslate("enc.suggested.adversaries")}</span>`;

		const filterRow = sugSection.createEl("div", { cls: "df-enc-suggest-filters" });
		const tierSelect = filterRow.createEl("select", { cls: "dropdown df-enc-suggest-select" });
		tierSelect.createEl("option", { text: dfTranslate("ui.any.tier"), value: "all" });
		["1", "2", "3", "4"].forEach(t => tierSelect.createEl("option", { text: `${dfTranslate("ui.tier")} ${t}`, value: t }));

		const sourceSelect = filterRow.createEl("select", { cls: "dropdown df-enc-suggest-select" });
		sourceSelect.createEl("option", { text: dfTranslate("ui.any.source"), value: "all" });
		const sources = new Set<string>(getAdversaries(getLanguage()).map(a => (a.source || "core").toLowerCase()));
		sources.add("custom");
		[...sources].sort().forEach(s => sourceSelect.createEl("option", { text: capitalize(s), value: s }));

		const sugList = sugSection.createEl("div", { cls: "df-enc-suggest" });

		const insertRow = sugSection.createEl("div", { cls: "df-enc-insert-row" });
		const insertBtn = insertRow.createEl("button", { cls: "mod-cta df-enc-insert-btn", text: dfTranslate("ui.insert.encounter") });
		const insertNote = insertRow.createEl("span", { cls: "df-enc-insert-note" });

		// ── Footer ────────────────────────────────────────────────────────
		const footer = contentEl.createEl("div", { cls: "df-enc-footer" });
		const clearBtn = footer.createEl("button", { cls: "df-enc-clear-btn" });
		clearBtn.innerHTML = `${TRASH}<span>${dfTranslate("enc.clear.all")}</span>`;

		// ── Logic ─────────────────────────────────────────────────────────
		const totals = () => {
			const adj   = this.state.adjustments.reduce((s, a) => s + a.value, 0);
			const spent = this.state.spentItems.reduce((s, i) => s + i.cost, 0);
			return { adj, spent, remaining: this.state.baseBP + adj - spent };
		};

		/** The choices made in the calculator, as a markdown callout - printed
		 *  into the note/canvas once, before the first inserted adversary, so
		 *  the encounter can be read back later. */
		const buildSummaryMarkdown = (): string => {
			const scope = [dfTranslate("enc.pcCount", { count: this.state.pcCount })];
			if (this.state.tier !== "all") scope.push(`${dfTranslate("ui.tier")} ${this.state.tier}`);
			if (this.state.source !== "all") scope.push(capitalize(this.state.source));
			const lines = [`> [!note] ${dfTranslate("enc.plan", { scope: scope.join(" · ") })}`];
			lines.push(`> - ${dfTranslate("enc.base", { count: this.state.baseBP })}`);
			this.state.adjustments.forEach(a =>
				lines.push(`> - ${a.reason} (${a.value >= 0 ? "+" : ""}${a.value})`),
			);
			this.state.spentItems.forEach(s =>
				lines.push(`> - ${s.label}${s.adversary ? ` - ${s.adversary.name}` : ""} (−${s.cost})`),
			);
			lines.push(`> - ${dfTranslate("enc.remaining", { count: totals().remaining })}`);
			return lines.join("\n") + "\n";
		};

		/** Assign a suggested adversary to the first open slot of its category -
		 *  nothing is written until Insert encounter. Choosing beyond the plan
		 *  spends the points for a new, already-filled slot. */
		const chooseSuggestion = (adv: AdvData, opt: ReturnType<typeof getSpendOptions>[number]) => {
			const slot = this.state.spentItems.find(s => s.category === opt.key && !s.adversary);
			if (slot) slot.adversary = adv;
			else this.state.spentItems.push({ cost: opt.cost, label: opt.label, category: opt.key, adversary: adv });
			updateDisplay();
		};

		/** Write the whole plan into the focused note/canvas: the summary
		 *  callout first, then every chosen adversary. Finalizing clears the
		 *  calculator for the next encounter. */
		const insertEncounter = async () => {
			const chosen = this.state.spentItems.filter(s => s.adversary);
			if (chosen.length === 0) return;
			const plugin = getDaggerForgePlugin(this.app);
			if (!plugin) {
				new Notice(dfTranslate("ui.open.a.note.or.canvas.first"));
				return;
			}
			if (!insertAtFocusedTarget(plugin, buildSummaryMarkdown(), { width: 440, height: 280 }, undefined, true)) {
				return; // no target - keep the plan so nothing is lost
			}

			// The same adversary picked for several slots prints as ONE card with
			// that many HP/stress rows (like the browser's battle counter), not
			// as duplicate cards. Minion slots contribute a party-sized group each.
			const groups = new Map<string, { adv: AdvData; count: number }>();
			for (const slot of chosen) {
				const adv = slot.adversary!;
				if (!adv.id) continue;
				const perSlot = slot.category === "minion" ? Math.max(1, this.state.pcCount) : 1;
				const group = groups.get(adv.id);
				if (group) group.count += perSlot;
				else groups.set(adv.id, { adv, count: perSlot });
			}
			for (const { adv, count } of groups.values()) {
				const isCustom = (adv.source ?? "").toLowerCase() === "custom" || adv.id!.startsWith("CUA_");
				const code = isCustom ? await encodeAdversaryCode(adv) : undefined;
				insertAtFocusedTarget(
					plugin,
					buildAdversaryEmbedBlock(adv.id!, count > 1 ? count : undefined, code),
					{ width: 460, height: 620 },
					undefined,
					true,
				);
			}
			new Notice(dfTranslate("enc.inserted", { count: chosen.length, cards: groups.size }));

			// Finalized - reset for the next encounter (same party size)
			this.state.baseBP      = 3 * this.state.pcCount + 2;
			this.state.adjustments = [];
			this.state.spentItems  = [];
			updateDisplay();
		};

		const confirmAndInsert = () => {
			const { remaining } = totals();
			if (remaining <= 0) {
				void insertEncounter();
				return;
			}
			new ConfirmModal(this.app, {
				title: dfTranslate("ui.insert.with.unspent.battle.points"),
				message: dfTranslate("enc.unspentWarning", { count: remaining }),
				confirmLabel: dfTranslate("ui.insert.anyway"),
				onConfirm: () => void insertEncounter(),
			}).open();
		};

		const renderSuggestions = () => {
			sugList.empty();

			const planKeys: string[] = [];
			this.state.spentItems.forEach(s => {
				if (s.category && !planKeys.includes(s.category)) planKeys.push(s.category);
			});

			if (planKeys.length === 0) {
				sugList.createEl("p", {
					cls: "df-enc-suggest-hint",
					text: dfTranslate("ui.spend.battle.points.above.and.matching.adversaries.will.be.suggested.here"),
				});
				return;
			}

			const pool = this.allAdversaries();
			planKeys.forEach(key => {
				const opt = getSpendOptions().find(o => o.key === key);
				if (!opt) return;
				const slots = this.state.spentItems.filter(s => s.category === key);
				const done = slots.filter(s => s.adversary).length;

				const matches = pool
					.filter(a => opt.match.test(a.type || ""))
					.filter(a => this.state.tier === "all" || String(a.tier) === this.state.tier)
					.filter(a => this.state.source === "all" || (a.source || "core").toLowerCase() === this.state.source)
					.sort((a, b) => a.name.localeCompare(b.name));

				const group = sugList.createEl("div", { cls: "df-enc-suggest-group" });
				const head = group.createEl("div", { cls: "df-enc-suggest-group-head" });
				head.createEl("span", { text: opt.label });
				head.createEl("span", {
					cls: "df-enc-suggest-progress" + (done >= slots.length ? " is-done" : ""),
					text: done >= slots.length ? `${done}/${slots.length} ✓` : dfTranslate("enc.chosen", { done, total: slots.length }),
				});

				if (matches.length === 0) {
					group.createEl("p", { cls: "df-enc-suggest-hint", text: dfTranslate("ui.no.adversaries.match.these.filters") });
					return;
				}

				const makeChips = (parent: HTMLElement, advs: AdvData[]) => {
					const chips = parent.createEl("div", { cls: "df-enc-suggest-chips" });
					advs.forEach(adv => {
						const picks = slots.filter(s => s.adversary?.id === adv.id).length;
						const chip = chips.createEl("button", {
							cls: "df-enc-suggest-chip" + (picks > 0 ? " is-selected" : ""),
						});
						if (picks > 0) chip.createEl("span", { cls: "df-enc-chip-check", text: picks > 1 ? `✓×${picks}` : "✓" });
						chip.createEl("span", { text: adv.name });
						chip.createEl("span", { cls: "df-enc-chip-tier", text: `T${adv.tier}` });
						chip.title = dfTranslate("enc.chooseSlot", { type: gameTerm(adv.type), source: gameTerm(adv.source || "core") });
						chip.addEventListener("click", () => chooseSuggestion(adv, opt));
					});
				};

				// Combined categories (Social/Support, Horde/Ranged/Skulk/Standard):
				// split the chips per actual type behind thin labeled dividers, so a
				// Ranged pick can't be mistaken for a Skulk.
				const subTypes = new Map<string, AdvData[]>();
				matches.forEach(adv => {
					const base = capitalize(((adv.type || "").split("(")[0].trim() || "Other").toLowerCase());
					if (!subTypes.has(base)) subTypes.set(base, []);
					subTypes.get(base)!.push(adv);
				});

				if (subTypes.size <= 1) {
					makeChips(group, matches);
					return;
				}
				[...subTypes.keys()].sort().forEach(typeName => {
					const sub = group.createEl("div", { cls: "df-enc-suggest-subhead" });
					sub.createEl("span", { cls: "df-enc-suggest-subtype", text: gameTerm(typeName) });
					makeChips(group, subTypes.get(typeName)!);
				});
			});
		};

		const updateDisplay = () => {
			// Adjustment log
			adjustmentsList.empty();
			this.state.adjustments.forEach((a, i) => {
				const row = adjustmentsList.createEl("div", { cls: "df-enc-log-row" });
				row.createEl("span", { cls: "df-enc-log-text", text: a.reason });
				row.createEl("span", {
					cls: `df-enc-log-val ${a.value >= 0 ? "df-enc-pos" : "df-enc-neg"}`,
					text: a.value >= 0 ? `+${a.value}` : `${a.value}`,
				});
				const rm = row.createEl("button", { cls: "df-enc-remove-btn" });
				rm.innerHTML = X_SM;
				rm.addEventListener("click", () => { this.state.adjustments.splice(i, 1); updateDisplay(); });
			});

			// Spending log
			spendingList.empty();
			this.state.spentItems.forEach((item, i) => {
				const row = spendingList.createEl("div", { cls: "df-enc-log-row" + (item.adversary ? " df-enc-log-row--done" : "") });
				if (item.adversary) row.createEl("span", { cls: "df-enc-log-tick", text: "✓" });
				row.createEl("span", {
					cls: "df-enc-log-text",
					text: item.adversary ? `${item.label} - ${item.adversary.name}` : item.label,
				});
				row.createEl("span", { cls: "df-enc-log-val df-enc-neg", text: `-${item.cost}` });
				const rm = row.createEl("button", { cls: "df-enc-remove-btn" });
				rm.innerHTML = X_SM;
				rm.title = item.adversary ? dfTranslate("ui.dynamic.clear.the.chosen.adversary") : dfTranslate("ui.dynamic.remove.this.slot");
				// First click clears the pick, second removes the slot entirely
				rm.addEventListener("click", () => {
					if (item.adversary) item.adversary = undefined;
					else this.state.spentItems.splice(i, 1);
					updateDisplay();
				});
			});

			// Stats
			const { adj, spent, remaining } = totals();
			svBase.textContent      = this.state.baseBP.toString();
			svAdj.textContent       = adj >= 0 ? `+${adj}` : `${adj}`;
			svSpent.textContent     = spent.toString();
			svRemaining.textContent = remaining.toString();
			svRemaining.className = `df-enc-stat-value df-enc-stat-big ${remaining < 0 ? "df-enc-neg" : remaining > 0 ? "df-enc-pos" : ""}`;

			adjustmentsList.scrollTop = adjustmentsList.scrollHeight;
			spendingList.scrollTop    = spendingList.scrollHeight;

			// Insert button reflects the plan: enabled once anything is chosen
			const chosenCount = this.state.spentItems.filter(s => s.adversary).length;
			insertBtn.disabled = chosenCount === 0;
			insertNote.textContent =
				chosenCount === 0
					? dfTranslate("ui.dynamic.choose.adversaries.above.then.insert.them.all.at.once")
					: remaining > 0
						? dfTranslate("enc.unspent", { count: remaining })
						: dfTranslate("enc.ready", { count: chosenCount });

			renderSuggestions();
		};

		// Events
		insertBtn.addEventListener("click", confirmAndInsert);

		calcBtn.addEventListener("click", () => {
			this.state.pcCount     = Number(pcInput.value);
			this.state.baseBP      = 3 * this.state.pcCount + 2;
			this.state.adjustments = [];
			this.state.spentItems  = [];
			updateDisplay();
		});

		contentEl.querySelectorAll("[data-adjust]").forEach(btn => {
			btn.addEventListener("click", () => {
				const val    = parseInt((btn as HTMLElement).dataset.adjust!);
				const reason = (btn as HTMLElement).querySelector(".df-enc-btn-label")?.textContent ?? "";
				this.state.adjustments.push({ value: val, reason });
				updateDisplay();
			});
		});

		contentEl.querySelectorAll("[data-cost]").forEach(btn => {
			btn.addEventListener("click", () => {
				const cost  = parseInt((btn as HTMLElement).dataset.cost!);
				const key   = (btn as HTMLElement).dataset.key;
				const label = (btn as HTMLElement).querySelector(".df-enc-btn-label")?.textContent ?? "";
				this.state.spentItems.push({ cost, label, category: key });
				updateDisplay();
			});
		});

		tierSelect.addEventListener("change", () => { this.state.tier = tierSelect.value; renderSuggestions(); });
		sourceSelect.addEventListener("change", () => { this.state.source = sourceSelect.value; renderSuggestions(); });

		clearBtn.addEventListener("click", () => {
			this.state = {
				...this.state,
				baseBP: 0,
				adjustments: [],
				spentItems: [],
				pcCount: Number(pcInput.value),
			};
			updateDisplay();
		});

		pcInput.addEventListener("change", () => { this.state.pcCount = Number(pcInput.value); });

		updateDisplay();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** @deprecated use EncounterCalcModal */
export function openEncounterCalculator(app: App): void {
	new EncounterCalcModal(app).open();
}
