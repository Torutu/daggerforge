import { TextInputModal } from "../adversaryCreator/textInputModalAdv";
// import { extractCardData } from "./cardDataHelpers";
// Update the import path below if the main plugin file is located elsewhere
import type DaggerForgePlugin from "../../main";
import { Editor, Notice } from "obsidian";

export class AdversaryEditor {
    constructor(private plugin: DaggerForgePlugin) {
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.plugin.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            const clickedElement = evt.target as HTMLElement;
            
            // Only trigger if clicking the edit button specifically
            const editButton = clickedElement.closest('.card-edit-button');
            if (!editButton) return;
            
            const card = editButton.closest('.card-outer');
            const editor = this.plugin.app.workspace.activeEditor?.editor;
            
            // if (card && editor) {
            //     this.open(editor, card as HTMLElement);
            // }
        });
    }

    // public open(editor: Editor, cardElement: HTMLElement) {
    //     const currentData = extractCardData(cardElement);
    //     this.plugin.updateCardData(cardElement, currentData);

    //     const modal = new TextInputModal(
    //         this.plugin,
    //         editor,
    //         cardElement,
    //         currentData
    //     );

    //     modal.onSubmit = (newHTML: string) => {
    //         const newCard = this.replaceCardContent(cardElement, newHTML);
    //         const newData = extractCardData(newCard);
    //         this.plugin.updateCardData(newCard, newData);
    //     };
    // }

    // private replaceCardContent(oldCard: HTMLElement, newHTML: string): HTMLElement {
    //     const wrapper = document.createElement('div');
    //     wrapper.innerHTML = newHTML;
    //     const newCard = wrapper.firstElementChild as HTMLElement;
    //     oldCard.replaceWith(newCard);
    //     return newCard;
    // }
}