// https://lucide.dev/ for icons

import { Menu, Notice } from "obsidian";
import DaggerForgePlugin from "../main";
import { openContentBrowser } from "../utils/Sidebar";
import { DiceRollerModal, EncounterCalcModal, ImportDataModal } from "../features/index";
import { openCreator, confirmDeleteDataFile } from "./pluginOperations";
import { ContentCreatorModal } from "../features/creator/ContentCreatorModal";
import { openCharacterSheet, insertCharacterEmbed, CharacterPickerModal } from "../features/characters/index";
import { ItemModal } from "../features/items/ItemModal";

export function setupRibbonIcon(plugin: DaggerForgePlugin): void {
    plugin.addRibbonIcon(
        "scroll-text",
        "DaggerForge menu",
        (evt: MouseEvent) => {
            const menu = new Menu();

            menu.addItem(item => item.setTitle("Content Browser").setIcon("layout-grid").onClick(() => openContentBrowser(plugin)));
            menu.addItem(item => item.setTitle("Content Creator").setIcon("pencil-ruler").onClick(() => new ContentCreatorModal(plugin.app, plugin).open()));
            menu.addItem(item => item.setTitle("Character sheet").setIcon("user").onClick(() => openCharacterSheet(plugin)));

            menu.addSeparator();

            menu.addItem(item => item.setTitle("Dice roller").setIcon("dice").onClick(() => new DiceRollerModal(plugin.app).open()));
            menu.addItem(item => item.setTitle("Battle calculator").setIcon("flame").onClick(() => new EncounterCalcModal(plugin.app).open()));

            menu.addSeparator();

            menu.addItem(item => item.setTitle("Import data").setIcon("upload").onClick(() => new ImportDataModal(plugin.app, plugin).open()));
            menu.addItem(item => item.setTitle("Delete data file").setIcon("trash").onClick(() => confirmDeleteDataFile(plugin)));

            menu.showAtMouseEvent(evt);
        },
    );
}

export function setupCommands(plugin: DaggerForgePlugin): void {
    plugin.addCommand({
        id: "open-content-browser",
        name: "Open content browser",
        callback: () => openContentBrowser(plugin),
    });

    plugin.addCommand({
        id: "open-adversary-browser",
        name: "Open adversary browser",
        callback: () => openContentBrowser(plugin, "adversary"),
    });

    plugin.addCommand({
        id: "open-environment-browser",
        name: "Open environment browser",
        callback: () => openContentBrowser(plugin, "environment"),
    });

    plugin.addCommand({
        id: "open-character-browser",
        name: "Open character browser",
        callback: () => openContentBrowser(plugin, "character"),
    });

    plugin.addCommand({
        id: "open-item-browser",
        name: "Open item browser",
        callback: () => openContentBrowser(plugin, "item"),
    });

    plugin.addCommand({
        id: "item-creator",
        name: "Item creator",
        callback: () => new ItemModal(plugin).open(),
    });

    plugin.addCommand({
        id: "open-content-creator",
        name: "Open content creator",
        callback: () => new ContentCreatorModal(plugin.app, plugin).open(),
    });

    plugin.addCommand({
        id: "open-character-sheet",
        name: "Open character sheet",
        callback: () => openCharacterSheet(plugin),
    });

    plugin.addCommand({
        id: "insert-character-sheet",
        name: "Insert character sheet into note or canvas",
        callback: () => {
            const characters = plugin.dataManager.getCharacters();
            if (characters.length === 0) {
                new Notice("No saved characters yet. Open the character sheet to create one.");
                return;
            }
            new CharacterPickerModal(plugin.app, characters, (character) =>
                insertCharacterEmbed(plugin, character.id),
            ).open();
        },
    });

    plugin.addCommand({
        id: "adversary-creator",
        name: "Adversary creator",
        callback: () => openCreator(plugin, "adversary"),
    });

    plugin.addCommand({
        id: "environment-creator",
        name: "Environment creator",
        callback: () => openCreator(plugin, "environment"),
    });

    plugin.addCommand({
        id: "open-floating-window",
        name: "Open dice roller",
        callback: () => new DiceRollerModal(plugin.app).open(),
    });

    plugin.addCommand({
        id: "open-encounter-calculator",
        name: "Open battle calculator",
        callback: () => new EncounterCalcModal(plugin.app).open(),
    });

    plugin.addCommand({
        id: "import-data",
        name: "Import data from JSON file",
        callback: () => new ImportDataModal(plugin.app, plugin).open(),
    });

    plugin.addCommand({
        id: "delete-data-file",
        name: "Delete data file",
        callback: () => confirmDeleteDataFile(plugin),
    });
}
