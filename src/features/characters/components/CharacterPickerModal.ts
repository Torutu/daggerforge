import { translate as dfTranslate } from "../../../i18n";
import { App, FuzzySuggestModal } from "obsidian";
import { CharacterData } from "../../../types/character";

/** Fuzzy picker over saved characters, used by the insert-embed command. */
export class CharacterPickerModal extends FuzzySuggestModal<CharacterData> {
	private characters: CharacterData[];
	private onChoose: (character: CharacterData) => void;

	constructor(app: App, characters: CharacterData[], onChoose: (character: CharacterData) => void) {
		super(app);
		this.characters = characters;
		this.onChoose = onChoose;
		this.setPlaceholder(dfTranslate("ui.pick.a.character.to.insert"));
	}

	getItems(): CharacterData[] {
		return [...this.characters].sort((a, b) =>
			(a.name || dfTranslate("ui.dynamic.unnamed")).localeCompare(b.name || dfTranslate("ui.dynamic.unnamed")),
		);
	}

	getItemText(character: CharacterData): string {
		return character.name || dfTranslate("ui.dynamic.unnamed.character");
	}

	onChooseItem(character: CharacterData): void {
		this.onChoose(character);
	}
}
