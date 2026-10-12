import { App, PluginSettingTab, Setting, SliderComponent, ToggleComponent } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { DEFAULT_SETTINGS } from "../../types/index";

/** One settings row: its search metadata plus how to build its controls. */
interface SettingEntry {
	name: string;
	desc: string;
	build: (setting: Setting) => void;
}

export class DaggerForgeSettingsTab extends PluginSettingTab {
	private plugin: DaggerForgePlugin;
	private keywordToggle: ToggleComponent | null = null;
	private durationSlider: SliderComponent | null = null;

	constructor(app: App, plugin: DaggerForgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private entries(): SettingEntry[] {
		return [
			{
				name: "Enable keyword highlighting",
				desc: "Color game terms (hope, fear, hp, stress) inside rendered cards.",
				build: (setting) => this.buildKeywordHighlighting(setting),
			},
			{
				name: "Roll result duration",
				desc: "How long the roll result stays visible.",
				build: (setting) => this.buildRollDuration(setting),
			},
			{
				name: "Restore defaults",
				desc: "Reset all settings to their default values.",
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
			name: entry.name,
			desc: entry.desc,
			render: (setting: Setting) => {
				setting.setName(entry.name).setDesc(entry.desc);
				entry.build(setting);
			},
		}));
	}

	/** Fallback renderer for Obsidian versions older than 1.13. */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		for (const entry of this.entries()) {
			const setting = new Setting(containerEl).setName(entry.name).setDesc(entry.desc);
			entry.build(setting);
		}
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
			.addExtraButton((btn) =>
				btn
					.setIcon("reset")
					.setTooltip(`Default: ${DEFAULT_SETTINGS.diceBadgeTooltipMs / 1000}s`)
					.onClick(async () => {
						this.plugin.settings.diceBadgeTooltipMs = DEFAULT_SETTINGS.diceBadgeTooltipMs;
						await this.save();
						this.syncControls();
					}),
			);
	}

	private buildRestoreDefaults(setting: Setting): void {
		setting.addButton((btn) =>
			btn
				.setButtonText("Restore defaults")
				.setWarning()
				.onClick(async () => {
					this.plugin.settings = { ...DEFAULT_SETTINGS };
					await this.save();
					this.syncControls();
				}),
		);
	}

	/** Pushes the saved values back into the rendered controls. */
	private syncControls(): void {
		this.keywordToggle?.setValue(this.plugin.settings.keywordHighlighting);
		this.durationSlider?.setValue(this.plugin.settings.diceBadgeTooltipMs / 1000);
	}

	private async save(): Promise<void> {
		await this.plugin.dataManager.updateSettings(this.plugin.settings);
		this.plugin.applySettings();
	}
}
