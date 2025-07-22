import { Plugin } from "obsidian";

export async function loadStyleSheet(plugin: Plugin) {
    try {
        const configDir = plugin.app.vault.configDir;
        const cssPath = `${configDir}/plugins/daggerforge/style.css`;
        const cssContent = await plugin.app.vault.adapter.read(cssPath);
        const styleEl = document.createElement("style");
        styleEl.id = "daggerheart-style";
        styleEl.textContent = cssContent;
        document.head.appendChild(styleEl);

        plugin.register(() => {
            document.getElementById("daggerheart-style")?.remove();
        });
    } catch (error) {
        console.warn("Could not load style.css from plugin folder:", error);
    }
}
