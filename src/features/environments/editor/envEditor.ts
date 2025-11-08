import { Notice } from "obsidian";
import DaggerForgePlugin from "src/main"; // if you need the plugin instance

/**
 * Attaches edit button handlers to a container.
 * Uses event delegation so dynamically created cards work.
 */
export function attachEnvEditButtons(container: HTMLElement, plugin: DaggerForgePlugin) {
    container.addEventListener("click", (evt) => {
        const target = evt.target as HTMLElement;
        const editBtn = target.closest(".df-env-edit-button");
        if (!editBtn) return;

        evt.stopPropagation();

        // Find the card outer element
        const card = editBtn.closest(".df-env-card") as HTMLElement;
        if (!card) return;

        const editor = plugin.app.workspace.activeEditor?.editor;
        if (!editor) {
            new Notice("Please open a note in Edit mode to edit environments.");
            return;
        }

        // You can pass the env data here if needed
        new Notice("Pressed edit!");

        // Example: open your EnvironmentModal
        // const envData = extractEnvData(card); // implement this function
        // new EnvironmentModal(plugin, editor, (result) => {
        //     plugin.insertEnvironment(editor, result);
        // }).open();
    });
}
