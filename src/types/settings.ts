export interface KeywordSetting {
	enabled: boolean;
	color: string;
}

export interface PluginSettings {
	cardTheme: "default" | "dark";
	keywordHighlighting: boolean;
	diceBadgeTooltipMs: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	cardTheme: "default",
	keywordHighlighting: false,
	diceBadgeTooltipMs: 3000,
};
