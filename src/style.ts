import { Plugin } from "obsidian";

export async function loadStyleSheet(plugin: Plugin) {
	try {
		const cssPath = '.obsidian/plugins/daggerforge/style.css'; // Path to your CSS file in the plugin folder
		const cssContent = await plugin.app.vault.adapter.read(cssPath); // Adapter API must be used here

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
