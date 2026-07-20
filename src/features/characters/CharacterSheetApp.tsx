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
				(a.name || "Unnamed").localeCompare(b.name || "Unnamed"),
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
		new Notice("Character saved.");
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
			new Notice("Character saved and code copied - send it to your GM.");
		} catch (error) {
			console.error("DaggerForge: failed to copy character code", error);
			new Notice("Could not copy the character code.");
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
			new Notice(existed ? "Character updated from code." : "Character imported from code.");
		} catch (error) {
			console.error("DaggerForge: failed to import character code", error);
			new Notice("That doesn't look like a valid character code.");
		}
	};

	/** Runs an action that replaces the open sheet, confirming if edits would be lost. */
	const confirmDiscard = (action: () => void) => {
		if (!dirty) {
			action();
			return;
		}
		new ConfirmModal(plugin.app, {
			title: "Discard unsaved changes?",
			message: "This sheet has unsaved changes that will be lost.",
			confirmLabel: "Discard",
			onConfirm: action,
		}).open();
	};

	const handleNew = (evt: React.MouseEvent) => {
		const menu = new Menu();
		menu.addItem((item) =>
			item.setTitle("Blank character").setIcon("file").onClick(() =>
				confirmDiscard(() => {
					setChar(createEmptyCharacter(generateCharacterUniqueId()));
					setDirty(false);
				}),
			),
		);
		menu.addItem((item) =>
			item.setTitle("Guided creation").setIcon("wand").onClick(() =>
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
			title: "Delete character?",
			message: `"${char.name || "Unnamed character"}" will be removed from your saved characters.`,
			confirmLabel: "Delete",
			onConfirm: async () => {
				await plugin.dataManager.deleteCharacterById(char.id);
				setChar(createEmptyCharacter(generateCharacterUniqueId()));
				setDirty(false);
				setStoreVersion((v) => v + 1);
				new Notice("Character deleted.");
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
					<h2 className="df-cs-intro-title">Forge your first hero</h2>
					<p className="df-cs-intro-sub">No saved characters yet. How do you want to begin?</p>
					<div className="df-cs-intro-options">
						<button
							type="button"
							className="df-cs-intro-opt"
							onClick={() => setIntroDismissed(true)}
						>
							<span className="df-cs-intro-opt-name">Blank sheet</span>
							<span className="df-cs-intro-opt-desc">
								Start from an empty character sheet and fill everything in yourself.
							</span>
						</button>
						<button
							type="button"
							className="df-cs-intro-opt df-cs-intro-opt--accent"
							onClick={() => {
								setIntroDismissed(true);
								setWizardOpen(true);
							}}
						>
							<span className="df-cs-intro-opt-name">Guided creation</span>
							<span className="df-cs-intro-opt-desc">
								Pick a class, heritage, experiences, and domain cards step by step; the sheet
								fills itself from your choices.
							</span>
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
					aria-label="Saved characters"
				>
					<option value="" disabled>
						{isSaved ? "Switch character…" : "New character"}
					</option>
					{characters.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name || "Unnamed character"}
						</option>
					))}
				</select>
				<button type="button" onClick={handleNew}>New</button>
				<button type="button" className="mod-cta" onClick={handleSave}>
					Save{dirty ? " •" : ""}
				</button>
				<button type="button" onClick={handleCopyCode}>Copy code</button>
				<button type="button" onClick={handleInsert} title="Embed this sheet in the last-focused note or canvas">
					Insert in note/canvas
				</button>
				<button type="button" onClick={() => setImportOpen((open) => !open)}>
					Import code
				</button>
				<button type="button" onClick={() => openCardPicker("domain")}>
					Add cards
				</button>
				<button type="button" onClick={handleDelete}>Delete</button>
			</div>

			{importOpen && (
				<div className="df-cs-import">
					<textarea
						className="df-cs-import-text"
						rows={3}
						placeholder="Paste a character code (DHC1.…) from your player"
						value={importText}
						onChange={(e) => setImportText(e.target.value)}
					/>
					<div className="df-cs-import-buttons">
						<button type="button" className="mod-cta" onClick={handleImport} disabled={!importText.trim()}>
							Import
						</button>
						<button type="button" onClick={() => setImportOpen(false)}>Cancel</button>
					</div>
				</div>
			)}

			<SheetBody char={char} update={update} onAddCards={openCardPicker} />
		</div>
	);
}
