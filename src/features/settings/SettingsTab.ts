import { App, PluginSettingTab, Setting } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { DEFAULT_SETTINGS } from "../../types/index";
import { translate as t } from "../../i18n";

export class DaggerForgeSettingsTab extends PluginSettingTab {
	private plugin: DaggerForgePlugin;

	constructor(app: App, plugin: DaggerForgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "DaggerForge" });

		new Setting(containerEl)
			.setName(t("settings.language.name"))
			.setDesc(t("settings.language.description"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("en", "English")
					.addOption("de", "Deutsch")
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value === "de" ? "de" : "en";
						await this.save();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.keywordHighlighting.name"))
			.setDesc(t("settings.keywordHighlighting.description"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.keywordHighlighting)
					.onChange(async (value) => {
						this.plugin.settings.keywordHighlighting = value;
						await this.save();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.rollDuration.name"))
			.setDesc(t("settings.rollDuration.description"))
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.diceBadgeTooltipMs / 1000)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.diceBadgeTooltipMs = value * 1000;
						await this.save();
					}),
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("reset")
					.setTooltip(`Default: ${DEFAULT_SETTINGS.diceBadgeTooltipMs / 1000}s`)
					.onClick(async () => {
						this.plugin.settings.diceBadgeTooltipMs = DEFAULT_SETTINGS.diceBadgeTooltipMs;
						await this.save();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.restore.name"))
			.setDesc(t("settings.restore.description"))
			.addButton((btn) =>
				btn
					.setButtonText(t("settings.restore.button"))
					.setWarning()
					.onClick(async () => {
						this.plugin.settings = { ...DEFAULT_SETTINGS };
						await this.save();
						this.display();
					}),
			);
	}

	private async save(): Promise<void> {
		await this.plugin.dataManager.updateSettings(this.plugin.settings);
		this.plugin.applySettings();
	}
}
