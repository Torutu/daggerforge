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

    
  }
}