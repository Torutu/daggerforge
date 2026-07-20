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
		this.setPlaceholder("Pick a character to insert…");
	}

	getItems(): CharacterData[] {
		return [...this.characters].sort((a, b) =>
			(a.name || "Unnamed").localeCompare(b.name || "Unnamed"),
		);
	}

	getItemText(character: CharacterData): string {
		return character.name || "Unnamed character";
	}

	onChooseItem(character: CharacterData): void {
		this.onChoose(character);
	}
}
