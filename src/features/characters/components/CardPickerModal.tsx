import { App, Modal } from "obsidian";
import React, { useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { CharacterData } from "../../../types/character";
import { GearData } from "../../../types/srd";
import { CardPicker } from "./CardPicker";
import { PickerTab } from "./SheetSections";

interface CardPickerModalOptions {
	char: CharacterData;
	tab: PickerTab;
	/** Forwards picker edits to the sheet's update() */
	onPatch: (patch: Partial<CharacterData>) => void;
	customItems?: GearData[];
}

/**
 * Centered modal wrapper around the card gallery, so "Add cards" is always
 * fully visible no matter where on the (tall) sheet it was opened from.
 */
export class CardPickerModal extends Modal {
	private root: Root | null = null;
	private options: CardPickerModalOptions;

	constructor(app: App, options: CardPickerModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen() {
		this.modalEl.addClass("df-cs-picker-modal");
		this.root = createRoot(this.contentEl);
		this.root.render(
			<PickerModalApp
				initial={this.options.char}
				tab={this.options.tab}
				onPatch={this.options.onPatch}
				customItems={this.options.customItems}
				onClose={() => this.close()}
			/>,
		);
	}

	onClose() {
		this.root?.unmount();
		this.root = null;
		this.contentEl.empty();
	}
}

/** Mirrors picker edits locally so "Added ✓" states update inside the modal. */
function PickerModalApp({
	initial,
	tab: initialTab,
	onPatch,
	customItems,
	onClose,
}: {
	initial: CharacterData;
	tab: PickerTab;
	onPatch: (patch: Partial<CharacterData>) => void;
	customItems?: GearData[];
	onClose: () => void;
}) {
	const [char, setChar] = useState(initial);
	const [tab, setTab] = useState<PickerTab>(initialTab);

	const update = (patch: Partial<CharacterData>) => {
		setChar((current) => ({ ...current, ...patch }));
		onPatch(patch);
	};

	return (
		<CardPicker
			char={char}
			update={update}
			tab={tab}
			onTabChange={setTab}
			onClose={onClose}
			customItems={customItems}
		/>
	);
}
