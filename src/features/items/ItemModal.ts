import { translate as dfTranslate } from "../../i18n";
import { Modal, Notice } from "obsidian";
import type DaggerForgePlugin from "../../main";
import { GearData } from "../../types/srd";
import { encodeGearCode } from "../embeds/embedCode";
import { insertAtFocusedTarget } from "../embeds/insertDestination";
import { buildItemEmbedBlock } from "./ItemEmbed";

const KIND_GUIDE: Record<GearData["kind"], { hint: string; statsPlaceholder: string }> = {
	item: {
		hint: "A relic, tool, or wondrous object the party keeps.",
		statsPlaceholder: "Category, e.g. General or Relic (optional)",
	},
	consumable: {
		hint: "Single-use: potions, bombs, scrolls. Usually consumed on activation.",
		statsPlaceholder: "Category, e.g. Enhancement or Utility (optional)",
	},
	weapon: {
		hint: "Something the party fights with.",
		statsPlaceholder: "Trait - Range · damage · burden, e.g. Agility - Melee · d8 phy · One-Handed",
	},
	armor: {
		hint: "Worn protection.",
		statsPlaceholder: "Thresholds and score, e.g. Thresholds 6/13 · Score 4",
	},
	wheelchair: {
		hint: "A combat wheelchair - works like a weapon.",
		statsPlaceholder: "Trait - Range · damage · burden, e.g. Agility - Melee · d8 phy · One-Handed",
	},
};

/**
 * Guided creator for custom gear. Every field explains what belongs in it;
 * the stats placeholder adapts to the chosen kind.
 */
export class ItemModal extends Modal {
	private plugin: DaggerForgePlugin;

	constructor(plugin: DaggerForgePlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.titleEl.setText(dfTranslate("ui.create.an.item"));
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("df-item-modal");

		const field = (label: string, hint: string): HTMLElement => {
			const wrap = contentEl.createDiv({ cls: "df-item-field" });
			wrap.createEl("label", { text: label, cls: "df-item-field-label" });
			wrap.createEl("p", { text: hint, cls: "df-item-field-hint" });
			return wrap;
		};

		const nameWrap = field("Name", "What the party will call it.");
		const nameInput = nameWrap.createEl("input", { type: "text" });
		nameInput.placeholder = "e.g. Bag of Ficklesand";

		const kindWrap = field("Kind", KIND_GUIDE.item.hint);
		const kindHint = kindWrap.querySelector<HTMLElement>(".df-item-field-hint");
		const kindSelect = kindWrap.createEl("select", { cls: "dropdown" });
		(Object.keys(KIND_GUIDE) as Array<GearData["kind"]>).forEach((kind) => {
			kindSelect.createEl("option", { text: kind.charAt(0).toUpperCase() + kind.slice(1), value: kind });
		});

		const tierWrap = field("Tier (optional)", "1–4, matching party level ranges. Leave 0 for none.");
		const tierInput = tierWrap.createEl("input", { type: "number" });
		tierInput.min = "0";
		tierInput.max = "4";
		tierInput.value = "0";

		const rarityWrap = field("Rarity (optional)", "How hard it is to find.");
		const raritySelect = rarityWrap.createEl("select", { cls: "dropdown" });
		["", "Common", "Uncommon", "Rare", "Legendary"].forEach((r) =>
			raritySelect.createEl("option", { text: r || "-", value: r }),
		);

		const statsWrap = field("Stats line", "One line of numbers shown under the name.");
		const statsInput = statsWrap.createEl("input", { type: "text" });
		statsInput.placeholder = KIND_GUIDE.item.statsPlaceholder;

		const textWrap = field(
			"Effect",
			'What it does in play. Start with a feature name to bold it, e.g. "Quick: When you attack…".',
		);
		const textArea = textWrap.createEl("textarea");
		textArea.rows = 4;
		textArea.placeholder = "e.g. During downtime, you automatically clear a Stress.";

		kindSelect.addEventListener("change", () => {
			const guide = KIND_GUIDE[kindSelect.value as GearData["kind"]];
			if (kindHint) kindHint.setText(guide.hint);
			statsInput.placeholder = guide.statsPlaceholder;
		});

		const buttons = contentEl.createDiv({ cls: "df-cs-confirm-buttons" });
		const create = buttons.createEl("button", { text: dfTranslate("ui.create.insert"), cls: "mod-cta" });
		create.addEventListener("click", async () => {
			const name = nameInput.value.trim();
			if (!name) {
				new Notice(dfTranslate("ui.give.the.item.a.name.first"));
				return;
			}
			const tier = Number(tierInput.value);
			const item: GearData = {
				id: "",
				kind: kindSelect.value as GearData["kind"],
				name,
				tier: Number.isInteger(tier) && tier >= 1 && tier <= 4 ? tier : null,
				rarity: raritySelect.value || null,
				meta: statsInput.value.trim(),
				text: textArea.value.trim(),
				source: "custom",
			};
			await this.plugin.dataManager.upsertItem(item);
			new Notice(`Created ${name}.`);
			const code = await encodeGearCode(item);
			insertAtFocusedTarget(this.plugin, buildItemEmbedBlock(item.id, code), { width: 420, height: 260 }, name);
			this.close();
		});
		buttons.createEl("button", { text: dfTranslate("ui.cancel") }).addEventListener("click", () => this.close());
	}

	onClose() {
		this.contentEl.empty();
	}
}
