import React, { useEffect, useRef, useState } from "react";
import { Notice } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { CharacterData } from "../../types/character";
import { openCharacterSheet } from "./CharacterSheetView";
import { SheetBody } from "./components/SheetBody";

interface Props {
	plugin: DaggerForgePlugin;
	characterId: string | null;
}

/**
 * The character sheet as rendered inside a note or canvas embed.
 * Edits stay local until Save commits them to the stored character (which
 * refreshes every other mounted copy). Load pulls the latest saved version —
 * useful when the same character is embedded in several files.
 */
export function CharacterSheetEmbedApp({ plugin, characterId }: Props) {
	const [char, setChar] = useState<CharacterData | null>(() => findCharacter(plugin, characterId));
	const [dirty, setDirty] = useState(false);

	// Identifies this instance's own saves so the event echo doesn't loop back
	const originToken = useRef({}).current;
	const latest = useRef<{ char: CharacterData | null; dirty: boolean }>({ char, dirty });
	latest.current = { char, dirty };

	const update = (patch: Partial<CharacterData>) => {
		setChar((current) => (current ? { ...current, ...patch } : current));
		setDirty(true);
	};

	const save = () => {
		const current = latest.current.char;
		if (!current) return;
		void plugin.dataManager.upsertCharacter({ ...current, lastUpdated: Date.now() }, originToken);
		setDirty(false);
		new Notice("Character saved.");
	};

	const load = () => {
		const stored = findCharacter(plugin, characterId);
		if (!stored) {
			new Notice("This character is not in the vault anymore.");
			return;
		}
		setChar(stored);
		setDirty(false);
		new Notice("Loaded the latest saved version.");
	};

	// Safety net: an embed can be torn down invisibly (scrolling, mode switch,
	// closing the note) — save pending edits rather than lose them silently.
	useEffect(() => {
		return () => {
			const { char: pending, dirty: wasDirty } = latest.current;
			if (wasDirty && pending) {
				void plugin.dataManager.upsertCharacter({ ...pending, lastUpdated: Date.now() }, originToken);
			}
		};
	}, [plugin, originToken]);

	// Follow external changes (other embeds, the sheet view) while clean —
	// a dirty draft is never clobbered; press Load to overwrite it explicitly.
	useEffect(() => {
		const events = plugin.dataManager.events;
		const refs = [
			events.on("character-changed", (changed: CharacterData, origin?: unknown) => {
				if (origin === originToken || changed.id !== characterId) return;
				if (!latest.current.dirty) setChar(structuredClone(changed));
			}),
			events.on("character-deleted", (id: string) => {
				if (id === characterId) setChar(null);
			}),
			events.on("characters-reloaded", () => {
				if (!latest.current.dirty) setChar(findCharacter(plugin, characterId));
			}),
		];
		return () => refs.forEach((ref) => events.offref(ref));
	}, [plugin, characterId, originToken]);

	if (!char) {
		return (
			<div className="df-cs-missing">
				<p className="df-cs-missing-title">Character not found</p>
				<p className="df-cs-missing-hint">
					It may have been deleted or not imported into this vault yet. Import the player's
					character code and this embed will pick it up automatically.
				</p>
				<button type="button" onClick={() => void openCharacterSheet(plugin)}>
					Open character sheet
				</button>
			</div>
		);
	}

	return (
		<div className="df-cs-root">
			<div className="df-cs-embed-bar">
				<button type="button" className="mod-cta" onClick={save}>
					Save{dirty ? " •" : ""}
				</button>
				<button
					type="button"
					onClick={load}
					title="Pull the latest saved version of this character"
				>
					Load
				</button>
			</div>
			<SheetBody char={char} update={update} />
		</div>
	);
}

function findCharacter(plugin: DaggerForgePlugin, id: string | null): CharacterData | null {
	if (!id) return null;
	const found = plugin.dataManager.getCharacters().find((c) => c.id === id);
	return found ? structuredClone(found) : null;
}
