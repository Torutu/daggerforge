import { useLanguage as useUiLanguage } from "../../../i18n/react";
import { translate as dfTranslate } from "../../../i18n";
import React, { useEffect, useRef, useState } from "react";
import {
	applyLevelChange,
	CharacterData,
	CompanionData,
	COMPANION_STRESS_SLOTS,
	hopeSlotCount,
} from "../../../types/character";
import { getBeastforms, getSrdClasses } from "../../../data/srd";
import {
	COMPANION_EXPERIENCE_EXAMPLES,
	COMPANION_TRAINING,
	LEVEL_UP_TIERS,
	tierForLevel,
} from "../../../data/levelUpGuide";
import { SrdBeastform } from "../../../types/srd";
import { gameTerm } from "../../../i18n/gameTerms";
import { useLanguage } from "../../../i18n/react";
import { CardText } from "./CardText";
import { ExperienceCapArt } from "./SheetArt";
import {
	CogNumber,
	CogPanel,
	LineField,
	LineTextarea,
	SectionBanner,
	SectionCog,
	SlotToggle,
} from "./SheetFields";

/**
 * The guide pages from the official character sheet pack, rendered as sheet
 * sections: Background & Connections, the Level Up Guide, the Druid
 * Beastform list, and the Ranger Companion sheet.
 */

interface SectionProps {
	char: CharacterData;
	update: (patch: Partial<CharacterData>) => void;
}

/** Matches the sheet's free-text "Class & Subclass" field to a known class. */
function sheetClass(char: CharacterData, language: "de" | "en" = "en") {
	const classes = getSrdClasses(language);
	if (char.classId) {
		const byId = classes.find((candidate) => candidate.id === char.classId);
		if (byId) return byId;
	}
	const lead = char.classSubclass.trim().toLowerCase();
	return classes.find((c) => lead.startsWith(c.name.toLowerCase()));
}

const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

// ── Background & Connections ──────────────────────────────────────────────────

export function BackgroundSection({ char, update }: SectionProps) {
	useUiLanguage();
	const language = useLanguage();
	const cls = sheetClass(char, language);

	const setAnswer = (
		field: "backgroundAnswers" | "connectionAnswers",
		index: number,
		value: string,
	) => {
		const next = [...char[field]];
		while (next.length <= index) next.push("");
		next[index] = value;
		update({ [field]: next } as Partial<CharacterData>);
	};

	return (
		<section className="df-cs-box df-cs-guide">
			<SectionBanner title={dfTranslate("ui.background.connections")} />
			{cls ? (
				<>
					<p className="df-cs-hint">
						{dfTranslate("sheet.background.prompt", { className: cls.name })}</p>
					<h4 className="df-cs-guide-sub">{dfTranslate("ui.background")}</h4>
					{(cls.backgroundQuestions ?? []).map((q, i) => (
						<div key={i} className="df-cs-guide-q">
							<p className="df-cs-guide-question">{q}</p>
							<LineTextarea
								value={char.backgroundAnswers[i] ?? ""}
								onChange={(v) => setAnswer("backgroundAnswers", i, v)}
								rows={1}
							/>
						</div>
					))}
					<h4 className="df-cs-guide-sub">{dfTranslate("ui.connections")}</h4>
					<p className="df-cs-hint">{dfTranslate("ui.ask.your.fellow.players.one.or.more.of.these.questions")}</p>
					{(cls.connectionQuestions ?? []).map((q, i) => (
						<div key={i} className="df-cs-guide-q">
							<p className="df-cs-guide-question">{q}</p>
							<LineTextarea
								value={char.connectionAnswers[i] ?? ""}
								onChange={(v) => setAnswer("connectionAnswers", i, v)}
								rows={1}
							/>
						</div>
					))}
				</>
			) : (
				<>
					<p className="df-cs-hint">
						{dfTranslate("ui.set.a.class.in.the.sheet.header.to.see.its.background.and.connection.prompts.or.write.your.own.below")}</p>
					<LineTextarea
						label={dfTranslate("ui.background")}
						value={char.backgroundAnswers[0] ?? ""}
						onChange={(v) => setAnswer("backgroundAnswers", 0, v)}
						rows={2}
					/>
					<LineTextarea
						label={dfTranslate("ui.connections")}
						value={char.connectionAnswers[0] ?? ""}
						onChange={(v) => setAnswer("connectionAnswers", 0, v)}
						rows={2}
					/>
				</>
			)}
		</section>
	);
}

// ── Level Up Guide ────────────────────────────────────────────────────────────

export function LevelUpSection({ char, update }: SectionProps) {
	useUiLanguage();
	const [cogOpen, setCogOpen] = useState(false);
	const lu = char.levelUp;
	const level = parseInt(char.level, 10);
	const currentTier = tierForLevel(Number.isInteger(level) ? level : 1);

	// Gentle helper: raising the sheet's Level grants points automatically,
	// without opening anything or blocking the user.
	useEffect(() => {
		if (!Number.isInteger(level)) return;
		const synced = applyLevelChange(lu, level);
		if (synced !== lu) update({ levelUp: synced });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [char.level]);

	const setMarks = (key: string, next: number, costDelta: number) => {
		const marks = { ...lu.marks };
		if (next <= 0) delete marks[key];
		else marks[key] = next;
		update({ levelUp: { ...lu, marks, pending: lu.pending - costDelta } });
	};

	return (
		<section className="df-cs-box df-cs-guide">
			<SectionBanner title={dfTranslate("ui.level.up.guide")} />
			<SectionCog open={cogOpen} onToggle={() => setCogOpen(!cogOpen)} />
			{cogOpen && (
				<CogPanel>
					<CogNumber
						label={dfTranslate("ui.points.per.level")}
						value={lu.pointsPerLevel}
						min={0}
						max={9}
						onChange={(n) => update({ levelUp: { ...lu, pointsPerLevel: n } })}
					/>
					<CogNumber
						label={dfTranslate("ui.points.to.spend.now")}
						value={lu.pending}
						min={-99}
						max={99}
						onChange={(n) => update({ levelUp: { ...lu, pending: n } })}
					/>
				</CogPanel>
			)}
			{lu.pending > 0 && (
				<p className="df-cs-lvl-pill">
					{dfTranslate(lu.pending === 1 ? "sheet.points.one" : "sheet.points.many", { count: lu.pending })}</p>
			)}
			{lu.pending < 0 && (
				<p className="df-cs-lvl-pill df-cs-lvl-pill--over">
					{dfTranslate(lu.pending === -1 ? "sheet.over.one" : "sheet.over.many", { count: -lu.pending })}</p>
			)}
			<p className="df-cs-hint">
				{dfTranslate("ui.options.in.a.heavy.frame.cost.both.of.the.level.s.choices.and.mark.together")}</p>
			<div className="df-cs-lvl-tiers">
				{LEVEL_UP_TIERS.map((tier) => (
					<div
						key={tier.tier}
						className={"df-cs-lvl-tier" + (currentTier === tier.tier ? " is-current" : "")}
					>
						<div className="df-cs-lvl-tier-head">
							<span className="df-cs-lvl-tier-name">{tier.label}:</span>
							<span className="df-cs-lvl-tier-levels">{tier.levels}</span>
						</div>
						<p className="df-cs-lvl-achievement">{tier.achievement}</p>
						<p className="df-cs-lvl-chooser">{tier.chooser}</p>
						{tier.options.map((opt) => {
							const key = `t${tier.tier}.${opt.key}`;
							const marked = lu.marks[key] ?? 0;
							return (
								<div
									key={opt.key}
									className={"df-cs-lvl-opt" + (opt.doubleCost ? " df-cs-lvl-opt--double" : "")}
								>
									<span className="df-cs-lvl-slots">
										{Array.from({ length: opt.slots }, (_, i) => (
											<SlotToggle
												key={i}
												on={i < marked}
												label={`${opt.text} (slot ${i + 1} of ${opt.slots})`}
												className="df-cs-track-slot df-cs-lvl-slot"
												onToggle={() => {
													if (opt.doubleCost) {
														// Both slots mark together and cost two advancements
														const next = marked > 0 ? 0 : opt.slots;
														setMarks(key, next, next - marked);
														return;
													}
													const next = i < marked ? marked - 1 : marked + 1;
													setMarks(key, next, next - marked);
												}}
											/>
										))}
									</span>
									<div className="df-cs-lvl-opt-text">
										<CardText text={opt.text} />
									</div>
								</div>
							);
						})}
						<p className="df-cs-lvl-footer">{tier.footer}</p>
					</div>
				))}
			</div>
		</section>
	);
}

// ── Druid Beastform ───────────────────────────────────────────────────────────

function beastMeta(form: SrdBeastform, language: "de" | "en"): string {
	const attack =
		`${form.attackRange}, ${form.attackTrait}, ${form.attackDamage}` +
		(form.attackMod ? ` ${fmtMod(form.attackMod)}` : "");
	return `${form.trait} ${fmtMod(form.traitMod)} · ${gameTerm("Evasion", language)} ${fmtMod(form.evasionMod)} · ${attack}`;
}

export function BeastformSection({ char, update }: SectionProps) {
	useUiLanguage();
	const [expanded, setExpanded] = useState<string | null>(null);
	const language = useLanguage();
	const beastforms = getBeastforms(language);
	const classes = getSrdClasses(language);
	if (sheetClass(char)?.id !== "class-druid") return null;

	const englishBeastforms = getBeastforms("en");
	const germanBeastforms = getBeastforms("de");
	const activeIndex = beastforms.findIndex(
		(b, index) => b.name === char.activeBeastform ||
			englishBeastforms[index]?.name === char.activeBeastform ||
			germanBeastforms[index]?.name === char.activeBeastform,
	);
	const active = activeIndex >= 0 ? beastforms[activeIndex] : undefined;
	const feature = classes.find((c) => c.id === "class-druid")?.classFeatures[0];
	const tiers = [...new Set(beastforms.map((b) => b.tier))].sort();

	return (
		<section className="df-cs-box df-cs-guide">
			<SectionBanner title={dfTranslate("ui.beastform")} />
			{feature && (
				<div className="df-cs-hint">
					<CardText text={feature.description} />
				</div>
			)}
			{active && (
				<div className="df-cs-beast-active">
					<span className="df-cs-beast-active-name">✦ {active.name}</span>
					<span className="df-cs-beast-active-meta">{beastMeta(active, language)}</span>
					<button
						type="button"
						className="df-cs-beast-drop"
						onClick={() => update({ activeBeastform: "" })}
					>
						{dfTranslate("ui.drop.form")}</button>
				</div>
			)}
			{tiers.map((tier) => (
				<React.Fragment key={tier}>
					<h4 className="df-cs-guide-sub">{dfTranslate("ui.tier")} {tier}</h4>
					<div className="df-cs-beast-list">
						{beastforms.filter((b) => b.tier === tier).map((b) => {
							const isActive = activeIndex === beastforms.indexOf(b);
							const isOpen = expanded === b.name;
							return (
								<div key={b.name} className={"df-cs-beast" + (isActive ? " is-active" : "")}>
									<button
										type="button"
										className="df-cs-beast-row"
										aria-expanded={isOpen}
										onClick={() => setExpanded(isOpen ? null : b.name)}
									>
										{isActive && <span className="df-cs-beast-check">✦</span>}
										<span className="df-cs-beast-name">{b.name}</span>
										<span className="df-cs-beast-meta">{b.examples}</span>
									</button>
									{isOpen && (
										<div className="df-cs-beast-detail">
											<p className="df-cs-cardtext-p">
												<strong>{beastMeta(b, language)}</strong>
											</p>
											<p className="df-cs-cardtext-p">
												<strong>{dfTranslate("ui.advantage.on")}</strong> {b.advantages.join(", ")}
											</p>
											{b.features.map((f) => (
												<CardText key={f.name} text={`${f.name}: ${f.text}`} />
											))}
											<button
												type="button"
												className="mod-cta df-cs-beast-take"
												disabled={isActive}
												onClick={() => update({ activeBeastform: b.name })}
											>
												{isActive ? dfTranslate("ui.dynamic.current.form") : dfTranslate("ui.dynamic.take.this.form")}
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</React.Fragment>
			))}
		</section>
	);
}

// ── Ranger Companion ──────────────────────────────────────────────────────────

/** Downscaled JPEG data URL, so portraits stay small enough for share codes. */
async function readPortrait(file: File): Promise<string | null> {
	try {
		const url = URL.createObjectURL(file);
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = reject;
			image.src = url;
		});
		const scale = Math.min(1, 320 / Math.max(img.width, img.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.width * scale));
		canvas.height = Math.max(1, Math.round(img.height * scale));
		canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
		URL.revokeObjectURL(url);
		return canvas.toDataURL("image/jpeg", 0.82);
	} catch (error) {
		console.error("DaggerForge: could not read the companion picture", error);
		return null;
	}
}

const COMPANION_DAMAGE_DICE = ["d6", "d8", "d10", "d12"];

export function CompanionSection({ char, update }: SectionProps) {
	useUiLanguage();
	const fileRef = useRef<HTMLInputElement>(null);
	if (sheetClass(char)?.id !== "class-ranger") return null;

	const comp = char.companion;
	const patch = (p: Partial<CompanionData>) => update({ companion: { ...comp, ...p } });

	// Resilient training unlocks stress slots beyond the printed base three
	const stressMax = Math.min(COMPANION_STRESS_SLOTS, 3 + (comp.training["resilient"] ?? 0));

	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		void readPortrait(file).then((art) => {
			if (art) patch({ art });
		});
	};

	const setExperience = (index: number, exp: Partial<{ text: string; modifier: string }>) => {
		patch({
			experiences: comp.experiences.map((e, i) => (i === index ? { ...e, ...exp } : e)),
		});
	};

	const setTraining = (key: string, next: number) => {
		const training = { ...comp.training };
		const previous = training[key] ?? 0;
		if (next <= 0) delete training[key];
		else training[key] = next;
		const patchData: Partial<CharacterData> = { companion: { ...comp, training } };

		// "Light in the Dark" is an additional Hope slot for the PLAYER's
		// character - marking it grows the sheet's Hope track, unmarking shrinks it.
		if (key === "light") {
			const settings = char.sheetSettings;
			const newMax = Math.min(24, Math.max(1, settings.maxHope + (next - previous)));
			if (newMax !== settings.maxHope) {
				patchData.sheetSettings = { ...settings, maxHope: newMax };
				patchData.hope = Array.from(
					{ length: hopeSlotCount(newMax) },
					(_, i) => i < newMax && (char.hope[i] ?? false),
				);
			}
		}
		update(patchData);
	};

	return (
		<section className="df-cs-box df-cs-guide">
			<SectionBanner title={dfTranslate("ui.ranger.companion")} />
			<div className="df-cs-comp-grid">
				<div className="df-cs-comp-portrait">
					{comp.art ? (
						<img src={comp.art} alt={dfTranslate("ui.companion.portrait")} className="df-cs-comp-img" />
					) : (
						<span className="df-cs-comp-img-empty">✦</span>
					)}
					<div className="df-cs-comp-portrait-btns">
						<button type="button" onClick={() => fileRef.current?.click()}>
							{comp.art ? dfTranslate("ui.dynamic.change.picture") : dfTranslate("ui.dynamic.add.picture")}
						</button>
						{comp.art && (
							<button type="button" onClick={() => patch({ art: "" })}>
								{dfTranslate("ui.remove")}</button>
						)}
					</div>
					<input
						ref={fileRef}
						type="file"
						accept="image/*"
						className="df-cs-comp-file"
						onChange={onFile}
					/>
				</div>
				<div className="df-cs-comp-fields">
					<LineField
						label={dfTranslate("ui.companion.name")}
						value={comp.name}
						onChange={(v) => patch({ name: v })}
					/>
					<LineField
						label={dfTranslate("ui.evasion.start.at.10")}
						value={comp.evasion}
						onChange={(v) => patch({ evasion: v })}
						className="df-cs-comp-evasion"
					/>
					<p className="df-cs-hint">
						{dfTranslate("ui.work.with.the.gm.to.decide.what.kind.of.animal.you.have.as.your.companion.give.them.a.name.and.attach.a.picture.then.create.two.experiences.for.them.based.on.their.training.and.the.history.you.have.together")}</p>
				</div>
			</div>

			<h4 className="df-cs-guide-sub">{dfTranslate("ui.companion.experience")}</h4>
			<p className="df-cs-hint">
				{dfTranslate("ui.start.with.2.in.two.experiences.whenever.you.gain.a.new.experience.your.companion.also.gains.one.all.new.experiences.start.at.2")}</p>
			<div className="df-cs-experiences df-cs-comp-experiences">
				{comp.experiences.map((exp, i) => (
					<div key={i} className="df-cs-experience-row">
						<input
							type="text"
							className="df-cs-experience-text"
							value={exp.text}
							onChange={(e) => setExperience(i, { text: e.target.value })}
							aria-label={`Companion experience ${i + 1}`}
						/>
						<div className="df-cs-experience-mod">
							<ExperienceCapArt />
							<input
								type="text"
								className="df-cs-experience-mod-input"
								value={exp.modifier}
								onChange={(e) => setExperience(i, { modifier: e.target.value })}
								aria-label={`Companion experience ${i + 1} modifier`}
							/>
						</div>
					</div>
				))}
			</div>
			<p className="df-cs-hint df-cs-comp-examples">
				{dfTranslate("ui.example.companion.experiences")}{COMPANION_EXPERIENCE_EXAMPLES}.
			</p>
			<div className="df-cs-comp-rules">
				<CardText text={dfTranslate("ui.make.a.spellcast.roll.to.connect.with.your.companion.and.command.them.to.take.action.spend.a.hope.to.add.an.applicable.companion.experience.to.the.roll.on.a.success.with.hope.if.your.next.action.builds.on.their.success.you.gain.advantage.on.the.roll")} />
			</div>

			<div className="df-cs-comp-columns">
				<div className="df-cs-comp-col">
					<h4 className="df-cs-guide-sub">{dfTranslate("ui.attack.damage")}</h4>
					<LineField
						label={dfTranslate("ui.standard.attack")}
						value={comp.attack}
						onChange={(v) => patch({ attack: v })}
					/>
					<LineField
						label={dfTranslate("ui.range.starts.at.melee")}
						value={comp.range}
						onChange={(v) => patch({ range: v })}
					/>
					<div className="df-cs-comp-dice">
						<span className="df-cs-comp-dice-label">{dfTranslate("ui.damage.die")}</span>
						{COMPANION_DAMAGE_DICE.map((die) => {
							const selected = (comp.damageDie || "d6") === die;
							return (
								<button
									key={die}
									type="button"
									className={"df-cs-comp-die" + (selected ? " is-on" : "")}
									aria-pressed={selected}
									onClick={() => patch({ damageDie: die })}
								>
									<span className="df-cs-comp-die-circle" />
									{die}
								</button>
							);
						})}
					</div>
					<div className="df-cs-comp-rules">
						<CardText text={dfTranslate("ui.when.you.command.your.companion.to.attack.they.gain.any.benefits.that.would.normally.only.apply.to.you.such.as.the.effects.of.ranger.s.focus.on.a.success.their.damage.roll.uses.your.proficiency.and.their.damage.die")} />
					</div>

					<h4 className="df-cs-guide-sub">{dfTranslate("ui.stress")}</h4>
					<div className="df-cs-track">
						<span className="df-cs-track-label">{dfTranslate("ui.stress")}</span>
						<div className="df-cs-track-slots">
							{comp.stress.map((on, i) => (
								<SlotToggle
									key={i}
									on={on}
									label={`Companion stress ${i + 1}`}
									className={
										"df-cs-track-slot" + (i >= stressMax ? " df-cs-track-slot--dashed" : "")
									}
									onToggle={() =>
										patch({ stress: comp.stress.map((v, j) => (j === i ? !v : v)) })
									}
								/>
							))}
						</div>
					</div>
					<div className="df-cs-comp-rules">
						<CardText text={dfTranslate("ui.when.your.companion.would.take.any.amount.of.damage.they.mark.a.stress.when.they.mark.their.last.stress.they.drop.out.of.the.scene.by.hiding.fleeing.or.a.similar.action.they.remain.unavailable.until.the.start.of.your.next.long.rest.where.they.return.with.1.stress.cleared")} />
						<CardText text={dfTranslate("ui.when.you.choose.a.downtime.move.that.clears.stress.on.yourself.your.companion.clears.an.equal.number.of.stress")} />
					</div>
				</div>

				<div className="df-cs-comp-col">
					<h4 className="df-cs-guide-sub">{dfTranslate("ui.training")}</h4>
					<p className="df-cs-hint">
						{dfTranslate("ui.when.your.character.levels.up.choose.one.available.option.for.your.companion.from.the.following.list.and.mark.it.here")}</p>
					{COMPANION_TRAINING.map((opt) => {
						const marked = comp.training[opt.key] ?? 0;
						return (
							<div key={opt.key} className="df-cs-lvl-opt">
								<span className="df-cs-lvl-slots">
									{Array.from({ length: opt.slots }, (_, i) => (
										<SlotToggle
											key={i}
											on={i < marked}
											label={`${opt.name} (slot ${i + 1} of ${opt.slots})`}
											className="df-cs-track-slot df-cs-lvl-slot"
											onToggle={() => setTraining(opt.key, i < marked ? marked - 1 : marked + 1)}
										/>
									))}
								</span>
								<div className="df-cs-lvl-opt-text">
									<CardText text={`${opt.name}: ${opt.text}`} />
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
