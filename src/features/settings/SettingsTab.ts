import { App, PluginSettingTab, Setting } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { DEFAULT_SETTINGS } from "../../types/index";

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
			.setName("Enable keyword highlighting")
			.setDesc("Color game terms (Hope, Fear, HP, Stress) inside rendered cards.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.keywordHighlighting)
					.onChange(async (value) => {
						this.plugin.settings.keywordHighlighting = value;
						await this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Roll result duration")
			.setDesc("How long the roll result stays visible.")
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
			.setName("Restore defaults")
			.setDesc("Reset all settings to their default values.")
			.addButton((btn) =>
				btn
					.setButtonText("Restore defaults")
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
