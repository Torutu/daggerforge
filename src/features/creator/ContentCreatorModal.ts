import { App, Modal, setIcon } from "obsidian";
import DaggerForgePlugin from "../../main";
import { openCreator } from "../../utils/pluginOperations";
import { ItemModal } from "../items/ItemModal";

/**
 * Chooser shown when the user clicks "Content Creator" from the ribbon.
 * Two large cards let the user pick Adversary or Environment.
 * Direct commands ("Adversary creator", "Environment creator") bypass
 * this chooser and call openCreator() directly.
 */
export class ContentCreatorModal extends Modal {
	private plugin: DaggerForgePlugin;

	constructor(app: App, plugin: DaggerForgePlugin) {
		super(app);
		this.plugin = plugin;
		this.titleEl.setText("What do you want to create?");
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("df-creator-chooser");

		const grid = contentEl.createDiv({ cls: "df-creator-chooser-grid" });

		this.buildOption(grid, "adversary", "venetian-mask", "Adversary",
			"Create a new adversary card with stats, features, and abilities.");
		this.buildOption(grid, "environment", "mountain", "Environment",
			"Create a new environment card with features and GM questions.");
		this.buildOption(grid, "item", "backpack", "Item",
			"Create a weapon, armor, item, or consumable — guided fields included.");
	}

	onClose() {
		this.contentEl.empty();
	}

	private buildOption(container: HTMLElement, type: "adversary" | "environment" | "item", icon: string, label: string, desc: string) {
		const card = container.createDiv({ cls: "df-creator-option" });
		const iconEl = card.createDiv({ cls: "df-creator-option-icon" });
		setIcon(iconEl, icon);
		card.createEl("h3", { cls: "df-creator-option-label", text: label });
		card.createEl("p", { cls: "df-creator-option-desc", text: desc });
		card.addEventListener("click", () => {
			this.close();
			if (type === "item") new ItemModal(this.plugin).open();
			else openCreator(this.plugin, type);
		});
	}
}
