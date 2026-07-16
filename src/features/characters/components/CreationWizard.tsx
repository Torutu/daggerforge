import React, { useState } from "react";
import { CLASS_DOMAINS, DOMAIN_COLORS, SrdClass, SrdDomainCard, SrdHeritage, SrdSubclass } from "../../../types/srd";
import {
	SRD_ANCESTRIES,
	SRD_CLASSES,
	SRD_COMMUNITIES,
	SRD_DOMAIN_CARDS,
} from "../../../data/srd";
import { CreationChoices } from "../creationTemplate";
import { CardText } from "./CardText";
import { DomainIcon, DomainSprite } from "./DomainArt";
import { domainTint } from "./SheetSections";

interface Props {
	onComplete: (choices: CreationChoices) => void;
	onCancel: () => void;
}

const STEPS = ["Class", "Subclass", "Ancestry", "Community", "Experiences", "Domain Cards", "Review"] as const;

/**
 * Guided character creation following the SRD steps. Every step can be
 * skipped; the result lands in the sheet unsaved so the player can adjust
 * anything before saving.
 */
export function CreationWizard({ onComplete, onCancel }: Props) {
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
				<h2 className="df-cs-wizard-title">Guided character creation</h2>
				<button type="button" className="df-cs-card-remove" aria-label="Cancel creation" onClick={onCancel}>
					✕
				</button>
			</div>
			<div className="df-cs-wizard-steps">
				{STEPS.map((label, i) => (
					<button
						key={label}
						type="button"
						className={
							"df-cs-wizard-step" +
							(i === step ? " is-active" : "") +
							(i < step ? " is-done" : "")
						}
						onClick={() => setStep(i)}
					>
						{i + 1}. {label}
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
					Back
				</button>
				{step < STEPS.length - 1 ? (
					<button type="button" onClick={next}>
						{stepIsAnswered(step, choices) ? "Next" : "Skip"}
					</button>
				) : (
					<button type="button" className="mod-cta" onClick={() => onComplete(choices)}>
						Create character
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

// ── Option cards + detail panel ───────────────────────────────────────────────
// Cards stay compact in the grid; clicking one opens its full description in a
// stable panel above the grid (no mid-grid reflow jumps), with the Choose
// button inside the panel. Works the same on desktop and mobile.

function WizardCard({
	head,
	meta,
	preview,
	selected,
	active,
	onClick,
}: {
	head: React.ReactNode;
	meta?: React.ReactNode;
	preview: React.ReactNode;
	selected: boolean;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className={
				"df-cs-wizard-card" +
				(selected ? " is-selected" : "") +
				(active ? " is-active" : "")
			}
			aria-expanded={active}
			onClick={onClick}
		>
			<span className="df-cs-wizard-card-head">{head}</span>
			{meta && <span className="df-cs-wizard-card-meta">{meta}</span>}
			<span className="df-cs-wizard-card-text">{preview}</span>
		</button>
	);
}

function WizardDetailPanel({
	title,
	meta,
	children,
	chooseLabel,
	chooseDisabled,
	onChoose,
	onClose,
}: {
	title: React.ReactNode;
	meta?: React.ReactNode;
	children: React.ReactNode;
	chooseLabel: string;
	chooseDisabled?: boolean;
	onChoose: () => void;
	onClose: () => void;
}) {
	return (
		<div className="df-cs-wizard-detail">
			<div className="df-cs-wizard-detail-head">
				<span className="df-cs-wizard-card-name">{title}</span>
				{meta && <span className="df-cs-wizard-card-meta">{meta}</span>}
				<button type="button" className="df-cs-card-remove" aria-label="Close details" onClick={onClose}>
					✕
				</button>
			</div>
			<div className="df-cs-wizard-detail-body">{children}</div>
			<button type="button" className="mod-cta df-cs-wizard-choose" disabled={chooseDisabled} onClick={onChoose}>
				{chooseLabel}
			</button>
		</div>
	);
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function ClassStep({ selected, onPick }: { selected?: string; onPick: (name: string) => void }) {
	const [openName, setOpenName] = useState<string | null>(null);
	const open = SRD_CLASSES.find((c) => c.name === openName);
	return (
		<>
			<p className="df-cs-wizard-hint">
				Click a class to read its full description, then choose it. Its evasion, suggested
				traits, features, and starting equipment fill the sheet — everything stays editable
				afterwards.
			</p>
			{open && (
				<WizardDetailPanel
					title={
						<>
							{(CLASS_DOMAINS[open.name] ?? []).map((d) => (
								<DomainIcon key={d} domain={d} style={{ color: DOMAIN_COLORS[d] }} />
							))}{" "}
							{open.name}
						</>
					}
					meta={`${open.stats.domains} · Evasion ${open.stats.evasion} · HP ${open.stats.hp}`}
					chooseLabel={`Choose ${open.name}`}
					onChoose={() => onPick(open.name)}
					onClose={() => setOpenName(null)}
				>
					<ClassDetail srdClass={open} />
				</WizardDetailPanel>
			)}
			<div className="df-cs-wizard-grid">
				{SRD_CLASSES.map((c) => {
					const domains = CLASS_DOMAINS[c.name] ?? [];
					return (
						<WizardCard
							key={c.name}
							selected={selected === c.name}
							active={openName === c.name}
							onClick={() => setOpenName(openName === c.name ? null : c.name)}
							head={
								<>
									{domains.map((d) => (
										<DomainIcon key={d} domain={d} style={{ color: DOMAIN_COLORS[d] }} />
									))}
									<span className="df-cs-wizard-card-name">{c.name}</span>
								</>
							}
							meta={`${c.stats.domains} · Evasion ${c.stats.evasion} · HP ${c.stats.hp}`}
							preview={c.description[0]}
						/>
					);
				})}
			</div>
		</>
	);
}

function ClassDetail({ srdClass }: { srdClass: SrdClass }) {
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
				<strong>Suggested traits:</strong> {srdClass.stats.suggestedTraits} ·{" "}
				<strong>Suggested equipment:</strong> {suggested}
			</p>
			<p className="df-cs-cardtext-p">
				<strong>Hope Feature — </strong>
				{srdClass.hopeFeature}
			</p>
			{srdClass.classFeatures.map((f) => (
				<p key={f.name} className="df-cs-cardtext-p">
					<strong>{f.name}: </strong>
					{f.description}
				</p>
			))}
			<p className="df-cs-cardtext-p">
				<strong>Starting item: </strong>
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
	const [openName, setOpenName] = useState<string | null>(null);
	if (!srdClass) {
		return <p className="df-cs-wizard-hint">Pick a class first (or skip this step).</p>;
	}
	const open = openName ? srdClass.subclasses[openName] : undefined;
	return (
		<>
			<p className="df-cs-wizard-hint">
				Click a {srdClass.name} subclass to read its foundation features, then choose it.
			</p>
			{open && (
				<WizardDetailPanel
					title={open.name}
					meta={open.spellcastTrait ? `Spellcast: ${open.spellcastTrait}` : undefined}
					chooseLabel={`Choose ${open.name}`}
					onChoose={() => onPick(open.name)}
					onClose={() => setOpenName(null)}
				>
					<SubclassDetail subclass={open} />
				</WizardDetailPanel>
			)}
			<div className="df-cs-wizard-grid">
				{Object.values(srdClass.subclasses).map((sub) => (
					<WizardCard
						key={sub.name}
						selected={selected === sub.name}
						active={openName === sub.name}
						onClick={() => setOpenName(openName === sub.name ? null : sub.name)}
						head={<span className="df-cs-wizard-card-name">{sub.name}</span>}
						meta={sub.spellcastTrait ? `Spellcast: ${sub.spellcastTrait}` : undefined}
						preview={sub.foundation.map((f) => f.name).join(" · ")}
					/>
				))}
			</div>
		</>
	);
}

function SubclassDetail({ subclass }: { subclass: SrdSubclass }) {
	return (
		<>
			{subclass.foundation.map((f) => (
				<div key={f.name}>
					<p className="df-cs-cardtext-p">
						<strong>{f.name}</strong> (foundation)
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
	selected,
	onPick,
}: {
	options: SrdHeritage[];
	selected?: string;
	onPick: (name: string) => void;
}) {
	const [openName, setOpenName] = useState<string | null>(null);
	const open = options.find((h) => h.name === openName);
	return (
		<>
			{open && (
				<WizardDetailPanel
					title={open.name}
					chooseLabel={`Choose ${open.name}`}
					onChoose={() => onPick(open.name)}
					onClose={() => setOpenName(null)}
				>
					<HeritageDetail heritage={open} />
				</WizardDetailPanel>
			)}
			<div className="df-cs-wizard-grid">
				{options.map((h) => (
					<WizardCard
						key={h.name}
						selected={selected === h.name}
						active={openName === h.name}
						onClick={() => setOpenName(openName === h.name ? null : h.name)}
						head={<span className="df-cs-wizard-card-name">{h.name}</span>}
						preview={h.features.map((f) => f.split(":")[0]).join(" · ")}
					/>
				))}
			</div>
		</>
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
	const [openName, setOpenName] = useState<string | null>(null);
	const mixed = selected2 !== undefined;
	const open = SRD_ANCESTRIES.find((h) => h.name === openName);

	const toggleMixed = () => {
		// Entering mixed mode keeps the current pick as the primary ancestry;
		// leaving it drops the secondary.
		onPick({ ancestryName2: mixed ? undefined : "" }, false);
	};

	const choose = (name: string) => {
		setOpenName(null);
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
		if (!mixed) return `Choose ${name}`;
		if (!selected) return `Use ${name}'s 1st feature`;
		if (name === selected) return "Picked as 1st feature";
		return `Use ${name}'s 2nd feature`;
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
					Mixed ancestry
				</button>
				<span className="df-cs-wizard-hint df-cs-wizard-hint--inline">
					{mixed
						? !selected
							? "Pick the ancestry whose FIRST feature you take."
							: !selected2
								? `First feature: ${selected}. Now pick the ancestry whose SECOND feature you take.`
								: `${selected} (1st feature) + ${selected2} (2nd feature)`
						: "Combine two ancestries: the first feature of one and the second feature of another."}
				</span>
			</div>
			{open && (
				<WizardDetailPanel
					title={open.name}
					chooseLabel={chooseLabel(open.name)}
					chooseDisabled={mixed && open.name === selected}
					onChoose={() => choose(open.name)}
					onClose={() => setOpenName(null)}
				>
					<HeritageDetail heritage={open} />
				</WizardDetailPanel>
			)}
			<div className="df-cs-wizard-grid">
				{SRD_ANCESTRIES.map((h) => {
					const isPrimary = selected === h.name;
					const isSecondary = mixed && selected2 === h.name;
					return (
						<WizardCard
							key={h.name}
							selected={isPrimary || isSecondary}
							active={openName === h.name}
							onClick={() => setOpenName(openName === h.name ? null : h.name)}
							head={
								<>
									<span className="df-cs-wizard-card-name">{h.name}</span>
									{mixed && isPrimary && <span className="df-cs-wizard-tag">1st feature</span>}
									{isSecondary && <span className="df-cs-wizard-tag">2nd feature</span>}
								</>
							}
							preview={h.features.map((f) => f.split(":")[0]).join(" · ")}
						/>
					);
				})}
			</div>
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
	const setAt = (index: number, value: string) => {
		const next = [...experiences];
		next[index] = value;
		onChange(next);
	};
	return (
		<>
			<p className="df-cs-wizard-hint">
				Write two Experiences — short phrases about your character's background that they can
				spend Hope on during play. Both start at +2. Examples: "Raised by wolves",
				"Ex-royal guard", "Silver-tongued merchant", "Apprentice herbalist".
			</p>
			<div className="df-cs-wizard-experiences">
				{[0, 1].map((i) => (
					<label key={i} className="df-cs-wizard-exp-row">
						<span className="df-cs-wizard-exp-mod">+2</span>
						<input
							type="text"
							className="df-cs-wizard-exp-input"
							placeholder={i === 0 ? "e.g. Raised by wolves" : "e.g. Ex-royal guard"}
							value={experiences[i] ?? ""}
							onChange={(e) => setAt(i, e.target.value)}
						/>
					</label>
				))}
			</div>
		</>
	);
}

function DomainCardsStep({
	classDomains,
	selected,
	onChange,
}: {
	classDomains?: [string, string];
	selected: string[];
	onChange: (names: string[]) => void;
}) {
	const cards = SRD_DOMAIN_CARDS.filter(
		(c) => c.level === 1 && (!classDomains || classDomains.includes(c.domain)),
	);
	const toggle = (card: SrdDomainCard) => {
		if (selected.includes(card.name)) {
			onChange(selected.filter((n) => n !== card.name));
		} else if (selected.length < 2) {
			onChange([...selected, card.name]);
		}
	};
	return (
		<>
			<p className="df-cs-wizard-hint">
				Choose two level-1 cards{classDomains ? ` from ${classDomains[0]} or ${classDomains[1]}` : ""} ({selected.length}/2 picked).
			</p>
			<div className="df-cs-wizard-list">
				{cards.map((card) => {
					const color = DOMAIN_COLORS[card.domain] ?? "var(--df-cs-mid)";
					const isPicked = selected.includes(card.name);
					return (
						<button
							key={card.name}
							type="button"
							className={"df-cs-wizard-dcard" + (isPicked ? " is-selected" : "")}
							style={{ borderLeftColor: color, background: isPicked ? domainTint(card.domain, 0.14) : undefined }}
							aria-pressed={isPicked}
							onClick={() => toggle(card)}
						>
							<span className="df-cs-dcard-head">
								<span className="df-cs-dcard-level" style={{ background: color }}>{card.level}</span>
								<DomainIcon domain={card.domain} className="df-cs-dcard-icon" style={{ color }} />
								<span className="df-cs-dcard-name">{card.name}</span>
								<span className="df-cs-dcard-meta">{card.domain} · {card.type} · ⚡{card.recallCost}</span>
							</span>
							<span className="df-cs-wizard-dcard-body">
								<CardText text={card.text} />
							</span>
						</button>
					);
				})}
			</div>
		</>
	);
}

function ReviewStep({ choices }: { choices: CreationChoices }) {
	const ancestry = choices.ancestryName2
		? `${choices.ancestryName} / ${choices.ancestryName2} (mixed)`
		: choices.ancestryName;
	const experiences = (choices.experiences ?? []).filter((e) => e.trim() !== "");
	const rows: Array<[string, string]> = [
		["Class", choices.className ?? "—"],
		["Subclass", choices.subclassName ?? "—"],
		["Ancestry", ancestry || "—"],
		["Community", choices.communityName ?? "—"],
		["Experiences", experiences.map((e) => `${e} (+2)`).join(", ") || "—"],
		["Domain cards", (choices.domainCardNames ?? []).join(", ") || "—"],
	];
	return (
		<>
			<p className="df-cs-wizard-hint">
				The sheet will be filled from these choices, plus level 1, two starting Hope, one handful
				of gold, and the standard starting inventory. Nothing is saved until you press Save.
			</p>
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
