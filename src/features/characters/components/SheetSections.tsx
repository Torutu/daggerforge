import { useLanguage as useUiLanguage } from "../../../i18n/react";
import { gameTerm } from "../../../i18n/gameTerms";
import { translate as dfTranslate } from "../../../i18n";
import React, { useState } from "react";
import {
	CharacterData,
	CharacterDomainCard,
	CharacterWeapon,
	EXPERIENCE_ROWS,
	HOPE_SLOTS,
	hopeSlotCount,
	HP_SLOTS,
	SheetSettings,
	STRESS_SLOTS,
	TRAIT_NAMES,
	trackSlotCount,
	TRAIT_VERBS,
	TraitName,
} from "../../../types/character";
import { DOMAIN_COLORS } from "../../../types/srd";
import { CardText } from "./CardText";
import { DomainIcon } from "./DomainArt";
import {
	ArmorShieldArt,
	EvasionShieldArt,
	ExperienceCapArt,
	GoldBagArt,
	GoldChestArt,
	GoldHandfulArt,
	HandArt,
	HopeDiamondArt,
	LevelBadgeArt,
	MiniShieldArt,
	ThresholdArrowArt,
	TraitShieldArt,
} from "./SheetArt";
import {
	CogNumber,
	CogPanel,
	FieldBox,
	LabeledCheck,
	LineField,
	LineTextarea,
	SectionBanner,
	SectionCog,
	SlotToggle,
	ZapIcon,
} from "./SheetFields";

/** Every section edits the character through a single partial-update callback. */
export interface SectionProps {
	char: CharacterData;
	update: (patch: Partial<CharacterData>) => void;
}

function toggleAt(list: boolean[], index: number): boolean[] {
	return list.map((v, i) => (i === index ? !v : v));
}

/** Merges a partial settings patch into the character. */
function patchSettings(
	char: CharacterData,
	update: SectionProps["update"],
	patch: Partial<SheetSettings>,
	extra: Partial<CharacterData> = {},
): void {
	update({ sheetSettings: { ...char.sheetSettings, ...patch }, ...extra });
}

// ── Header ────────────────────────────────────────────────────────────────────

export function SheetHeader({ char, update }: SectionProps) {
	useUiLanguage();
	return (
		<div className="df-cs-header">
			<div className="df-cs-header-logo">
				<span className="df-cs-header-logo-title">Daggerheart</span>
				<span className="df-cs-header-logo-sub">{dfTranslate("ui.character.sheet")}</span>
			</div>
			<div className="df-cs-header-fields">
				<FieldBox label={dfTranslate("ui.name")} value={char.name} onChange={(v) => update({ name: v })} />
				<FieldBox label={dfTranslate("ui.pronouns")} value={char.pronouns} onChange={(v) => update({ pronouns: v })} />
				<FieldBox label={dfTranslate("ui.heritage")} value={char.heritage} onChange={(v) => update({ heritage: v })} />
				<FieldBox
					label={dfTranslate("ui.class.subclass")}
					value={char.classSubclass}
					onChange={(v) => update({ classSubclass: v })}
				/>
			</div>
			<div className="df-cs-level">
				<LevelBadgeArt />
				<input
					type="text"
					className="df-cs-level-input"
					value={char.level}
					onChange={(e) => update({ level: e.target.value })}
					aria-label={dfTranslate("ui.level")}
				/>
				<span className="df-cs-level-label">{dfTranslate("ui.level")}</span>
			</div>
		</div>
	);
}

// ── Evasion, armor, and traits row ────────────────────────────────────────────

export function StatsRow({ char, update }: SectionProps) {
	useUiLanguage();
	return (
		<div className="df-cs-stats-row">
			<div className="df-cs-defenses">
				<div className="df-cs-defense">
					<EvasionShieldArt />
					<input
						type="text"
						className="df-cs-defense-input df-cs-defense-input--evasion"
						value={char.evasion}
						onChange={(e) => update({ evasion: e.target.value })}
						aria-label={dfTranslate("ui.evasion")}
					/>
					<span className="df-cs-defense-label df-cs-defense-label--evasion">{dfTranslate("ui.evasion")}</span>
				</div>
				<div className="df-cs-defense-divider" />
				<div className="df-cs-defense">
					<ArmorShieldArt />
					<input
						type="text"
						className="df-cs-defense-input df-cs-defense-input--armor"
						value={char.armorScore}
						onChange={(e) => update({ armorScore: e.target.value })}
						aria-label={dfTranslate("ui.armor")}
					/>
					<span className="df-cs-defense-label df-cs-defense-label--armor">{dfTranslate("ui.armor")}</span>
				</div>
				<div className="df-cs-armor-slots">
					{char.armorSlots.map((on, i) => (
						<SlotToggle
							key={i}
							on={on}
							onToggle={() => update({ armorSlots: toggleAt(char.armorSlots, i) })}
							label={`Armor slot ${i + 1}`}
						>
							<MiniShieldArt />
						</SlotToggle>
					))}
				</div>
			</div>
			<div className="df-cs-traits">
				{TRAIT_NAMES.map((name) => (
					<TraitCard key={name} name={name} char={char} update={update} />
				))}
			</div>
		</div>
	);
}

function TraitCard({ name, char, update }: SectionProps & { name: TraitName }) {
	useUiLanguage();
	const trait = char.traits[name];
	const setTrait = (patch: Partial<typeof trait>) =>
		update({ traits: { ...char.traits, [name]: { ...trait, ...patch } } });

	return (
		<div className="df-cs-trait">
			<div className="df-cs-trait-pill">
				<span className="df-cs-trait-name">{gameTerm(name)}</span>
				<button
					type="button"
					className={"df-cs-trait-mark" + (trait.marked ? " is-on" : "")}
					aria-pressed={trait.marked}
					aria-label={dfTranslate("sheet.trait.mark", { name: gameTerm(name) })}
					onClick={() => setTrait({ marked: !trait.marked })}
				/>
			</div>
			<div className="df-cs-trait-shield">
				<TraitShieldArt />
				<input
					type="text"
					className="df-cs-trait-input"
					value={trait.value}
					onChange={(e) => setTrait({ value: e.target.value })}
					aria-label={dfTranslate("sheet.trait.value", { name: gameTerm(name) })}
				/>
			</div>
			<div className="df-cs-trait-verbs">
				{TRAIT_VERBS[name].map((verb) => (
					<span key={verb}>{gameTerm(verb)}</span>
				))}
			</div>
		</div>
	);
}

// ── Damage & health ───────────────────────────────────────────────────────────

export function DamageHealthSection({ char, update }: SectionProps) {
	useUiLanguage();
	const [cogOpen, setCogOpen] = useState(false);
	const settings = char.sheetSettings;

	// Resizes the track to full lines of 12, keeping marks that still fit
	const setMaxHp = (n: number) =>
		patchSettings(char, update, { maxHp: n }, {
			hp: Array.from({ length: trackSlotCount(n, HP_SLOTS) }, (_, i) => char.hp[i] ?? false),
		});
	const setMaxStress = (n: number) =>
		patchSettings(char, update, { maxStress: n }, {
			stress: Array.from({ length: trackSlotCount(n, STRESS_SLOTS) }, (_, i) => char.stress[i] ?? false),
		});

	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.damage.health")} />
			<SectionCog open={cogOpen} onToggle={() => setCogOpen(!cogOpen)} />
			{cogOpen && (
				<CogPanel>
					<LabeledCheck
						label={dfTranslate("ui.massive.damage.mark.4.hp")}
						on={settings.massiveDamage}
						onToggle={() => patchSettings(char, update, { massiveDamage: !settings.massiveDamage })}
					/>
					<CogNumber
						label={dfTranslate("ui.max.hp")}
						value={settings.maxHp}
						min={1}
						max={24}
						onChange={setMaxHp}
					/>
					<CogNumber
						label={dfTranslate("ui.max.stress")}
						value={settings.maxStress}
						min={1}
						max={24}
						onChange={setMaxStress}
					/>
				</CogPanel>
			)}
			<p className="df-cs-hint">{dfTranslate("ui.add.your.current.level.to.your.damage.thresholds")}</p>
			<div className={"df-cs-thresholds" + (settings.massiveDamage ? " df-cs-thresholds--massive" : "")}>
				<ThresholdBlock title={dfTranslate("ui.minor.damage")} caption={dfTranslate("sheet.markHp", { count: 1 })} />
				<ThresholdGap
					value={char.majorThreshold}
					onChange={(v) => update({ majorThreshold: v })}
					label={dfTranslate("ui.major.damage.threshold")}
				/>
				<ThresholdBlock title={dfTranslate("ui.major.damage")} caption={dfTranslate("sheet.markHp", { count: 2 })} />
				<ThresholdGap
					value={char.severeThreshold}
					onChange={(v) => update({ severeThreshold: v })}
					label={dfTranslate("ui.severe.damage.threshold")}
				/>
				<ThresholdBlock title={dfTranslate("ui.severe.damage")} caption={dfTranslate("sheet.markHp", { count: 3 })} />
				{settings.massiveDamage && (
					<>
						<MassiveThresholdGap severeThreshold={char.severeThreshold} />
						<ThresholdBlock title={dfTranslate("ui.massive.damage")} caption={dfTranslate("sheet.markHp", { count: 4 })} />
					</>
				)}
			</div>
			<TrackRow
				label={dfTranslate("ui.hp")}
				slots={char.hp}
				solidCount={settings.maxHp}
				onToggle={(i) => update({ hp: toggleAt(char.hp, i) })}
			/>
			<TrackRow
				label={dfTranslate("ui.stress")}
				slots={char.stress}
				solidCount={settings.maxStress}
				onToggle={(i) => update({ stress: toggleAt(char.stress, i) })}
			/>
		</section>
	);
}

function ThresholdBlock({ title, caption }: { title: string; caption: string }) {
	useUiLanguage();
	return (
		<div className="df-cs-threshold-block">
			<span className="df-cs-threshold-title">{title}</span>
			<span className="df-cs-threshold-caption">{caption}</span>
		</div>
	);
}

function ThresholdGap({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (value: string) => void;
	label: string;
}) {
	useUiLanguage();
	return (
		<div className="df-cs-threshold-gap">
			<ThresholdArrowArt />
			<input
				type="text"
				className="df-cs-threshold-input"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-label={label}
			/>
		</div>
	);
}

/** Massive Damage is always double the Severe threshold - computed, not typed. */
function MassiveThresholdGap({ severeThreshold }: { severeThreshold: string }) {
	useUiLanguage();
	const severe = Number(severeThreshold);
	const massive =
		severeThreshold.trim() !== "" && Number.isFinite(severe) ? String(severe * 2) : "";
	return (
		<div className="df-cs-threshold-gap" title={dfTranslate("ui.double.the.severe.threshold")}>
			<ThresholdArrowArt />
			<input
				type="text"
				className="df-cs-threshold-input"
				value={massive}
				readOnly
				tabIndex={-1}
				aria-label={dfTranslate("ui.massive.damage.threshold.double.severe")}
			/>
		</div>
	);
}

function TrackRow({
	label,
	slots,
	solidCount,
	onToggle,
}: {
	label: string;
	slots: boolean[];
	solidCount: number;
	onToggle: (index: number) => void;
}) {
	useUiLanguage();
	// Like hope strips: more than 12 slots wrap onto extra lines of 12
	const lines: boolean[][] = [];
	for (let start = 0; start < slots.length; start += HP_SLOTS) {
		lines.push(slots.slice(start, start + HP_SLOTS));
	}

	return (
		<div className="df-cs-track">
			<span className="df-cs-track-label">{label}</span>
			<div className="df-cs-track-lines">
				{lines.map((line, lineIndex) => (
					<div key={lineIndex} className="df-cs-track-slots">
						{line.map((on, j) => {
							const i = lineIndex * HP_SLOTS + j;
							return (
								<SlotToggle
									key={i}
									on={on}
									onToggle={() => onToggle(i)}
									label={`${label} ${i + 1}`}
									className={"df-cs-track-slot" + (i >= solidCount ? " df-cs-track-slot--dashed" : "")}
								/>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}

// ── Hope ──────────────────────────────────────────────────────────────────────

export function HopeSection({ char, update }: SectionProps) {
	useUiLanguage();
	const [cogOpen, setCogOpen] = useState(false);
	const maxHope = char.sheetSettings.maxHope;

	// Resizes the slots to full strips of 6 and clears marks beyond the new max
	const setMaxHope = (n: number) =>
		patchSettings(char, update, { maxHope: n }, {
			hope: Array.from({ length: hopeSlotCount(n) }, (_, i) => i < n && (char.hope[i] ?? false)),
		});

	// One strip per 6 diamonds - more than 6 Hope wraps onto extra lines
	const strips: boolean[][] = [];
	for (let start = 0; start < char.hope.length; start += HOPE_SLOTS) {
		strips.push(char.hope.slice(start, start + HOPE_SLOTS));
	}

	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.hope")} />
			<SectionCog open={cogOpen} onToggle={() => setCogOpen(!cogOpen)} />
			{cogOpen && (
				<CogPanel>
					<CogNumber label={dfTranslate("ui.max.hope")} value={maxHope} min={0} max={24} onChange={setMaxHope} />
				</CogPanel>
			)}
			<p className="df-cs-hint">{dfTranslate("ui.spend.a.hope.to.use.an.experience.or.help.an.ally")}</p>
			{strips.map((strip, stripIndex) => (
				<div key={stripIndex} className="df-cs-hope-strip">
					{strip.map((on, j) => {
						const i = stripIndex * HOPE_SLOTS + j;
						const locked = i >= maxHope;
						return (
							<React.Fragment key={i}>
								{j > 0 && <span className="df-cs-hope-sep" />}
								<SlotToggle
									on={on}
									onToggle={() => {
										if (!locked) update({ hope: toggleAt(char.hope, i) });
									}}
									label={locked ? `Hope ${i + 1} (locked)` : `Hope ${i + 1}`}
									className={locked ? "df-cs-slot--locked" : undefined}
								>
									<HopeDiamondArt />
								</SlotToggle>
							</React.Fragment>
						);
					})}
				</div>
			))}
			<LineField
				label={dfTranslate("ui.hope.feature")}
				value={char.hopeFeature}
				onChange={(v) => update({ hopeFeature: v })}
			/>
		</section>
	);
}

// ── Experience ────────────────────────────────────────────────────────────────

export function ExperienceSection({ char, update }: SectionProps) {
	useUiLanguage();
	const [cogOpen, setCogOpen] = useState(false);

	const setExperience = (index: number, field: "text" | "modifier", value: string) =>
		update({
			experiences: char.experiences.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
		});

	// Changing the row count grows/shrinks the experiences list to match
	const setRows = (n: number) =>
		patchSettings(char, update, { experienceRows: n }, {
			experiences: Array.from(
				{ length: n },
				(_, i) => char.experiences[i] ?? { text: "", modifier: "" },
			),
		});

	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.experience")} />
			<SectionCog open={cogOpen} onToggle={() => setCogOpen(!cogOpen)} />
			{cogOpen && (
				<CogPanel>
					<CogNumber
						label={dfTranslate("ui.rows")}
						value={char.sheetSettings.experienceRows}
						min={EXPERIENCE_ROWS}
						max={20}
						onChange={setRows}
					/>
				</CogPanel>
			)}
			<div className="df-cs-experiences">
				{char.experiences.map((exp, i) => (
					<div key={i} className="df-cs-experience-row">
						<input
							type="text"
							className="df-cs-experience-text"
							value={exp.text}
							onChange={(e) => setExperience(i, "text", e.target.value)}
							aria-label={`Experience ${i + 1}`}
						/>
						<div className="df-cs-experience-mod">
							<ExperienceCapArt />
							<input
								type="text"
								className="df-cs-experience-mod-input"
								value={exp.modifier}
								onChange={(e) => setExperience(i, "modifier", e.target.value)}
								aria-label={`Experience ${i + 1} modifier`}
							/>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ── Gold ──────────────────────────────────────────────────────────────────────

export function GoldSection({ char, update }: SectionProps) {
	useUiLanguage();
	const [cogOpen, setCogOpen] = useState(false);
	const settings = char.sheetSettings;
	const custom = settings.goldMode === "custom";

	const setCurrency = (index: number, field: "name" | "amount", value: string) =>
		patchSettings(char, update, {
			currencies: settings.currencies.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
		});

	return (
		<section className="df-cs-box df-cs-gold">
			<h3 className="df-cs-plain-title">{custom ? settings.goldLabel || "Gold" : "Gold"}</h3>
			<SectionCog open={cogOpen} onToggle={() => setCogOpen(!cogOpen)} />
			{cogOpen && (
				<CogPanel>
					<LabeledCheck
						label={dfTranslate("ui.custom.currencies")}
						on={custom}
						onToggle={() =>
							patchSettings(char, update, {
								goldMode: custom ? "standard" : "custom",
								currencies:
									!custom && settings.currencies.length === 0
										? [{ name: dfTranslate("ui.coins"), amount: "" }]
										: settings.currencies,
							})
						}
					/>
					{custom && (
						<label className="df-cs-cog-field">
							{dfTranslate("ui.title")}<input
								type="text"
								className="df-cs-cog-text"
								value={settings.goldLabel}
								onChange={(e) => patchSettings(char, update, { goldLabel: e.target.value })}
							/>
						</label>
					)}
				</CogPanel>
			)}
			{custom ? (
				<div className="df-cs-currencies">
					{settings.currencies.map((currency, i) => (
						<div key={i} className="df-cs-currency-row">
							<input
								type="text"
								className="df-cs-currency-name"
								placeholder={dfTranslate("ui.currency")}
								value={currency.name}
								onChange={(e) => setCurrency(i, "name", e.target.value)}
								aria-label={`Currency ${i + 1} name`}
							/>
							<input
								type="text"
								inputMode="numeric"
								className="df-cs-currency-amount"
								placeholder="0"
								value={currency.amount}
								onChange={(e) => setCurrency(i, "amount", e.target.value)}
								aria-label={`Currency ${i + 1} amount`}
							/>
							<button
								type="button"
								className="df-cs-card-remove"
								aria-label={dfTranslate("sheet.removeCurrency", { count: i + 1 })}
								onClick={() =>
									patchSettings(char, update, {
										currencies: settings.currencies.filter((_, j) => j !== i),
									})
								}
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						className="df-cs-currency-add"
						onClick={() =>
							patchSettings(char, update, {
								currencies: [...settings.currencies, { name: "", amount: "" }],
							})
						}
					>
						{dfTranslate("ui.add.currency")}</button>
				</div>
			) : (
			<div className="df-cs-gold-row">
				<div className="df-cs-gold-group">
					<div className="df-cs-gold-icons">
						{char.goldHandfuls.map((on, i) => (
							<SlotToggle
								key={i}
								on={on}
								onToggle={() => update({ goldHandfuls: toggleAt(char.goldHandfuls, i) })}
								label={`Gold handful ${i + 1}`}
							>
								<GoldHandfulArt />
							</SlotToggle>
						))}
					</div>
					<span className="df-cs-gold-label">{dfTranslate("ui.handfuls")}</span>
				</div>
				<div className="df-cs-gold-divider" />
				<div className="df-cs-gold-group">
					<div className="df-cs-gold-icons">
						{char.goldBags.map((on, i) => (
							<SlotToggle
								key={i}
								on={on}
								onToggle={() => update({ goldBags: toggleAt(char.goldBags, i) })}
								label={`Gold bag ${i + 1}`}
							>
								<GoldBagArt />
							</SlotToggle>
						))}
					</div>
					<span className="df-cs-gold-label">{dfTranslate("ui.bags")}</span>
				</div>
				<div className="df-cs-gold-divider" />
				<div className="df-cs-gold-group">
					<div className="df-cs-gold-icons">
						<SlotToggle
							on={char.goldChest}
							onToggle={() => update({ goldChest: !char.goldChest })}
							label={dfTranslate("ui.gold.chest")}
						>
							<GoldChestArt />
						</SlotToggle>
					</div>
					<span className="df-cs-gold-label">{dfTranslate("ui.chest")}</span>
				</div>
			</div>
			)}
		</section>
	);
}

// ── Class feature / notes ─────────────────────────────────────────────────────

export function ClassFeatureSection({ char, update }: SectionProps) {
	useUiLanguage();
	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.class.feature")} />
			<textarea
				className="df-cs-area df-cs-area--tall"
				value={char.classFeature}
				onChange={(e) => update({ classFeature: e.target.value })}
				aria-label={dfTranslate("ui.class.feature.168")}
			/>
		</section>
	);
}

// ── Heritage & domain cards ───────────────────────────────────────────────────

/** Which picker tab a section's "add" button should open. */
export type PickerTab = "ancestry" | "community" | "domain" | "equipment" | "item";

/** Optional because embeds render the sheet without the card picker. */
export interface CardSectionProps extends SectionProps {
	onAddCards?: (tab: PickerTab) => void;
}

/** rgba() tint of a hex color (avoids color-mix for older webviews). */
export function hexTint(hex: string, alpha: number): string {
	if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "transparent";
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** rgba() tint of a domain's signature color. */
export function domainTint(domain: string, alpha: number): string {
	return hexTint(DOMAIN_COLORS[domain] ?? "", alpha);
}

export function HeritageCardsSection({ char, update, onAddCards }: CardSectionProps) {
	useUiLanguage();
	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.heritage.cards")} />
			<div className="df-cs-hcards">
				<HeritageSlot
					kind="Ancestry"
					card={char.ancestryCard}
					onRemove={() => update({ ancestryCard: null })}
					onAdd={onAddCards ? () => onAddCards("ancestry") : undefined}
				/>
				<HeritageSlot
					kind="Community"
					card={char.communityCard}
					onRemove={() => update({ communityCard: null })}
					onAdd={onAddCards ? () => onAddCards("community") : undefined}
				/>
				{char.transformationCard && (
					<HeritageSlot
						kind="Transformation"
						card={char.transformationCard}
						onRemove={() => update({ transformationCard: null })}
					/>
				)}
			</div>
		</section>
	);
}

function HeritageSlot({
	kind,
	card,
	onRemove,
	onAdd,
}: {
	kind: "Ancestry" | "Community" | "Transformation";
	card: CharacterData["ancestryCard"];
	onRemove: () => void;
	onAdd?: () => void;
}) {
	useUiLanguage();
	if (!card) {
		return onAdd ? (
			<button type="button" className="df-cs-hcard df-cs-hcard--empty" onClick={onAdd}>
				{dfTranslate("sheet.card.add", { kind: dfTranslate(kind === "Ancestry" ? "wizard.step.ancestry" : kind === "Community" ? "wizard.step.community" : "wizard.step.transformation") })}</button>
		) : (
			<div className="df-cs-hcard df-cs-hcard--empty">{dfTranslate("sheet.card.empty", { kind: dfTranslate(kind === "Ancestry" ? "wizard.step.ancestry" : kind === "Community" ? "wizard.step.community" : "wizard.step.transformation") })}</div>
		);
	}
	return (
		<div className="df-cs-hcard">
			<div className="df-cs-hcard-head">
				<span className="df-cs-hcard-kind">{dfTranslate(kind === "Ancestry" ? "wizard.review.ancestry" : kind === "Community" ? "wizard.review.community" : "wizard.review.transformation")}</span>
				<span className="df-cs-hcard-name">{card.name}</span>
				<button
					type="button"
					className="df-cs-card-remove"
					aria-label={dfTranslate("sheet.removeCard")}
					onClick={onRemove}
				>
					✕
				</button>
			</div>
			<div className="df-cs-hcard-body">
				<CardText text={card.features} />
			</div>
		</div>
	);
}

export function DomainCardsSection({ char, update, onAddCards }: CardSectionProps) {
	useUiLanguage();
	const loadout = char.domainCards.filter((c) => !c.inVault);
	const vault = char.domainCards.filter((c) => c.inVault);

	const setVault = (card: CharacterDomainCard, inVault: boolean) =>
		update({
			domainCards: char.domainCards.map((c) => (c === card ? { ...c, inVault } : c)),
		});
	const remove = (card: CharacterDomainCard) =>
		update({ domainCards: char.domainCards.filter((c) => c !== card) });

	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.domain.cards")} />
			<div className="df-cs-dcards-groups">
				<DomainCardGroup
					title={dfTranslate("sheet.loadoutCount", { count: loadout.length })}
					hint="Active cards you can use during play."
					cards={loadout}
					actionLabel="To vault"
					onAction={(c) => setVault(c, true)}
					onRemove={remove}
				/>
				<DomainCardGroup
					title={dfTranslate("sheet.vaultCount", { count: vault.length })}
					hint="Stored cards. Swapping one into your loadout costs its Recall Cost in Stress during play; swapping during downtime is free."
					cards={vault}
					actionLabel="To loadout"
					onAction={(c) => setVault(c, false)}
					onRemove={remove}
				/>
			</div>
			{onAddCards && (
				<button type="button" className="df-cs-dcards-add" onClick={() => onAddCards("domain")}>
					{dfTranslate("ui.add.domain.cards")}</button>
			)}
		</section>
	);
}

function DomainCardGroup({
	title,
	hint,
	cards,
	actionLabel,
	onAction,
	onRemove,
}: {
	title: string;
	hint: string;
	cards: CharacterDomainCard[];
	actionLabel: string;
	onAction: (card: CharacterDomainCard) => void;
	onRemove: (card: CharacterDomainCard) => void;
}) {
	useUiLanguage();
	return (
		<div className="df-cs-dcards-group">
			<h3 className="df-cs-dcards-title">{title}</h3>
			{cards.length === 0 ? (
				<p className="df-cs-dcards-hint">{hint}</p>
			) : (
				<div className="df-cs-dcards-list">
					{cards.map((card, i) => (
						<DomainCardItem
							key={`${card.name}-${i}`}
							card={card}
							actionLabel={actionLabel}
							onAction={() => onAction(card)}
							onRemove={() => onRemove(card)}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function DomainCardItem({
	card,
	actionLabel,
	onAction,
	onRemove,
}: {
	card: CharacterDomainCard;
	actionLabel: string;
	onAction: () => void;
	onRemove: () => void;
}) {
	useUiLanguage();
	const color = DOMAIN_COLORS[card.domain] ?? "var(--df-cs-mid)";
	return (
		<div
			className="df-cs-dcard"
			style={{ borderLeftColor: color, background: domainTint(card.domain, 0.07) }}
		>
			<div className="df-cs-dcard-head">
				<span className="df-cs-dcard-level" style={{ background: color }}>
					{card.level}
				</span>
				<DomainIcon domain={card.domain} className="df-cs-dcard-icon" style={{ color }} />
				<span className="df-cs-dcard-name">{card.name}</span>
				<span className="df-cs-dcard-meta">
					{card.domain} · {card.type} · <ZapIcon />{card.recallCost}
				</span>
				<button type="button" className="df-cs-card-remove" aria-label={dfTranslate("sheet.removeNamed", { name: card.name })} onClick={onRemove}>
					✕
				</button>
			</div>
			<div className="df-cs-dcard-body">
				<CardText text={card.text} />
			</div>
			<div className="df-cs-dcard-actions">
				<button type="button" className="df-cs-dcard-action" onClick={onAction}>
					{actionLabel}
				</button>
			</div>
		</div>
	);
}

export function NotesSection({ char, update }: SectionProps) {
	useUiLanguage();
	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.notes")} />
			<textarea
				className="df-cs-area df-cs-area--tall"
				value={char.notes}
				onChange={(e) => update({ notes: e.target.value })}
				aria-label={dfTranslate("ui.notes")}
			/>
		</section>
	);
}

// ── Weapons & armor ───────────────────────────────────────────────────────────

function WeaponFields({
	weapon,
	onChange,
	idPrefix,
}: {
	weapon: CharacterWeapon;
	onChange: (patch: Partial<CharacterWeapon>) => void;
	idPrefix: string;
}) {
	useUiLanguage();
	return (
		<>
			<div className="df-cs-field-row">
				<LineField
					label={dfTranslate("ui.name")}
					className="df-cs-field--wide"
					value={weapon.name}
					onChange={(v) => onChange({ name: v })}
				/>
				<LineField
					label={dfTranslate("ui.trait.range")}
					value={weapon.traitRange}
					onChange={(v) => onChange({ traitRange: v })}
				/>
				<LineField
					label={dfTranslate("ui.damage.dice.type")}
					value={weapon.damageDice}
					onChange={(v) => onChange({ damageDice: v })}
				/>
			</div>
			<LineTextarea
				label={dfTranslate("ui.feature")}
				value={weapon.feature}
				onChange={(v) => onChange({ feature: v })}
				className={idPrefix + "-feature"}
			/>
		</>
	);
}

export function ActiveWeaponsSection({ char, update }: SectionProps) {
	useUiLanguage();
	return (
		<section className="df-cs-box">
			<div className="df-cs-banner-with-hands">
				<SectionBanner title={dfTranslate("ui.active.weapons")} />
				<div className="df-cs-hands">
					<SlotToggle
						on={char.weaponHandOne}
						onToggle={() => update({ weaponHandOne: !char.weaponHandOne })}
						label={dfTranslate("ui.first.hand")}
					>
						<HandArt />
					</SlotToggle>
					<SlotToggle
						on={char.weaponHandTwo}
						onToggle={() => update({ weaponHandTwo: !char.weaponHandTwo })}
						label={dfTranslate("ui.second.hand")}
						className="df-cs-hand--tilted"
					>
						<HandArt />
					</SlotToggle>
				</div>
			</div>
			<div className="df-cs-proficiency">
				<div className="df-cs-proficiency-inner">
					<span className="df-cs-proficiency-label">{dfTranslate("ui.proficiency")}</span>
					<span className="df-cs-proficiency-dot df-cs-proficiency-dot--static is-on" />
					{char.proficiency.map((on, i) => (
						<button
							key={i}
							type="button"
							className={"df-cs-proficiency-dot" + (on ? " is-on" : "")}
							aria-pressed={on}
							aria-label={`Proficiency ${i + 2}`}
							onClick={() => update({ proficiency: toggleAt(char.proficiency, i) })}
						/>
					))}
				</div>
			</div>
			<h3 className="df-cs-weapon-title">{dfTranslate("ui.primary")}</h3>
			<WeaponFields
				weapon={char.primaryWeapon}
				onChange={(p) => update({ primaryWeapon: { ...char.primaryWeapon, ...p } })}
				idPrefix="primary"
			/>
			<h3 className="df-cs-weapon-title">{dfTranslate("ui.secondary")}</h3>
			<WeaponFields
				weapon={char.secondaryWeapon}
				onChange={(p) => update({ secondaryWeapon: { ...char.secondaryWeapon, ...p } })}
				idPrefix="secondary"
			/>
		</section>
	);
}

export function ActiveArmorSection({ char, update }: SectionProps) {
	useUiLanguage();
	const armor = char.activeArmor;
	const setArmor = (patch: Partial<typeof armor>) =>
		update({ activeArmor: { ...armor, ...patch } });

	return (
		<section className="df-cs-box">
			<SectionBanner title={dfTranslate("ui.active.armor")} />
			<div className="df-cs-field-row">
				<LineField
					label={dfTranslate("ui.name")}
					className="df-cs-field--wide"
					value={armor.name}
					onChange={(v) => setArmor({ name: v })}
				/>
				<LineField
					label={dfTranslate("ui.base.thresholds")}
					value={armor.baseThresholds}
					onChange={(v) => setArmor({ baseThresholds: v })}
				/>
				<LineField
					label={dfTranslate("ui.base.score")}
					value={armor.baseScore}
					onChange={(v) => setArmor({ baseScore: v })}
				/>
			</div>
			<LineTextarea label={dfTranslate("ui.feature")} value={armor.feature} onChange={(v) => setArmor({ feature: v })} />
		</section>
	);
}

export function InventorySection({ char, update }: SectionProps) {
	useUiLanguage();
	const setInventoryWeapon = (
		index: number,
		patch: Partial<CharacterData["inventoryWeapons"][number]>,
	) =>
		update({
			inventoryWeapons: char.inventoryWeapons.map((w, i) =>
				i === index ? { ...w, ...patch } : w,
			),
		});

	return (
		<section className="df-cs-box">
			<h3 className="df-cs-plain-title">{dfTranslate("ui.inventory")}</h3>
			<textarea
				className="df-cs-area df-cs-area--ruled"
				rows={5}
				value={char.inventory}
				onChange={(e) => update({ inventory: e.target.value })}
				aria-label={dfTranslate("ui.inventory")}
			/>
			{char.inventoryWeapons.map((weapon, i) => (
				<div key={i} className="df-cs-inventory-weapon">
					<div className="df-cs-inventory-weapon-head">
						<h3 className="df-cs-weapon-title">{dfTranslate("ui.inventory.weapon")}</h3>
						<div className="df-cs-hands">
							<SlotToggle
								on={weapon.handOne}
								onToggle={() => setInventoryWeapon(i, { handOne: !weapon.handOne })}
								label={`Inventory weapon ${i + 1} first hand`}
							>
								<HandArt />
							</SlotToggle>
							<SlotToggle
								on={weapon.handTwo}
								onToggle={() => setInventoryWeapon(i, { handTwo: !weapon.handTwo })}
								label={`Inventory weapon ${i + 1} second hand`}
								className="df-cs-hand--tilted"
							>
								<HandArt />
							</SlotToggle>
						</div>
						<LabeledCheck
							label={dfTranslate("ui.primary")}
							on={weapon.primary}
							onToggle={() => setInventoryWeapon(i, { primary: !weapon.primary })}
						/>
						<LabeledCheck
							label={dfTranslate("ui.secondary")}
							on={weapon.secondary}
							onToggle={() => setInventoryWeapon(i, { secondary: !weapon.secondary })}
						/>
					</div>
					<WeaponFields
						weapon={weapon}
						onChange={(p) => setInventoryWeapon(i, p)}
						idPrefix={`inventory-${i}`}
					/>
				</div>
			))}
		</section>
	);
}
