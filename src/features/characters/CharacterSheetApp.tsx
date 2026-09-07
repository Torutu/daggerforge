import { useLanguage as useUiLanguage } from "../../i18n/react";
import { translate as dfTranslate } from "../../i18n";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Notice } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { CharacterData, createEmptyCharacter } from "../../types/character";
import { generateCharacterUniqueId } from "../../utils/index";
import { decodeCharacterCode, encodeCharacterCode } from "./characterCode";
import { insertCharacterEmbed } from "./CharacterSheetEmbed";
import { buildCharacterFromChoices, CreationChoices } from "./creationTemplate";
import { ConfirmModal } from "./components/ConfirmModal";
import { CreationWizard } from "./components/CreationWizard";
import { PickerTab } from "./components/SheetSections";
import { CardPickerModal } from "./components/CardPickerModal";
import { SheetBody } from "./components/SheetBody";

interface Props {
	plugin: DaggerForgePlugin;
}

/**
 * Character sheet editor. Players fill the sheet and press Save; "Copy code"
 * produces a shareable character code they can send to their GM, who pastes
 * it into "Import code" to get the same character.
 */
export function CharacterSheetApp({ plugin }: Props) {
	useUiLanguage();
	const [char, setChar] = useState<CharacterData>(() =>
		createEmptyCharacter(generateCharacterUniqueId()),
	);
	const [dirty, setDirty] = useState(false);
	// Bumped after save/delete/import so the character dropdown re-reads the store
	const [storeVersion, setStoreVersion] = useState(0);
	const [importOpen, setImportOpen] = useState(false);
	const [importText, setImportText] = useState("");
	const [wizardOpen, setWizardOpen] = useState(false);
	// First-run prompt: with no saved characters, ask blank vs guided up front
	const [introDismissed, setIntroDismissed] = useState(false);
	// Identifies this view's own saves in DataManager events (embeds do the same)
	const originToken = useRef({}).current;

	const characters = useMemo(
		() =>
			[...plugin.dataManager.getCharacters()].sort((a, b) =>
				(a.name || dfTranslate("ui.dynamic.unnamed")).localeCompare(b.name || dfTranslate("ui.dynamic.unnamed")),
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[plugin, storeVersion],
	);

	// Follow edits made in note/canvas embeds - but never clobber a dirty draft
	useEffect(() => {
		const events = plugin.dataManager.events;
		const refs = [
			events.on("character-changed", (changed: CharacterData, origin?: unknown) => {
				setStoreVersion((v) => v + 1);
				if (origin === originToken) return;
				if (!dirty && changed.id === char.id) setChar(structuredClone(changed));
			}),
			events.on("character-deleted", () => setStoreVersion((v) => v + 1)),
			events.on("characters-reloaded", () => setStoreVersion((v) => v + 1)),
		];
		return () => refs.forEach((ref) => events.offref(ref));
	}, [plugin, originToken, char.id, dirty]);

	const update = useCallback((patch: Partial<CharacterData>) => {
		setChar((current) => ({ ...current, ...patch }));
		setDirty(true);
	}, []);

	const save = async (): Promise<CharacterData> => {
		const toSave = { ...char, lastUpdated: Date.now() };
		await plugin.dataManager.upsertCharacter(toSave, originToken);
		setChar(toSave);
		setDirty(false);
		setStoreVersion((v) => v + 1);
		return toSave;
	};

	const handleSave = async () => {
		await save();
		new Notice(dfTranslate("ui.character.saved"));
	};

	const handleInsert = async () => {
		// Save first: an embed can only resolve a character that exists in the store
		const saved = await save();
		await insertCharacterEmbed(plugin, saved.id);
	};

	const handleCopyCode = async () => {
		try {
			const saved = await save();
			const code = await encodeCharacterCode(saved);
			await navigator.clipboard.writeText(code);
			new Notice(dfTranslate("ui.character.saved.and.code.copied.send.it.to.your.gm"));
		} catch (error) {
			console.error("DaggerForge: failed to copy character code", error);
			new Notice(dfTranslate("ui.could.not.copy.the.character.code"));
		}
	};

	const handleImport = async () => {
		try {
			const imported = await decodeCharacterCode(importText, generateCharacterUniqueId());
			const existed = plugin.dataManager
				.getCharacters()
				.some((c) => c.id === imported.id);
			await plugin.dataManager.upsertCharacter(imported);
			setChar(imported);
			setDirty(false);
			setStoreVersion((v) => v + 1);
			setImportOpen(false);
			setImportText("");
			new Notice(existed ? dfTranslate("ui.dynamic.character.updated.from.code") : dfTranslate("ui.dynamic.character.imported.from.code"));
		} catch (error) {
			console.error("DaggerForge: failed to import character code", error);
			new Notice(dfTranslate("ui.that.doesn.t.look.like.a.valid.character.code"));
		}
	};

	/** Runs an action that replaces the open sheet, confirming if edits would be lost. */
	const confirmDiscard = (action: () => void) => {
		if (!dirty) {
			action();
			return;
		}
		new ConfirmModal(plugin.app, {
			title: dfTranslate("ui.discard.unsaved.changes"),
			message: dfTranslate("ui.this.sheet.has.unsaved.changes.that.will.be.lost"),
			confirmLabel: dfTranslate("ui.discard"),
			onConfirm: action,
		}).open();
	};

	const handleNew = (evt: React.MouseEvent) => {
		const menu = new Menu();
		menu.addItem((item) =>
			item.setTitle(dfTranslate("ui.blank.character")).setIcon("file").onClick(() =>
				confirmDiscard(() => {
					setChar(createEmptyCharacter(generateCharacterUniqueId()));
					setDirty(false);
				}),
			),
		);
		menu.addItem((item) =>
			item.setTitle(dfTranslate("ui.guided.creation")).setIcon("wand").onClick(() =>
				confirmDiscard(() => setWizardOpen(true)),
			),
		);
		menu.showAtMouseEvent(evt.nativeEvent);
	};

	const handleWizardComplete = (choices: CreationChoices) => {
		setChar(buildCharacterFromChoices(choices, generateCharacterUniqueId()));
		setDirty(true);
		setWizardOpen(false);
	};

	const openCardPicker = (tab: PickerTab) => {
		new CardPickerModal(plugin.app, {
			char,
			tab,
			onPatch: update,
			customItems: plugin.dataManager.getItems(),
		}).open();
	};

	const handleSelect = (id: string) => {
		const selected = plugin.dataManager.getCharacters().find((c) => c.id === id);
		if (!selected) return;
		confirmDiscard(() => {
			setChar(structuredClone(selected));
			setDirty(false);
		});
	};

	const handleDelete = () => {
		const saved = characters.some((c) => c.id === char.id);
		if (!saved) {
			confirmDiscard(() => {
				setChar(createEmptyCharacter(generateCharacterUniqueId()));
				setDirty(false);
			});
			return;
		}
		new ConfirmModal(plugin.app, {
			title: dfTranslate("ui.delete.character"),
			message: dfTranslate("character.delete.confirm", { name: char.name || dfTranslate("ui.dynamic.unnamed.character") }),
			confirmLabel: dfTranslate("ui.delete"),
			onConfirm: async () => {
				await plugin.dataManager.deleteCharacterById(char.id);
				setChar(createEmptyCharacter(generateCharacterUniqueId()));
				setDirty(false);
				setStoreVersion((v) => v + 1);
				new Notice(dfTranslate("ui.character.deleted"));
			},
		}).open();
	};

	const isSaved = characters.some((c) => c.id === char.id);

	if (wizardOpen) {
		return (
			<div className="df-cs-root">
				<CreationWizard onComplete={handleWizardComplete} onCancel={() => setWizardOpen(false)} />
			</div>
		);
	}

	if (!introDismissed && characters.length === 0 && !dirty) {
		return (
			<div className="df-cs-root">
				<div className="df-cs-intro">
					<span className="df-cs-intro-orn">✦ ✦ ✦</span>
					<h2 className="df-cs-intro-title">{dfTranslate("ui.forge.your.first.hero")}</h2>
					<p className="df-cs-intro-sub">{dfTranslate("ui.no.saved.characters.yet.how.do.you.want.to.begin")}</p>
					<div className="df-cs-intro-options">
						<button
							type="button"
							className="df-cs-intro-opt"
							onClick={() => setIntroDismissed(true)}
						>
							<span className="df-cs-intro-opt-name">{dfTranslate("ui.blank.sheet")}</span>
							<span className="df-cs-intro-opt-desc">
								{dfTranslate("ui.start.from.an.empty.character.sheet.and.fill.everything.in.yourself")}</span>
						</button>
						<button
							type="button"
							className="df-cs-intro-opt df-cs-intro-opt--accent"
							onClick={() => {
								setIntroDismissed(true);
								setWizardOpen(true);
							}}
						>
							<span className="df-cs-intro-opt-name">{dfTranslate("ui.guided.creation")}</span>
							<span className="df-cs-intro-opt-desc">
								{dfTranslate("ui.pick.a.class.heritage.experiences.and.domain.cards.step.by.step.the.sheet.fills.itself.from.your.choices")}</span>
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="df-cs-root">
			<div className="df-cs-toolbar">
				<select
					className="dropdown"
					value={isSaved ? char.id : ""}
					onChange={(e) => handleSelect(e.target.value)}
					aria-label={dfTranslate("ui.saved.characters")}
				>
					<option value="" disabled>
						{isSaved ? dfTranslate("ui.dynamic.switch.character") : dfTranslate("ui.dynamic.new.character")}
					</option>
					{characters.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name || dfTranslate("ui.dynamic.unnamed.character")}
						</option>
					))}
				</select>
				<button type="button" onClick={handleNew}>{dfTranslate("ui.new")}</button>
				<button type="button" className="mod-cta" onClick={handleSave}>
					{dfTranslate("ui.save")}{dirty ? " •" : ""}
				</button>
				<button type="button" onClick={handleCopyCode}>{dfTranslate("ui.copy.code")}</button>
				<button type="button" onClick={handleInsert} title={dfTranslate("ui.embed.this.sheet.in.the.last.focused.note.or.canvas")}>
					{dfTranslate("ui.insert.in.note.canvas")}</button>
				<button type="button" onClick={() => setImportOpen((open) => !open)}>
					{dfTranslate("ui.import.code")}</button>
				<button type="button" onClick={() => openCardPicker("domain")}>
					{dfTranslate("ui.add.cards")}</button>
				<button type="button" onClick={handleDelete}>{dfTranslate("ui.delete")}</button>
			</div>

			{importOpen && (
				<div className="df-cs-import">
					<textarea
						className="df-cs-import-text"
						rows={3}
						placeholder={dfTranslate("ui.paste.a.character.code.dhc1.from.your.player")}
						value={importText}
						onChange={(e) => setImportText(e.target.value)}
					/>
					<div className="df-cs-import-buttons">
						<button type="button" className="mod-cta" onClick={handleImport} disabled={!importText.trim()}>
							{dfTranslate("ui.import")}</button>
						<button type="button" onClick={() => setImportOpen(false)}>{dfTranslate("ui.cancel")}</button>
					</div>
				</div>
			)}

			<SheetBody char={char} update={update} onAddCards={openCardPicker} />
		</div>
	);
}
