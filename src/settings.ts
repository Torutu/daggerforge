import DaggerForgePlugin from '@/main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export interface DaggerForgeSettings {
    collapseButtonHidden: boolean;
}

export const DEFAULT: DaggerForgeSettings = {
    collapseButtonHidden: true,
}

export function collapseButtonToggle(value: boolean) {
    document.documentElement.style.setProperty('--df-collapse-button-display', (value ? 'none' : 'flex'));
}

export class DaggerForgeSettingTab extends PluginSettingTab {
  plugin: DaggerForgePlugin;

  constructor(app: App, plugin: DaggerForgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

    display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Hide collapse arrow')
      .setDesc('On cards, the collapse arrow will be hidden unless the name is hovered over.')
      .addToggle(toggle => toggle 
        .setValue(this.plugin.dataManager.settings.collapseButtonHidden)
        .onChange(async (value) => { 
            await this.plugin.dataManager.changeSetting('collapseButtonHidden', value);
            collapseButtonToggle(value);
        })
      );
  }
}