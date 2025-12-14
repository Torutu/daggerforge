import { Notice, App } from "obsidian";
import type DaggerForgePlugin from "../main";
import { getActiveCanvas } from "@/utils";

export const onCollapseClick = (
    evt: Event,
    cardType: string,
) => {
    evt.stopPropagation();

    const button = evt.target as HTMLElement;
    let cardElement: HTMLElement | null = null;
    
    if (cardType === "adv") {
        cardElement = button.closest(".df-card-outer");
    }

    if (!cardElement) {
        new Notice("Could not find card element!");
        return;
    }

    const toggleElement = (element: HTMLElement | string): void => {
        if (typeof element === 'string'){
            new Notice(`Could not find ${element}!`);
            return;
        }
        element.hidden = !element.hidden;
        return;
    }

    let hiddenElementClasses: string[] = [];
    //Temporary, meant to symbolize settings chosen.
    hiddenElementClasses.push(".df-adv-edit-button",".df-subtitle",".df-desc",".df-motives", ".df-section", ".df-feature");
    //
    hiddenElementClasses.forEach(elementClass => {
        if (elementClass === ".df-feature"){
            Array.from(cardElement?.querySelectorAll<HTMLElement>(elementClass)).forEach(element => {
                toggleElement(element ?? elementClass);
            });
        } else {
            toggleElement(cardElement?.querySelector<HTMLElement>(elementClass) ?? elementClass);
        }
    });

    button.style.rotate = (button.style.rotate === "-90deg" ? "0deg" : "-90deg");
}