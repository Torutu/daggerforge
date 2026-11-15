import { App, ButtonComponent, DropdownComponent, ExtraButtonComponent, PluginSettingTab, Setting, SliderComponent, ToggleComponent } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { DEFAULT_SETTINGS } from "../../types/index";
import { translate as t, TranslationKey } from "../../i18n";

/** One settings row: its translated search metadata plus how to build its controls. */
interface SettingEntry {
	nameKey: TranslationKey;
	descKey: TranslationKey;
	build: (setting: Setting) => void;
}

export class DaggerForgeSettingsTab extends PluginSettingTab {
	private plugin: DaggerForgePlugin;
	private languageDropdown: DropdownComponent | null = null;
	private keywordToggle: ToggleComponent | null = null;
	private durationSlider: SliderComponent | null = null;
	private durationResetButton: ExtraButtonComponent | null = null;
	private restoreButton: ButtonComponent | null = null;
	/** Rendered rows, kept so a language change can relabel them in place. */
	private rows: { setting: Setting; entry: SettingEntry }[] = [];

	constructor(app: App, plugin: DaggerForgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private entries(): SettingEntry[] {
		return [
			{
				nameKey: "settings.language.name",
				descKey: "settings.language.description",
				build: (setting) => this.buildLanguage(setting),
			},
			{
				nameKey: "settings.keywordHighlighting.name",
				descKey: "settings.keywordHighlighting.description",
				build: (setting) => this.buildKeywordHighlighting(setting),
			},
			{
				nameKey: "settings.rollDuration.name",
				descKey: "settings.rollDuration.description",
				build: (setting) => this.buildRollDuration(setting),
			},
			{
				nameKey: "settings.restore.name",
				descKey: "settings.restore.description",
				build: (setting) => this.buildRestoreDefaults(setting),
			},
		];
	}

	/**
	 * Obsidian 1.13+ renders the tab from these definitions (and indexes them
	 * for settings search); display() below is only used on older versions.
	 */
	getSettingDefinitions() {
		return this.entries().map((entry) => ({
			name: t(entry.nameKey),
			desc: t(entry.descKey),
			render: (setting: Setting) => this.renderRow(setting, entry),
		}));
	}

	/** Fallback renderer for Obsidian versions older than 1.13. */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		for (const entry of this.entries()) {
			this.renderRow(new Setting(containerEl), entry);
		}
	}

	private renderRow(setting: Setting, entry: SettingEntry): void {
		this.rows = this.rows.filter((row) => row.setting.settingEl.isConnected);
		this.rows.push({ setting, entry });
		setting.setName(t(entry.nameKey)).setDesc(t(entry.descKey));
		entry.build(setting);
	}

	private buildLanguage(setting: Setting): void {
		setting.addDropdown((dropdown) => {
			this.languageDropdown = dropdown;
			dropdown
				.addOption("en", "English")
				.addOption("de", "Deutsch")
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = value === "de" ? "de" : "en";
					await this.save();
					this.relabel();
				});
		});
	}

	private buildKeywordHighlighting(setting: Setting): void {
		setting.addToggle((toggle) => {
			this.keywordToggle = toggle;
			toggle
				.setValue(this.plugin.settings.keywordHighlighting)
				.onChange(async (value) => {
					this.plugin.settings.keywordHighlighting = value;
					await this.save();
				});
		});
	}

	private buildRollDuration(setting: Setting): void {
		setting
			.addSlider((slider) => {
				this.durationSlider = slider;
				slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.diceBadgeTooltipMs / 1000)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.diceBadgeTooltipMs = value * 1000;
						await this.save();
					});
			})
			.addExtraButton((btn) => {
				this.durationResetButton = btn;
				btn
					.setIcon("reset")
					.setTooltip(this.durationDefaultTooltip())
					.onClick(async () => {
						this.plugin.settings.diceBadgeTooltipMs = DEFAULT_SETTINGS.diceBadgeTooltipMs;
						await this.save();
						this.syncControls();
					});
			});
	}

	private buildRestoreDefaults(setting: Setting): void {
		setting.addButton((btn) => {
			this.restoreButton = btn;
			btn
				.setButtonText(t("settings.restore.button"))
				.setWarning()
				.onClick(async () => {
					this.plugin.settings = { ...DEFAULT_SETTINGS };
					await this.save();
					this.syncControls();
					this.relabel();
				});
		});
	}

	private durationDefaultTooltip(): string {
		return t("settings.rollDuration.default", { seconds: DEFAULT_SETTINGS.diceBadgeTooltipMs / 1000 });
	}

	/** Pushes the saved values back into the rendered controls. */
	private syncControls(): void {
		this.languageDropdown?.setValue(this.plugin.settings.language);
		this.keywordToggle?.setValue(this.plugin.settings.keywordHighlighting);
		this.durationSlider?.setValue(this.plugin.settings.diceBadgeTooltipMs / 1000);
	}

	/** Re-applies translated labels to the rendered rows after a language change. */
	private relabel(): void {
		for (const { setting, entry } of this.rows) {
			setting.setName(t(entry.nameKey)).setDesc(t(entry.descKey));
		}
		this.durationResetButton?.setTooltip(this.durationDefaultTooltip());
		this.restoreButton?.setButtonText(t("settings.restore.button"));
	}

	private async save(): Promise<void> {
		await this.plugin.dataManager.updateSettings(this.plugin.settings);
		this.plugin.applySettings();
	}
}
