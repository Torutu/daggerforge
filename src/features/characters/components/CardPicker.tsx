import React, { useMemo, useState } from "react";
import { CharacterData, HeritageCardData } from "../../../types/character";
import {
	DOMAIN_CARD_TYPES,
	DOMAIN_COLORS,
	DOMAIN_NAMES,
	GEAR_KIND_LABELS,
	GearData,
	SrdDomainCard,
	SrdHeritage,
} from "../../../types/srd";
import { ALL_GEAR, SRD_ANCESTRIES, SRD_COMMUNITIES, SRD_DOMAIN_CARDS, SRD_EQUIPMENT } from "../../../data/srd";
import { armorToPatch, composeMixedHeritage, toCharacterWeapon, toHeritageCard } from "../creationTemplate";
import { CardText } from "./CardText";
import { DomainIcon } from "./DomainArt";
import { ZapIcon } from "./SheetFields";
import { domainTint, PickerTab } from "./SheetSections";

interface Props {
	char: CharacterData;
	update: (patch: Partial<CharacterData>) => void;
	tab: PickerTab;
	onTabChange: (tab: PickerTab) => void;
	onClose: () => void;
	/** User-created gear, shown alongside SRD items. */
	customItems?: GearData[];
}

/**
 * Inline gallery of SRD cards (ancestries, communities, domain abilities).
 * Players browse/filter and add cards to the open character.
 */
export function CardPicker({ char, update, tab, onTabChange, onClose, customItems }: Props) {
	const [search, setSearch] = useState("");
	const [domains, setDomains] = useState<Set<string>>(new Set());
	const [level, setLevel] = useState("All");
	const [type, setType] = useState("All");
	const [expanded, setExpanded] = useState<string | null>(null);
	// Mixed ancestry: first pick supplies the 1st feature, second pick the 2nd
	const [mixedMode, setMixedMode] = useState(false);
	const [mixedPrimary, setMixedPrimary] = useState<SrdHeritage | null>(null);

	const toggleDomain = (name: string) => {
		setDomains((current) => {
			const next = new Set(current);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});
	};

	const query = search.trim().toLowerCase();

	const domainCards = useMemo(() => {
		if (tab !== "domain") return [];
		return SRD_DOMAIN_CARDS.filter((c) => {
			if (domains.size > 0 && !domains.has(c.domain)) return false;
			if (level !== "All" && c.level !== Number(level)) return false;
			if (type !== "All" && c.type !== type) return false;
			if (query && !(c.name.toLowerCase().includes(query) || c.text.toLowerCase().includes(query))) return false;
			return true;
		});
	}, [tab, domains, level, type, query]);

	const heritages = useMemo(() => {
		if (tab === "domain") return [];
		const source = tab === "ancestry" ? SRD_ANCESTRIES : SRD_COMMUNITIES;
		if (!query) return source;
		return source.filter(
			(h) =>
				h.name.toLowerCase().includes(query) ||
				h.features.some((f) => f.toLowerCase().includes(query)),
		);
	}, [tab, query]);

	const applyHeritageCard = (card: HeritageCardData) => {
		const patch: Partial<CharacterData> =
			tab === "ancestry" ? { ancestryCard: card } : { communityCard: card };
		const nextAncestry = tab === "ancestry" ? card.name : char.ancestryCard?.name;
		const nextCommunity = tab === "community" ? card.name : char.communityCard?.name;
		const autoHeritage = composeHeritage(char.ancestryCard?.name, char.communityCard?.name);
		if (!char.heritage.trim() || char.heritage === autoHeritage) {
			patch.heritage = composeHeritage(nextAncestry, nextCommunity);
		}
		update(patch);
	};

	const addHeritage = (h: SrdHeritage) => {
		if (tab === "ancestry" && mixedMode) {
			if (!mixedPrimary) {
				setMixedPrimary(h);
				return;
			}
			applyHeritageCard(composeMixedHeritage(mixedPrimary, h));
			setMixedPrimary(null);
			return;
		}
		applyHeritageCard(toHeritageCard(h));
	};

	const addDomainCard = (c: SrdDomainCard) =>
		update({ domainCards: [...char.domainCards, { ...c, inVault: false }] });

	const isDomainCardAdded = (c: SrdDomainCard) =>
		char.domainCards.some((existing) => existing.name === c.name);

	// Equipment tab: weapons/wheelchairs slot into primary/secondary, armor equips
	const equipment = useMemo(() => {
		if (tab !== "equipment") return [];
		return [
			...SRD_EQUIPMENT.weapons.map((w) => ({ kind: "weapon" as const, gear: w })),
			...SRD_EQUIPMENT.wheelchairs.map((w) => ({ kind: "wheelchair" as const, gear: w })),
			...SRD_EQUIPMENT.armor.map((a) => ({ kind: "armor" as const, gear: a })),
		].filter(({ gear }) => {
			if (level !== "All" && gear.tier !== Number(level)) return false;
			if (query && !gear.name.toLowerCase().includes(query)) return false;
			return true;
		});
	}, [tab, level, query]);

	// Items tab: SRD items/consumables + the vault's custom gear
	const looseItems = useMemo(() => {
		if (tab !== "item") return [];
		return [...(customItems ?? []), ...ALL_GEAR.filter((g) => g.kind === "item" || g.kind === "consumable")].filter(
			(g) =>
				!query ||
				g.name.toLowerCase().includes(query) ||
				g.text.toLowerCase().includes(query),
		);
	}, [tab, query, customItems]);

	const addToInventory = (g: GearData) => {
		const line = g.kind === "consumable" ? `${g.name} (consumable)` : g.name;
		update({ inventory: char.inventory.trim() ? `${char.inventory}\n${line}` : line });
	};

	return (
		<div className="df-cs-picker">
			<div className="df-cs-picker-head">
				{(
					[
						["ancestry", "Ancestries"],
						["community", "Communities"],
						["domain", "Domain Cards"],
						["equipment", "Equipment"],
						["item", "Items"],
					] as Array<[PickerTab, string]>
				).map(([key, label]) => (
					<button
						key={key}
						type="button"
						className={"df-cs-picker-tab" + (tab === key ? " is-active" : "")}
						onClick={() => {
							onTabChange(key);
							setExpanded(null);
						}}
					>
						{label}
					</button>
				))}
				<button type="button" className="df-cs-card-remove" aria-label="Close card picker" onClick={onClose}>
					✕
				</button>
			</div>

			<div className="df-cs-picker-filters">
				<input
					type="text"
					className="df-cs-picker-search"
					placeholder="Search cards…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				{tab === "ancestry" && (
					<div className="df-cs-picker-mixed">
						<button
							type="button"
							className={"df-cs-check" + (mixedMode ? " is-on" : "")}
							aria-pressed={mixedMode}
							onClick={() => {
								setMixedMode(!mixedMode);
								setMixedPrimary(null);
							}}
						>
							<span className="df-cs-check-box" />
							Mixed ancestry
						</button>
						<span className="df-cs-picker-mixed-hint">
							{mixedMode
								? mixedPrimary
									? `1st feature: ${mixedPrimary.name} - now add the ancestry for the 2nd feature.`
									: "Add the ancestry whose FIRST feature you take."
								: "Combine two ancestries: the first feature of one, the second of another."}
						</span>
					</div>
				)}
				{tab === "equipment" && (
					<div className="df-cs-picker-selects">
						<select className="dropdown" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Tier filter">
							<option value="All">All tiers</option>
							{[1, 2, 3, 4].map((t) => (
								<option key={t} value={String(t)}>Tier {t}</option>
							))}
						</select>
					</div>
				)}
				{tab === "domain" && (
					<>
						<div className="df-cs-picker-domains">
							{DOMAIN_NAMES.map((name) => {
								const active = domains.has(name);
								const color = DOMAIN_COLORS[name];
								return (
									<button
										key={name}
										type="button"
										className={"df-cs-picker-chip" + (active ? " is-active" : "")}
										style={{
											borderColor: color,
											color,
											background: active ? domainTint(name, 0.18) : "transparent",
										}}
										aria-pressed={active}
										onClick={() => toggleDomain(name)}
									>
										<DomainIcon domain={name} className="df-cs-picker-chip-icon" />
										{name}
									</button>
								);
							})}
						</div>
						<div className="df-cs-picker-selects">
							<select className="dropdown" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level filter">
								<option value="All">All levels</option>
								{Array.from({ length: 10 }, (_, i) => (
									<option key={i + 1} value={String(i + 1)}>
										Level {i + 1}
									</option>
								))}
							</select>
							<select className="dropdown" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type filter">
								<option value="All">All types</option>
								{DOMAIN_CARD_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</div>
					</>
				)}
			</div>

			<div className="df-cs-picker-list">
				{tab === "domain" &&
					domainCards.map((card) => (
						<PickerDomainRow
							key={card.name}
							card={card}
							expanded={expanded === card.name}
							added={isDomainCardAdded(card)}
							onToggle={() => setExpanded(expanded === card.name ? null : card.name)}
							onAdd={() => addDomainCard(card)}
						/>
					))}
				{(tab === "ancestry" || tab === "community") &&
					heritages.map((h) => {
						const mixing = tab === "ancestry" && mixedMode;
						return (
							<PickerHeritageRow
								key={h.name}
								heritage={h}
								expanded={expanded === h.name}
								added={
									!mixing &&
									(tab === "ancestry" ? char.ancestryCard : char.communityCard)?.name === h.name
								}
								addLabel={
									mixing ? (mixedPrimary ? "2nd feature" : "1st feature") : "Add"
								}
								pending={mixing && mixedPrimary?.name === h.name}
								onToggle={() => setExpanded(expanded === h.name ? null : h.name)}
								onAdd={() => addHeritage(h)}
							/>
						);
					})}
				{tab === "equipment" &&
					equipment.map(({ kind, gear }) => (
						<div key={gear.id} className={"df-cs-pick" + (expanded === gear.id ? " is-expanded" : "")}>
							<button
								type="button"
								className="df-cs-pick-row df-cs-pick-row--gear"
								onClick={() => setExpanded(expanded === gear.id ? null : gear.id)}
								aria-expanded={expanded === gear.id}
							>
								<span className="df-cs-pick-name">{gear.name}</span>
								<span className="df-cs-pick-meta">
									Tier {gear.tier} · {kind === "armor"
										? `Thresholds ${(gear as typeof SRD_EQUIPMENT.armor[number]).minor}/${(gear as typeof SRD_EQUIPMENT.armor[number]).major} · Score ${(gear as typeof SRD_EQUIPMENT.armor[number]).score}`
										: `${(gear as typeof SRD_EQUIPMENT.weapons[number]).trait} - ${(gear as typeof SRD_EQUIPMENT.weapons[number]).range} · ${(gear as typeof SRD_EQUIPMENT.weapons[number]).damage}`}
								</span>
							</button>
							{expanded === gear.id && gear.feature && (
								<div className="df-cs-pick-detail">
									<CardText text={gear.feature} />
								</div>
							)}
							<div className="df-cs-pick-actions">
								{kind === "armor" ? (
									<button
										type="button"
										className="df-cs-pick-add"
										onClick={() => update(armorToPatch(gear as typeof SRD_EQUIPMENT.armor[number]))}
									>
										Equip
									</button>
								) : (
									<>
										<button
											type="button"
											className="df-cs-pick-add"
											onClick={() =>
												update({ primaryWeapon: toCharacterWeapon(gear as typeof SRD_EQUIPMENT.weapons[number]) })
											}
										>
											Primary
										</button>
										<button
											type="button"
											className="df-cs-pick-add df-cs-pick-add--secondary"
											onClick={() =>
												update({ secondaryWeapon: toCharacterWeapon(gear as typeof SRD_EQUIPMENT.weapons[number]) })
											}
										>
											Secondary
										</button>
									</>
								)}
							</div>
						</div>
					))}
				{tab === "item" &&
					looseItems.map((g) => (
						<div key={g.id} className={"df-cs-pick" + (expanded === g.id ? " is-expanded" : "")}>
							<button
								type="button"
								className="df-cs-pick-row"
								onClick={() => setExpanded(expanded === g.id ? null : g.id)}
								aria-expanded={expanded === g.id}
							>
								<span className="df-cs-pick-name">{g.name}</span>
								<span className="df-cs-pick-meta">
									{GEAR_KIND_LABELS[g.kind]}
									{g.rarity ? ` · ${g.rarity}` : ""}
									{g.meta ? ` · ${g.meta}` : ""}
								</span>
							</button>
							{expanded === g.id && g.text && (
								<div className="df-cs-pick-detail">
									<CardText text={g.text} />
								</div>
							)}
							<button type="button" className="df-cs-pick-add" onClick={() => addToInventory(g)}>
								Add
							</button>
						</div>
					))}
				{tab === "domain" && domainCards.length === 0 && (
					<p className="df-cs-picker-none">No cards match these filters.</p>
				)}
				{tab === "equipment" && equipment.length === 0 && (
					<p className="df-cs-picker-none">No equipment matches these filters.</p>
				)}
				{tab === "item" && looseItems.length === 0 && (
					<p className="df-cs-picker-none">No items match.</p>
				)}
			</div>
		</div>
	);
}

function composeHeritage(ancestry?: string, community?: string): string {
	return [ancestry, community].filter(Boolean).join(" ");
}

function PickerDomainRow({
	card,
	expanded,
	added,
	onToggle,
	onAdd,
}: {
	card: SrdDomainCard;
	expanded: boolean;
	added: boolean;
	onToggle: () => void;
	onAdd: () => void;
}) {
	const color = DOMAIN_COLORS[card.domain] ?? "var(--df-cs-mid)";
	return (
		<div
			className={"df-cs-pick" + (expanded ? " is-expanded" : "")}
			style={{ borderLeftColor: color }}
		>
			<button type="button" className="df-cs-pick-row" onClick={onToggle} aria-expanded={expanded}>
				<span className="df-cs-dcard-level" style={{ background: color }}>
					{card.level}
				</span>
				<DomainIcon domain={card.domain} className="df-cs-dcard-icon" style={{ color }} />
				<span className="df-cs-pick-name">{card.name}</span>
				<span className="df-cs-pick-meta">
					{card.domain} · {card.type} · <ZapIcon />{card.recallCost}
				</span>
			</button>
			{expanded && (
				<div className="df-cs-pick-detail">
					<CardText text={card.text} />
				</div>
			)}
			<button type="button" className="df-cs-pick-add" disabled={added} onClick={onAdd}>
				{added ? "Added ✓" : "Add"}
			</button>
		</div>
	);
}

function PickerHeritageRow({
	heritage,
	expanded,
	added,
	addLabel,
	pending,
	onToggle,
	onAdd,
}: {
	heritage: SrdHeritage;
	expanded: boolean;
	added: boolean;
	addLabel: string;
	pending: boolean;
	onToggle: () => void;
	onAdd: () => void;
}) {
	const featureNames = heritage.features
		.map((f) => f.split(":")[0])
		.join(" · ");
	return (
		<div className={"df-cs-pick" + (expanded ? " is-expanded" : "")}>
			<button type="button" className="df-cs-pick-row" onClick={onToggle} aria-expanded={expanded}>
				<span className="df-cs-pick-name">{heritage.name}</span>
				<span className="df-cs-pick-meta">{featureNames}</span>
			</button>
			{expanded && (
				<div className="df-cs-pick-detail">
					<CardText text={heritage.description.join("\n\n")} />
					<CardText text={heritage.features.join("\n\n")} />
				</div>
			)}
			<button type="button" className="df-cs-pick-add" disabled={added || pending} onClick={onAdd}>
				{added ? "Added ✓" : pending ? "1st ✓" : addLabel}
			</button>
		</div>
	);
}
