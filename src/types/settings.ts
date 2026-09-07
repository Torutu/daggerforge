import type { Language } from "../i18n";

export interface KeywordSetting {
	enabled: boolean;
	color: string;
}

export interface PluginSettings {
	language: Language;
	cardTheme: "default" | "dark";
	keywordHighlighting: boolean;
	diceBadgeTooltipMs: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	language: "en",
	cardTheme: "default",
	keywordHighlighting: false,
	diceBadgeTooltipMs: 3000,
};
