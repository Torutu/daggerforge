import React, { useState } from "react";
import { CLASS_COLORS, DOMAIN_COLORS, SrdClass, SrdDomainCard, SrdDomainRef, SrdHeritage, SrdSubclass, SrdTransformation } from "../../../types/srd";
import {
	getSrdAncestries,
	getSrdClasses,
	getSrdCommunities,
	getSrdDomainCards,
	getSrdTransformations,
} from "../../../data/srd";
import { CreationChoices } from "../creationTemplate";
import { CardText } from "./CardText";
import { DomainIcon, DomainSprite } from "./DomainArt";
import { ZapIcon } from "./SheetFields";
import { TranslationKey } from "../../../i18n";
import { useLanguage, useTranslation } from "../../../i18n/react";
import { gameTerm } from "../../../i18n/gameTerms";

interface Props {
	onComplete: (choices: CreationChoices) => void;
	onCancel: () => void;
}

const STEPS: Array<{ id: string; label: TranslationKey }> = [
	{ id: "class", label: "wizard.step.class" },
	{ id: "subclass", label: "wizard.step.subclass" },
	{ id: "ancestry", label: "wizard.step.ancestry" },
	{ id: "community", label: "wizard.step.community" },
	{ id: "transformation", label: "wizard.step.transformation" },
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
	const language = useLanguage();
	const classes = getSrdClasses(language);
	const communities = getSrdCommunities(language);
	const [step, setStep] = useState(0);
	const [choices, setChoices] = useState<CreationChoices>({});

	const srdClass = classes.find((c) => c.id === choices.classId);
	const classDomains = srdClass?.domains;

	const pick = (patch: Partial<CreationChoices>, advance = true) => {
		setChoices((c) => ({ ...c, ...patch }));
		if (advance) setStep((s) => Math.min(s + 1, STEPS.length - 1));
	};

	// Choosing a different class invalidates subclass/domain-card picks
	const pickClass = (id: string) =>
		pick({ classId: id, subclassId: undefined, domainCardIds: [] });

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
				{step === 0 && <ClassStep selected={choices.classId} onPick={pickClass} />}
				{step === 1 && (
					<SubclassStep
						srdClass={srdClass}
						selected={choices.subclassId}
						onPick={(id) => pick({ subclassId: id })}
					/>
				)}
				{step === 2 && (
					<AncestryStep
						selected={choices.ancestryId}
						selected2={choices.ancestryId2}
						onPick={pick}
					/>
				)}
				{step === 3 && (
					<HeritageStep
						options={communities}
						kind="community"
						selected={choices.communityId}
						onPick={(id) => pick({ communityId: id })}
					/>
				)}
				{step === 4 && (
					<TransformationStep
						selected={choices.transformationId}
						onPick={(id) => pick({ transformationId: id })}
					/>
				)}
				{step === 5 && (
					<ExperiencesStep
						experiences={choices.experiences ?? ["", ""]}
						onChange={(experiences) => pick({ experiences }, false)}
					/>
				)}
				{step === 6 && (
					<DomainCardsStep
						classDomains={classDomains}
						selected={choices.domainCardIds ?? []}
						onChange={(ids) => pick({ domainCardIds: ids }, false)}
					/>
				)}
				{step === 7 && <ReviewStep choices={choices} />}
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
		case 0: return Boolean(choices.classId);
		case 1: return Boolean(choices.subclassId);
		case 2: return Boolean(choices.ancestryId);
		case 3: return Boolean(choices.communityId);
		case 4: return Boolean(choices.transformationId);
		case 5: return (choices.experiences ?? []).some((e) => e.trim() !== "");
		case 6: return (choices.domainCardIds ?? []).length > 0;
		default: return true;
	}
}

// ── Master-detail building blocks ─────────────────────────────────────────────

const accentStyle = (accent?: string) =>
	accent ? ({ "--df-cs-row-accent": accent } as React.CSSProperties) : undefined;

function classColor(srdClass: SrdClass): string | undefined {
	const canonicalName = getSrdClasses("en").find((item) => item.id === srdClass.id)?.name;
	return CLASS_COLORS[canonicalName ?? srdClass.name];
}

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

function ClassStep({ selected, onPick }: { selected?: string; onPick: (id: string) => void }) {
	const t = useTranslation();
	const classes = getSrdClasses(useLanguage());
	const [openId, setOpenId] = useState<string | null>(selected ?? classes[0]?.id ?? null);
	const open = classes.find((c) => c.id === openId);
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.class.hint")}</p>
			<WizardSplit
				list={classes.map((c) => (
					<WizardRow
						key={c.id}
						selected={selected === c.id}
						active={openId === c.id}
						accent={classColor(c)}
						onClick={() => setOpenId(c.id)}
						icons={c.domains.map((domain) => (
							<DomainIcon key={domain.id} domain={domain.name} className="df-cs-domain-icon" style={{ color: DOMAIN_COLORS[domain.name] }} />
						))}
						name={c.name}
						meta={c.stats.domains}
					/>
				))}
				detail={
					open ? (
						<WizardDetail
							accent={classColor(open)}
							title={
								<>
									{open.domains.map((domain) => (
										<DomainIcon key={domain.id} domain={domain.name} className="df-cs-domain-icon" style={{ color: DOMAIN_COLORS[domain.name] }} />
									))}
									{open.name}
								</>
							}
							meta={t("wizard.class.meta", { evasion: open.stats.evasion, hp: open.stats.hp })}
							chooseLabel={t("wizard.choose", { name: open.name })}
							onChoose={() => onPick(open.id)}
							onClose={() => setOpenId(null)}
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
	onPick: (id: string) => void;
}) {
	const t = useTranslation();
	const language = useLanguage();
	const [openId, setOpenId] = useState<string | null>(
		selected ?? srdClass?.subclasses[0]?.id ?? null,
	);
	if (!srdClass) {
		return <p className="df-cs-wizard-hint">{t("wizard.subclass.noClass")}</p>;
	}
	const accent = classColor(srdClass);
	const open = srdClass.subclasses.find((subclass) => subclass.id === openId);
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.subclass.hint", { className: srdClass.name })}</p>
			<WizardSplit
				list={srdClass.subclasses.map((sub) => (
					<WizardRow
						key={sub.id}
						selected={selected === sub.id}
						active={openId === sub.id}
						accent={accent}
						onClick={() => setOpenId(sub.id)}
						name={sub.name}
						meta={sub.spellcastTrait ? t("wizard.subclass.spellcast", { trait: gameTerm(sub.spellcastTrait, language) }) : undefined}
					/>
				))}
				detail={
					open ? (
						<WizardDetail
							accent={accent}
							title={open.name}
							meta={open.spellcastTrait ? t("wizard.subclass.spellcast", { trait: gameTerm(open.spellcastTrait, language) }) : undefined}
							chooseLabel={t("wizard.choose", { name: open.name })}
							onChoose={() => onPick(open.id)}
							onClose={() => setOpenId(null)}
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
	onPick: (id: string) => void;
}) {
	const t = useTranslation();
	const [openId, setOpenId] = useState<string | null>(selected ?? options[0]?.id ?? null);
	const open = options.find((h) => h.id === openId);
	return (
		<WizardSplit
			list={options.map((h) => (
				<WizardRow
					key={h.id}
					selected={selected === h.id}
					active={openId === h.id}
					onClick={() => setOpenId(h.id)}
					name={h.name}
					meta={h.features.map((f) => f.split(":")[0]).join(" · ")}
				/>
			))}
			detail={
				open ? (
					<WizardDetail
						title={open.name}
						chooseLabel={t("wizard.choose", { name: open.name })}
						onChoose={() => onPick(open.id)}
						onClose={() => setOpenId(null)}
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
	const ancestries = getSrdAncestries(useLanguage());
	const [openId, setOpenId] = useState<string | null>(
		selected ?? ancestries[0]?.id ?? null,
	);
	const mixed = selected2 !== undefined;
	const open = ancestries.find((h) => h.id === openId);
	const primary = ancestries.find((h) => h.id === selected);
	const secondary = ancestries.find((h) => h.id === selected2);

	const toggleMixed = () => {
		// Entering mixed mode keeps the current pick as the primary ancestry;
		// leaving it drops the secondary.
		onPick({ ancestryId2: mixed ? undefined : "" }, false);
	};

	const choose = (id: string) => {
		if (!mixed) {
			onPick({ ancestryId: id });
			return;
		}
		if (!selected) {
			onPick({ ancestryId: id }, false);
			return;
		}
		if (id === selected) return;
		onPick({ ancestryId2: id });
	};

	const chooseLabel = (id: string, name: string) => {
		if (!mixed) return t("wizard.choose", { name });
		if (!selected) return t("wizard.ancestry.useFirst", { name });
		if (id === selected) return t("wizard.ancestry.pickedFirst");
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
								? t("wizard.ancestry.pickSecond", { name: primary?.name ?? "" })
								: t("wizard.ancestry.summary", {
									first: primary?.name ?? "",
									second: secondary?.name ?? "",
								})
						: t("wizard.ancestry.mixedPrompt")}
				</span>
			</div>
			<WizardSplit
				list={ancestries.map((h) => {
					const isPrimary = selected === h.id;
					const isSecondary = mixed && selected2 === h.id;
					return (
						<WizardRow
							key={h.id}
							selected={isPrimary || isSecondary}
							active={openId === h.id}
							onClick={() => setOpenId(h.id)}
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
							chooseLabel={chooseLabel(open.id, open.name)}
							chooseDisabled={mixed && open.id === selected}
							onChoose={() => choose(open.id)}
							onClose={() => setOpenId(null)}
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

function TransformationStep({ selected, onPick }: { selected?: string; onPick: (id: string) => void }) {
	const t = useTranslation();
	const transformations = getSrdTransformations(useLanguage());
	const [openId, setOpenId] = useState<string | null>(selected ?? transformations[0]?.id ?? null);
	const open = transformations.find((item) => item.id === openId);
	return (
		<>
			<p className="df-cs-wizard-hint">{t("wizard.transformation.hint")}</p>
			<WizardSplit
				list={transformations.map((item) => (
					<WizardRow
						key={item.id}
						selected={selected === item.id}
						active={openId === item.id}
						onClick={() => setOpenId(item.id)}
						name={item.name}
						meta={item.features.map((feature) => feature.name).join(" · ")}
					/>
				))}
				detail={open ? (
					<WizardDetail
						title={open.name}
						chooseLabel={t("wizard.choose", { name: open.name })}
						onChoose={() => onPick(open.id)}
						onClose={() => setOpenId(null)}
					>
						<TransformationDetail transformation={open} />
					</WizardDetail>
				) : <WizardPlaceholder text={t("wizard.transformation.placeholder")} />}
			/>
		</>
	);
}

function TransformationDetail({ transformation }: { transformation: SrdTransformation }) {
	return (
		<>
			<CardText text={transformation.description.join("\n\n")} />
			{transformation.features.map((feature) => (
				<div key={feature.name}>
					<p className="df-cs-cardtext-p"><strong>{feature.name}</strong></p>
					<CardText text={feature.description} />
				</div>
			))}
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
	classDomains?: [SrdDomainRef, SrdDomainRef];
	selected: string[];
	onChange: (ids: string[]) => void;
}) {
	const t = useTranslation();
	const language = useLanguage();
	const allCards = getSrdDomainCards(language);
	const cards = allCards.filter(
		(c) => c.level === 1 && (!classDomains || classDomains.some((domain) => domain.id === c.domainId)),
	);
	const [openId, setOpenId] = useState<string | null>(selected[0] ?? cards[0]?.id ?? null);
	const open = cards.find((c) => c.id === openId);

	const domains = [...new Set(cards.map((c) => c.domain))];
	const toggle = (card: SrdDomainCard) => {
		if (selected.includes(card.id)) {
			onChange(selected.filter((id) => id !== card.id));
		} else if (selected.length < 2) {
			onChange([...selected, card.id]);
		}
	};

	const openPicked = open ? selected.includes(open.id) : false;
	return (
		<>
			<p className="df-cs-wizard-hint">
				{classDomains
					? t("wizard.domain.hintForClass", { first: gameTerm(classDomains[0].name, language), second: gameTerm(classDomains[1].name, language) })
					: t("wizard.domain.hint")}
			</p>
			<WizardSplit
				list={domains.map((domain) => {
					const color = DOMAIN_COLORS[domain] ?? "var(--df-cs-mid)";
					return (
						<React.Fragment key={domain}>
							<span className="df-cs-wiz-sub" style={{ color }}>
								<DomainIcon domain={domain} className="df-cs-domain-icon" style={{ color }} />
								{gameTerm(domain, language)}
							</span>
							{cards
								.filter((c) => c.domain === domain)
								.map((card) => (
									<WizardRow
										key={card.id}
										selected={selected.includes(card.id)}
										active={openId === card.id}
										accent={color}
										onClick={() => setOpenId(card.id)}
										name={card.name}
										meta={<>{gameTerm(card.type, language)} · <ZapIcon />{card.recallCost}</>}
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
							meta={`${gameTerm(open.domain, language)} · ${gameTerm(open.type, language)} · ${t("wizard.domain.recall", { cost: open.recallCost })}`}
							footNote={t("wizard.domain.picked", { count: selected.length })}
							chooseLabel={openPicked ? t("wizard.domain.remove") : t("wizard.domain.add")}
							chooseDisabled={!openPicked && selected.length >= 2}
							onChoose={() => toggle(open)}
							onClose={() => setOpenId(null)}
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
	const language = useLanguage();
	const classes = getSrdClasses(language);
	const ancestries = getSrdAncestries(language);
	const communities = getSrdCommunities(language);
	const cards = getSrdDomainCards(language);
	const transformations = getSrdTransformations(language);
	const srdClass = classes.find((item) => item.id === choices.classId);
	const subclass = srdClass?.subclasses.find((item) => item.id === choices.subclassId);
	const primaryAncestry = ancestries.find((item) => item.id === choices.ancestryId);
	const secondaryAncestry = ancestries.find((item) => item.id === choices.ancestryId2);
	const community = communities.find((item) => item.id === choices.communityId);
	const transformation = transformations.find((item) => item.id === choices.transformationId);
	const ancestry = secondaryAncestry
		? `${primaryAncestry?.name ?? "-"} / ${secondaryAncestry.name} (${t("wizard.review.mixed")})`
		: primaryAncestry?.name;
	const domainCards = (choices.domainCardIds ?? [])
		.map((id) => cards.find((card) => card.id === id)?.name)
		.filter((name): name is string => Boolean(name));
	const experiences = (choices.experiences ?? []).filter((e) => e.trim() !== "");
	const rows: Array<[string, string]> = [
		[t("wizard.review.class"), srdClass?.name ?? "-"],
		[t("wizard.review.subclass"), subclass?.name ?? "-"],
		[t("wizard.review.ancestry"), ancestry || "-"],
		[t("wizard.review.community"), community?.name ?? "-"],
		[t("wizard.review.transformation"), transformation?.name ?? "-"],
		[t("wizard.review.experiences"), experiences.map((e) => `${e} (+2)`).join(", ") || "-"],
		[t("wizard.review.domainCards"), domainCards.join(", ") || "-"],
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
