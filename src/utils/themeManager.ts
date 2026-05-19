import type { PluginSettings } from "../types/index";

export function applyTheme(theme: PluginSettings["cardTheme"]): void {
	document.body.setAttribute("data-df-theme", theme);
}
