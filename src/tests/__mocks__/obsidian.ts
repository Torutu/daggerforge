/**
 * Minimal stub for the 'obsidian' module.
 * 
 * Jest can't resolve 'obsidian' because it only exists inside the Obsidian
 * Electron process.  This file provides empty stand-ins for every export
 * that gets pulled in transitively when tests import DataManager or
 * SearchEngine (the chain goes through utils/index → canvasHelpers →
 * obsidian).  Nothing here needs real behaviour - the tests never call
 * any Obsidian API directly.
 */

export class Plugin {
    app: unknown = {};
    async loadData() { return null; }
    async saveData(_data: unknown) {}
    registerEvent() {}
    registerDomEvent() {}
    registerInterval() {}
    addCommand() {}
    addSettingTab() {}
    addStatusBarItem() { return { setText: () => {} }; }
    registerView() {}
}

export class Modal {
    app: unknown;
    contentEl: unknown = { createEl: () => ({}), empty: () => {} };
    constructor(_app: unknown) {}
    open() {}
    close() {}
}

export class ItemView {
    app: unknown;
    containerEl: unknown = { children: [null, { empty: () => {}, createEl: () => ({}), createDiv: () => ({}) }] };
    leaf: unknown;
    constructor(_leaf: unknown) {}
    getViewType() { return ''; }
    getDisplayText() { return ''; }
    getIcon() { return ''; }
    registerEvent() {}
}

export class MarkdownView {
    editor: unknown = { replaceSelection: () => {} };
    getMode() { return 'source'; }
}

export class Notice {
    constructor(_message: string) {}
}

/** Behaviour-faithful Events stub - DataManager's character sync relies on it. */
export class Events {
    private handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
    on(name: string, callback: (...args: unknown[]) => void) {
        (this.handlers[name] ??= []).push(callback);
        return { name, callback };
    }
    offref(ref: { name: string; callback: (...args: unknown[]) => void }) {
        const list = this.handlers[ref.name];
        if (list) this.handlers[ref.name] = list.filter((cb) => cb !== ref.callback);
    }
    trigger(name: string, ...args: unknown[]) {
        for (const cb of this.handlers[name] ?? []) cb(...args);
    }
}

export class MarkdownRenderChild {
    containerEl: unknown;
    constructor(containerEl: unknown) { this.containerEl = containerEl; }
    onload() {}
    onunload() {}
}

export class Menu {
    addItem() { return this; }
    addSeparator() { return this; }
    showAtMouseEvent() {}
}

export class FuzzySuggestModal {
    app: unknown;
    constructor(_app: unknown) {}
    open() {}
    close() {}
    setPlaceholder() {}
}

export function setIcon() {}
export function requestUrl() { return Promise.resolve({ json: () => ({}) }); }
export function normalizePath(p: string) { return p; }

export const Platform = {
    isDesktopApp: true,
    isMobileApp: false,
};
