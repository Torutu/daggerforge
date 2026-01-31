import { Menu, Plugin } from "obsidian";
import DaggerForgePlugin from "../main";
import { adversariesSidebar, openEnvironmentSidebar, ImportDataModal } from "../ui/index";
import { openDiceRoller, openEncounterCalculator } from "../features/index";

export function createView(plugin: Plugin, viewType: string, view: any) {
    plugin.registerView(viewType, (leaf) => new view(leaf));
}

export function setupRibbonIcon(plugin: DaggerForgePlugin): void {
    plugin.addRibbonIcon(
        "scroll-text",
        "DaggerForge menu",
        (evt: MouseEvent) => {
            const menu = new Menu();

            menu.addItem(item => item.setTitle("Adversary browser").setIcon("venetian-mask").onClick(() => adversariesSidebar(plugin)));
            menu.addItem(item => item.setTitle("Environment browser").setIcon("mountain").onClick(() => openEnvironmentSidebar(plugin)));

            menu.addSeparator();
            
            menu.addItem(item => item.setTitle("Adversary creator").setIcon("swords").onClick(() => plugin.openCreator("adversary")));
            menu.addItem(item => item.setTitle("Environment creator").setIcon("landmark").onClick(() => plugin.openCreator("environment")));

            menu.addSeparator();

            menu.addItem(item => item.setTitle("Dice roller").setIcon("dice").onClick(() => openDiceRoller(plugin)));
            menu.addItem(item => item.setTitle("Battle calculator").setIcon("flame").onClick(() => openEncounterCalculator()));

            menu.addSeparator();

            menu.addItem(item => item.setTitle("Import data").setIcon("upload").onClick(() => new ImportDataModal(plugin.app, plugin).open()));
            menu.addItem(item => item.setTitle("Delete data file").setIcon("trash").onClick(() => plugin.confirmDeleteDataFile()));

            menu.showAtMouseEvent(evt);
        },
    );
}

export function setupCommands(plugin: DaggerForgePlugin): void {
    plugin.addCommand({
            id: "open-adversary-browser",
            name: "Open adversary browser",
            callback: () => adversariesSidebar(plugin),
        });

        plugin.addCommand({
            id: "open-environment-browser",
            name: "Open environment browser",
            callback: () => openEnvironmentSidebar(plugin),
        });

        plugin.addCommand({
            id: "adversary-creator",
            name: "Adversary creator",
            callback: () => plugin.openCreator("adversary"),
        });
        plugin.addCommand({
            id: "environment-creator",
            name: "Environment creator",
            callback: () => plugin.openCreator("environment"),
        });
            
        plugin.addCommand({
            id: "open-floating-window",
            name: "Open dice roller",
            callback: () => openDiceRoller(plugin),
        });

        plugin.addCommand({
            id: "open-encounter-calculator",
            name: "Open battle calculator",
            callback: () => openEncounterCalculator(),
        });

        plugin.addCommand({
            id: "import-data",
            name: "Import data from JSON file",
            callback: () => {
                new ImportDataModal(plugin.app, plugin).open();
            },
        });

        plugin.addCommand({
            id: "delete-data-file",
            name: "Delete data file",
            callback: () => plugin.confirmDeleteDataFile(),
        });
}