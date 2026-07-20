import React from "react";
import { CharacterData } from "../../../types/character";
import {
	ActiveArmorSection,
	ActiveWeaponsSection,
	ClassFeatureSection,
	DamageHealthSection,
	DomainCardsSection,
	ExperienceSection,
	GoldSection,
	HeritageCardsSection,
	HopeSection,
	InventorySection,
	NotesSection,
	PickerTab,
	SheetHeader,
	StatsRow,
} from "./SheetSections";
import {
	BackgroundSection,
	BeastformSection,
	CompanionSection,
	LevelUpSection,
} from "./SheetGuides";
import { DomainSprite } from "./DomainArt";

interface Props {
	char: CharacterData;
	update: (patch: Partial<CharacterData>) => void;
	/** Omitted in embeds - the card picker only lives in the sheet view. */
	onAddCards?: (tab: PickerTab) => void;
}

const NEXT_LAYOUT = { auto: "wide", wide: "compact", compact: "auto" } as const;

const LAYOUT_TITLES = {
	auto: "Layout: Automatic - fits the pane. Click for full layout.",
	wide: "Layout: Full - always two columns. Click for single column.",
	compact: "Layout: Single column. Click for automatic.",
} as const;

/** Lucide icons (monitor-smartphone / maximize-2 / minimize-2), inlined like
 *  the card buttons so the sheet stays free of runtime icon lookups. */
function LayoutModeIcon({ mode }: { mode: "auto" | "wide" | "compact" }) {
	const paths = {
		auto: (
			<>
				<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
				<path d="M10 19v-3.96 3.15" />
				<path d="M7 19h5" />
				<rect width="6" height="10" x="16" y="12" rx="2" />
			</>
		),
		wide: (
			<>
				<path d="M15 3h6v6" />
				<path d="M9 21H3v-6" />
				<path d="M21 3l-7 7" />
				<path d="M3 21l7-7" />
			</>
		),
		compact: (
			<>
				<path d="M4 14h6v6" />
				<path d="M20 10h-6V4" />
				<path d="M14 10l7-7" />
				<path d="M3 21l7-7" />
			</>
		),
	} as const;
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{paths[mode]}
		</svg>
	);
}

/** The full printed sheet, shared by the sheet view and note/canvas embeds. */
export function SheetBody({ char, update, onAddCards }: Props) {
	const mode = char.sheetSettings.layoutMode;
	return (
		<div className={"df-cs-sheet" + (mode !== "auto" ? ` df-cs-sheet--${mode}` : "")}>
			<DomainSprite />
			<div className="df-cs-layout-row">
				<button
					type="button"
					className="df-cs-layout-toggle"
					title={LAYOUT_TITLES[mode]}
					aria-label={LAYOUT_TITLES[mode]}
					onClick={() =>
						update({ sheetSettings: { ...char.sheetSettings, layoutMode: NEXT_LAYOUT[mode] } })
					}
				>
					<LayoutModeIcon mode={mode} />
				</button>
			</div>
			<SheetHeader char={char} update={update} />
			<StatsRow char={char} update={update} />
			<div className="df-cs-columns">
				<div className="df-cs-column">
					<DamageHealthSection char={char} update={update} />
					<HopeSection char={char} update={update} />
					<ExperienceSection char={char} update={update} />
					<GoldSection char={char} update={update} />
					<ClassFeatureSection char={char} update={update} />
				</div>
				<div className="df-cs-column">
					<ActiveWeaponsSection char={char} update={update} />
					<ActiveArmorSection char={char} update={update} />
					<InventorySection char={char} update={update} />
				</div>
			</div>
			<HeritageCardsSection char={char} update={update} onAddCards={onAddCards} />
			<DomainCardsSection char={char} update={update} onAddCards={onAddCards} />
			<BeastformSection char={char} update={update} />
			<CompanionSection char={char} update={update} />
			<BackgroundSection char={char} update={update} />
			<LevelUpSection char={char} update={update} />
			<NotesSection char={char} update={update} />
			<p className="df-cs-credit">Daggerheart © Darrington Press 2025</p>
		</div>
	);
}
