import React, { useState } from "react";
import { CLASS_COLORS, CLASS_DOMAINS, DOMAIN_COLORS, SrdClass, SrdDomainCard, SrdHeritage, SrdSubclass } from "../../../types/srd";
import {
	SRD_ANCESTRIES,
	SRD_CLASSES,
	SRD_COMMUNITIES,
	SRD_DOMAIN_CARDS,
} from "../../../data/srd";
import { CreationChoices } from "../creationTemplate";
import { CardText } from "./CardText";
import { DomainIcon, DomainSprite } from "./DomainArt";
import { ZapIcon } from "./SheetFields";
import { TranslationKey } from "../../../i18n";
import { useTranslation } from "../../../i18n/react";

interface Props {
	onComplete: (choices: CreationChoices) => void;
	onCancel: () => void;
}

const STEPS: Array<{ id: string; label: TranslationKey }> = [
	{ id: "class", label: "wizard.step.class" },
	{ id: "subclass", label: "wizard.step.subclass" },
	{ id: "ancestry", label: "wizard.step.ancestry" },
	{ id: "community", label: "wizard.step.community" },
	{ id: "experiences", label: "wizard.step.experiences" },
	{ id: "domain-cards", label: "wizard.step.domainCards" },
	{ id: "review", label: "wizard.step.review" },
];

/**
 * Guided character creation following the SRD steps. Every step can be
 * skipped; the result lands in the sheet unsaved so the player can adjust
 * anything before saving.
 *
 * Selection steps use a master-detail layout: option names on the left, the
 * full description on the right with the Choose button pinned to the panel
 * footer (the body scrolls, so the button never sinks out of view). On
 * narrow containers the panel moves above the list instead.
 */
export function CreationWizard({ onComplete, onCancel }: Props) {
	const t = useTranslation();
	const [step, setStep] = useState(0);
	const [choices, setChoices] = useState<CreationChoices>({});

	const srdClass = SRD_CLASSES.find((c) => c.name === choices.className);
	const classDomains = choices.className ? CLASS_DOMAINS[choices.className] : undefined;

	const pick = (patch: Partial<CreationChoices>, advance = true) => {
		setChoices((c) => ({ ...c, ...patch }));
		if (advance) setStep((s) => Math.min(s + 1, STEPS.length - 1));
	};

	// Choosing a different class invalidates subclass/domain-card picks
	const pickClass = (name: string) =>
		pick({ className: name, subclassName: undefined, domainCardNames: [] });

	const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
	const back = () => setStep((s) => Math.max(s - 1, 0));

	return (
		<div className="df-cs-wizard">
			<DomainSprite />
			<div className="df-cs-wizard-head">
				<h2 className="df-cs-wizard-title">{t("wizard.title")}</h2>
				<button type="button" className="df-cs-card-remove" aria-label={t("wizard.cancel")} onClick={onCancel}>
					✕
				</button>
			</div>
			<div className="df-cs-wiz-steps">
				{STEPS.map((stepConfig, i) => (
					<button
						key={stepConfig.id}
						type="button"
						className={
							"df-cs-wiz-step" +
							(i === step ? " is-active" : "") +
							(i < step ? " is-done" : "")
						}
						onClick={() => setStep(i)}
					>
						<span className="df-cs-wiz-step-diamond">
							<span>{i < step ? "✦" : i + 1}</span>
						</span>
						<span className="df-cs-wiz-step-label">{t(stepConfig.label)}</span>
					</button>
				))}
			</div>

			<div className="df-cs-wizard-body">
				{step === 0 && <ClassStep selected={choices.className} onPick={pickClass} />}
				{step === 1 && (
					<SubclassStep
						srdClass={srdClass}
						selected={choices.subclassName}
						onPick={(name) => pick({ subclassName: name })}
					/>
				)}
				{step === 2 && (
					<AncestryStep
						selected={choices.ancestryName}
						selected2={choices.ancestryName2}
						onPick={pick}
					/>
				)}
				{step === 3 && (
					<HeritageStep
						options={SRD_COMMUNITIES}
						kind="community"
						selected={choices.communityName}
						onPick={(name) => pick({ communityName: name })}
					/>
				)}
				{step === 4 && (
					<ExperiencesStep
						experiences={choices.experiences ?? ["", ""]}
						onChange={(experiences) => pick({ experiences }, false)}
					/>
				)}
				{step === 5 && (
					<DomainCardsStep
						classDomains={classDomains}
						selected={choices.domainCardNames ?? []}
						onChange={(names) => pick({ domainCardNames: names }, false)}
					/>
				)}
				{step === 6 && <ReviewStep choices={choices} />}
			</div>

			<div className="df-cs-wizard-nav">
				<button type="button" onClick={back} disabled={step === 0}>
					{t("wizard.back")}
				</button>
				{step < STEPS.length - 1 ? (
					<button type="button" onClick={next}>
						{stepIsAnswered(step, choices) ? t("wizard.next") : t("wizard.skip")}
					</button>
				) : (
					<button type="button" className="mod-cta" onClick={() => onComplete(choices)}>
						{t("wizard.create")}
					</button>
				)}
			</div>
		</div>
	);
}

function stepIsAnswered(step: number, choices: CreationChoices): boolean {
	switch (step) {
		case 0: return Boolean(choices.className);
		case 1: return Boolean(choices.subclassName);
		case 2: return Boolean(choices.ancestryName);
		case 3: return Boolean(choices.communityName);
		case 4: return (choices.experiences ?? []).some((e) => e.trim() !== "");
		case 5: return (choices.domainCardNames ?? []).length > 0;
		default: return true;
	}
}

// ── Master-detail building blocks ─────────────────────────────────────────────

const accentStyle = (accent?: string) =>
	accent ? ({ "--df-cs-row-accent": accent } as React.CSSProperties) : undefined;

function WizardSplit({ list, detail }: { list: React.ReactNode; detail: React.ReactNode }) {
	return (
		<div className="df-cs-wiz-split">
			<div className="df-cs-wiz-list">{list}</div>
			{detail}
		</div>
	);
}

function WizardRow({
	icons,
	name,
	meta,
	tags,
	selected,
	active,
	accent,
	onClick,
}: {
	icons?: React.ReactNode;
	name: string;
	meta?: React.ReactNode;
	tags?: React.ReactNode;
	selected: boolean;
	active: boolean;
	accent?: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className={
				"df-cs-wiz-row" + (selected ? " is-selected" : "") + (active ? " is-active" : "")
			}
			style={accentStyle(accent)}
			aria-expanded={active}
			onClick={onClick}
		>
			{icons}
			<span className="df-cs-wiz-row-name">{name}</span>
			{tags}
			{selected && <span className="df-cs-wiz-row-check">✦</span>}
			{meta && <span className="df-cs-wiz-row-meta">{meta}</span>}
		</button>
	);
}

function WizardDetail({
	accent,
	title,
	meta,
	footNote,
	chooseLabel,
	chooseDisabled,
	onChoose,
	onClose,
	children,
}: {
	accent?: string;
	title: React.ReactNode;
	meta?: React.ReactNode;
	footNote?: React.ReactNode;
	chooseLabel: string;
	chooseDisabled?: boolean;
	onChoose: () => void;
	onClose: () => void;
	children: React.ReactNode;
}) {
	const t = useTranslation();
	return (
		<div className="df-cs-wiz-detail" style={accentStyle(accent)}>
			<div className="df-cs-wiz-detail-head">
				<span className="df-cs-wiz-detail-title">{title}</span>
				{meta && <span className="df-cs-wiz-detail-meta">{meta}</span>}
				<button type="button" className="df-cs-card-remove" aria-label={t("wizard.closeDetails")} onClick={onClose}>
					✕
				</button>
			</div>
			<div className="df-cs-wiz-detail-body">{children}</div>
			<div className="df-cs-wiz-detail-foot">
				{footNote && <span className="df-cs-wiz-foot-note">{footNote}</span>}
				<button type="button" className="mod-cta df-cs-wiz-choose" disabled={chooseDisabled} onClick={onChoose}>
					{chooseLabel}
				</button>
			</div>
		</div>
	);
}

/** Right-pane filler while nothing is open. Hidden on narrow containers. */
function WizardPlaceholder({ text }: { text: string }) {
	return (
		<div className="df-cs-wiz-placeholder">
			<span className="df-cs-wiz-placeholder-orn">✦ ✦ ✦</span>
			{text}
		</div>
	);
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function ClassStep({ selected, onPick }: { selected?: string; onPick: (name: string) => void }) {
	const t = useTranslation();
	const [openName, setOpenName] = useState<string | null>(selected ?? SRD_CLASSES[0]?.name ?? null);
	const open = SRD_CLASSES.find((c) => c.name === openName);
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.class.hint")}</p>
			<WizardSplit
				list={SRD_CLASSES.map((c) => (
					<WizardRow
						key={c.name}
						selected={selected === c.name}
						active={openName === c.name}
						accent={CLASS_COLORS[c.name]}
						onClick={() => setOpenName(c.name)}
						icons={(CLASS_DOMAINS[c.name] ?? []).map((d) => (
							<DomainIcon key={d} domain={d} className="df-cs-domain-icon" style={{ color: DOMAIN_COLORS[d] }} />
						))}
						name={c.name}
						meta={c.stats.domains}
					/>
				))}
				detail={
					open ? (
						<WizardDetail
							accent={CLASS_COLORS[open.name]}
							title={
								<>
									{(CLASS_DOMAINS[open.name] ?? []).map((d) => (
										<DomainIcon key={d} domain={d} className="df-cs-domain-icon" style={{ color: DOMAIN_COLORS[d] }} />
									))}
									{open.name}
								</>
							}
							meta={t("wizard.class.meta", { evasion: open.stats.evasion, hp: open.stats.hp })}
							chooseLabel={t("wizard.choose", { name: open.name })}
							onChoose={() => onPick(open.name)}
							onClose={() => setOpenName(null)}
						>
							<ClassDetail srdClass={open} />
						</WizardDetail>
					) : (
						<WizardPlaceholder text={t("wizard.class.placeholder")} />
					)
				}
			/>
		</>
	);
}

function ClassDetail({ srdClass }: { srdClass: SrdClass }) {
	const t = useTranslation();
	const suggested = [
		srdClass.stats.suggestedPrimary,
		srdClass.stats.suggestedSecondary,
		srdClass.stats.suggestedArmor,
	]
		.filter(Boolean)
		.join(", ");
	return (
		<>
			{srdClass.description.map((para, i) => (
				<p key={i} className="df-cs-cardtext-p">{para}</p>
			))}
			<p className="df-cs-cardtext-p">
				<strong>{t("wizard.class.suggestedTraits")}</strong> {srdClass.stats.suggestedTraits} ·{" "}
				<strong>{t("wizard.class.suggestedEquipment")}</strong> {suggested}
			</p>
			<p className="df-cs-cardtext-p">
				<strong>{t("wizard.class.hopeFeature")} </strong>
				{srdClass.hopeFeature}
			</p>
			{srdClass.classFeatures.map((f) => (
				<p key={f.name} className="df-cs-cardtext-p">
					<strong>{f.name}: </strong>
					{f.description}
				</p>
			))}
			<p className="df-cs-cardtext-p">
				<strong>{t("wizard.class.startingItem")} </strong>
				{srdClass.items}
			</p>
		</>
	);
}

function SubclassStep({
	srdClass,
	selected,
	onPick,
}: {
	srdClass?: SrdClass;
	selected?: string;
	onPick: (name: string) => void;
}) {
	const t = useTranslation();
	const [openName, setOpenName] = useState<string | null>(
		selected ?? (srdClass ? Object.values(srdClass.subclasses)[0]?.name : null) ?? null,
	);
	if (!srdClass) {
		return <p className="df-cs-wizard-hint">{t("wizard.subclass.noClass")}</p>;
	}
	const accent = CLASS_COLORS[srdClass.name];
	const open = openName ? srdClass.subclasses[openName] : undefined;
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.subclass.hint", { className: srdClass.name })}</p>
			<WizardSplit
				list={Object.values(srdClass.subclasses).map((sub) => (
					<WizardRow
						key={sub.name}
						selected={selected === sub.name}
						active={openName === sub.name}
						accent={accent}
						onClick={() => setOpenName(sub.name)}
						name={sub.name}
						meta={sub.spellcastTrait ? t("wizard.subclass.spellcast", { trait: sub.spellcastTrait }) : undefined}
					/>
				))}
				detail={
					open ? (
						<WizardDetail
							accent={accent}
							title={open.name}
							meta={open.spellcastTrait ? t("wizard.subclass.spellcast", { trait: open.spellcastTrait }) : undefined}
							chooseLabel={t("wizard.choose", { name: open.name })}
							onChoose={() => onPick(open.name)}
							onClose={() => setOpenName(null)}
						>
							<SubclassDetail subclass={open} />
						</WizardDetail>
					) : (
						<WizardPlaceholder text={t("wizard.subclass.placeholder")} />
					)
				}
			/>
		</>
	);
}

function SubclassDetail({ subclass }: { subclass: SrdSubclass }) {
	const t = useTranslation();
	return (
		<>
			{subclass.foundation.map((f) => (
				<div key={f.name}>
					<p className="df-cs-cardtext-p">
						<strong>{f.name}</strong> ({t("wizard.subclass.foundation")})
					</p>
					<CardText text={f.description} />
				</div>
			))}
		</>
	);
}

function HeritageDetail({ heritage }: { heritage: SrdHeritage }) {
	return (
		<>
			<CardText text={heritage.description.join("\n\n")} />
			<CardText text={heritage.features.join("\n\n")} />
		</>
	);
}

function HeritageStep({
	options,
	kind,
	selected,
	onPick,
}: {
	options: SrdHeritage[];
	kind: string;
	selected?: string;
	onPick: (name: string) => void;
}) {
	const t = useTranslation();
	const [openName, setOpenName] = useState<string | null>(selected ?? options[0]?.name ?? null);
	const open = options.find((h) => h.name === openName);
	return (
		<WizardSplit
			list={options.map((h) => (
				<WizardRow
					key={h.name}
					selected={selected === h.name}
					active={openName === h.name}
					onClick={() => setOpenName(h.name)}
					name={h.name}
					meta={h.features.map((f) => f.split(":")[0]).join(" · ")}
				/>
			))}
			detail={
				open ? (
					<WizardDetail
						title={open.name}
					chooseLabel={t("wizard.choose", { name: open.name })}
						onChoose={() => onPick(open.name)}
						onClose={() => setOpenName(null)}
					>
						<HeritageDetail heritage={open} />
					</WizardDetail>
				) : (
					<WizardPlaceholder text={t("wizard.heritage.placeholder", {
						kind: kind === "community" ? t("wizard.heritage.community") : kind,
					})} />
				)
			}
		/>
	);
}

function AncestryStep({
	selected,
	selected2,
	onPick,
}: {
	selected?: string;
	selected2?: string;
	onPick: (patch: Partial<CreationChoices>, advance?: boolean) => void;
}) {
	const t = useTranslation();
	const [openName, setOpenName] = useState<string | null>(
		selected ?? SRD_ANCESTRIES[0]?.name ?? null,
	);
	const mixed = selected2 !== undefined;
	const open = SRD_ANCESTRIES.find((h) => h.name === openName);

	const toggleMixed = () => {
		// Entering mixed mode keeps the current pick as the primary ancestry;
		// leaving it drops the secondary.
		onPick({ ancestryName2: mixed ? undefined : "" }, false);
	};

	const choose = (name: string) => {
		if (!mixed) {
			onPick({ ancestryName: name });
			return;
		}
		if (!selected) {
			onPick({ ancestryName: name }, false);
			return;
		}
		if (name === selected) return;
		onPick({ ancestryName2: name });
	};

	const chooseLabel = (name: string) => {
		if (!mixed) return t("wizard.choose", { name });
		if (!selected) return t("wizard.ancestry.useFirst", { name });
		if (name === selected) return t("wizard.ancestry.pickedFirst");
		return t("wizard.ancestry.useSecond", { name });
	};

	return (
		<>
			<div className="df-cs-wizard-mixed-row">
				<button
					type="button"
					className={"df-cs-check" + (mixed ? " is-on" : "")}
					aria-pressed={mixed}
					onClick={toggleMixed}
				>
					<span className="df-cs-check-box" />
					{t("wizard.ancestry.mixed")}
				</button>
				<span className="df-cs-wizard-hint df-cs-wizard-hint--inline">
					{mixed
						? !selected
							? t("wizard.ancestry.pickFirst")
							: !selected2
								? t("wizard.ancestry.pickSecond", { name: selected })
								: t("wizard.ancestry.summary", { first: selected, second: selected2 })
						: t("wizard.ancestry.mixedPrompt")}
				</span>
			</div>
			<WizardSplit
				list={SRD_ANCESTRIES.map((h) => {
					const isPrimary = selected === h.name;
					const isSecondary = mixed && selected2 === h.name;
					return (
						<WizardRow
							key={h.name}
							selected={isPrimary || isSecondary}
							active={openName === h.name}
							onClick={() => setOpenName(h.name)}
							name={h.name}
							tags={
								<>
									{mixed && isPrimary && <span className="df-cs-wizard-tag">{t("wizard.ancestry.firstTag")}</span>}
									{isSecondary && <span className="df-cs-wizard-tag">{t("wizard.ancestry.secondTag")}</span>}
								</>
							}
							meta={h.features.map((f) => f.split(":")[0]).join(" · ")}
						/>
					);
				})}
				detail={
					open ? (
						<WizardDetail
							title={open.name}
							chooseLabel={chooseLabel(open.name)}
							chooseDisabled={mixed && open.name === selected}
							onChoose={() => choose(open.name)}
							onClose={() => setOpenName(null)}
						>
							<HeritageDetail heritage={open} />
						</WizardDetail>
					) : (
						<WizardPlaceholder text={t("wizard.ancestry.placeholder")} />
					)
				}
			/>
		</>
	);
}

function ExperiencesStep({
	experiences,
	onChange,
}: {
	experiences: string[];
	onChange: (experiences: string[]) => void;
}) {
	const t = useTranslation();
	const setAt = (index: number, value: string) => {
		const next = [...experiences];
		next[index] = value;
		onChange(next);
	};
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.experiences.hint")}</p>
			<div className="df-cs-wizard-experiences">
				{[0, 1].map((i) => (
					<label key={i} className="df-cs-wizard-exp-row">
						<span className="df-cs-wizard-exp-mod">+2</span>
						<input
							type="text"
							className="df-cs-wizard-exp-input"
							placeholder={i === 0
								? t("wizard.experiences.firstPlaceholder")
								: t("wizard.experiences.secondPlaceholder")}
							value={experiences[i] ?? ""}
							onChange={(e) => setAt(i, e.target.value)}
						/>
					</label>
				))}
			</div>
		</>
	);
}

export function DomainCardsStep({
	classDomains,
	selected,
	onChange,
}: {
	classDomains?: [string, string];
	selected: string[];
	onChange: (names: string[]) => void;
}) {
	const t = useTranslation();
	const cards = SRD_DOMAIN_CARDS.filter(
		(c) => c.level === 1 && (!classDomains || classDomains.includes(c.domain)),
	);
	const [openName, setOpenName] = useState<string | null>(selected[0] ?? cards[0]?.name ?? null);
	const open = cards.find((c) => c.name === openName);

	const domains = [...new Set(cards.map((c) => c.domain))];
	const toggle = (card: SrdDomainCard) => {
		if (selected.includes(card.name)) {
			onChange(selected.filter((n) => n !== card.name));
		} else if (selected.length < 2) {
			onChange([...selected, card.name]);
		}
	};

	const openPicked = open ? selected.includes(open.name) : false;
	return (
		<>
			<p className="df-cs-wizard-hint">
				{classDomains
					? t("wizard.domain.hintForClass", { first: classDomains[0], second: classDomains[1] })
					: t("wizard.domain.hint")}
			</p>
			<WizardSplit
				list={domains.map((domain) => {
					const color = DOMAIN_COLORS[domain] ?? "var(--df-cs-mid)";
					return (
						<React.Fragment key={domain}>
							<span className="df-cs-wiz-sub" style={{ color }}>
								<DomainIcon domain={domain} className="df-cs-domain-icon" style={{ color }} />
								{domain}
							</span>
							{cards
								.filter((c) => c.domain === domain)
								.map((card) => (
									<WizardRow
										key={card.name}
										selected={selected.includes(card.name)}
										active={openName === card.name}
										accent={color}
										onClick={() => setOpenName(card.name)}
										name={card.name}
										meta={<>{card.type} · <ZapIcon />{card.recallCost}</>}
									/>
								))}
						</React.Fragment>
					);
				})}
				detail={
					open ? (
						<WizardDetail
							accent={DOMAIN_COLORS[open.domain]}
							title={
								<>
									<DomainIcon
										domain={open.domain}
										className="df-cs-domain-icon"
										style={{ color: DOMAIN_COLORS[open.domain] }}
									/>
									{open.name}
								</>
							}
							meta={`${open.domain} · ${open.type} · ${t("wizard.domain.recall", { cost: open.recallCost })}`}
							footNote={t("wizard.domain.picked", { count: selected.length })}
							chooseLabel={openPicked ? t("wizard.domain.remove") : t("wizard.domain.add")}
							chooseDisabled={!openPicked && selected.length >= 2}
							onChoose={() => toggle(open)}
							onClose={() => setOpenName(null)}
						>
							<CardText text={open.text} />
						</WizardDetail>
					) : (
						<WizardPlaceholder text={t("wizard.domain.placeholder")} />
					)
				}
			/>
		</>
	);
}

function ReviewStep({ choices }: { choices: CreationChoices }) {
	const t = useTranslation();
	const ancestry = choices.ancestryName2
		? `${choices.ancestryName} / ${choices.ancestryName2} (${t("wizard.review.mixed")})`
		: choices.ancestryName;
	const experiences = (choices.experiences ?? []).filter((e) => e.trim() !== "");
	const rows: Array<[string, string]> = [
		[t("wizard.review.class"), choices.className ?? "-"],
		[t("wizard.review.subclass"), choices.subclassName ?? "-"],
		[t("wizard.review.ancestry"), ancestry || "-"],
		[t("wizard.review.community"), choices.communityName ?? "-"],
		[t("wizard.review.experiences"), experiences.map((e) => `${e} (+2)`).join(", ") || "-"],
		[t("wizard.review.domainCards"), (choices.domainCardNames ?? []).join(", ") || "-"],
	];
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.review.hint")}</p>
			<div className="df-cs-wizard-review">
				{rows.map(([label, value]) => (
					<div key={label} className="df-cs-wizard-review-row">
						<span className="df-cs-wizard-review-label">{label}</span>
						<span className="df-cs-wizard-review-value">{value}</span>
					</div>
				))}
			</div>
		</>
	);
}
