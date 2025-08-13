import { Editor, MarkdownView, Menu, Notice, Plugin } from "obsidian";
import {
	AdversaryView,
	ADVERSARY_VIEW_TYPE,
} from "./adversaries/adversarySearch";
import {
	EnvironmentView,
	ENVIRONMENT_VIEW_TYPE,
} from "./environments/environmentSearch";
import { TextInputModal } from "./adversaries/adversaryCreator/textInputModalAdv";
import { adversariesSidebar } from "./sidebar";
import { loadStyleSheet } from "./style";
import { openEnvironmentSidebar } from "./sidebar";
import { environmentToHTML } from "./environments/environmentsToHTML";
import { EnvironmentModal } from "./environments/environmentCreator/enviornmentModal";

export default class DaggerForgePlugin extends Plugin {
	savedInputStateAdv: Record<string, any> = {};
	savedInputStateEnv: Record<string, any> = {};

	async onload() {
		await loadStyleSheet(this);
		this.addStatusBarItem().setText("DaggerForge Active");

		// Register views
		this.registerView(
			ADVERSARY_VIEW_TYPE,
			(leaf) => new AdversaryView(leaf),
		);
		this.registerView(
			ENVIRONMENT_VIEW_TYPE,
			(leaf) => new EnvironmentView(leaf),
		);

		// Combined ribbon icon
		this.addRibbonIcon(
			"scroll-text",
			"DaggerForge Menu",
			(evt: MouseEvent) => {
				const menu = new Menu();

				menu.addItem((item) =>
					item
						.setTitle("Adversary Browser")
						.setIcon("venetian-mask")
						.onClick(() => adversariesSidebar(this)),
				);
				menu.addItem((item) =>
					item
						.setTitle("Environment Browser")
						.setIcon("mountain")
						.onClick(() => openEnvironmentSidebar(this)),
				);

				menu.addSeparator();

				menu.addItem((item) =>
					item
						.setTitle("Adversary Creator")
						.setIcon("swords")
						.onClick(() => this.openCreator("adversary")),
				);
				menu.addItem((item) =>
					item
						.setTitle("Environment Creator")
						.setIcon("landmark")
						.onClick(() => this.openCreator("environment")),
				);

				menu.showAtMouseEvent(evt);
			},
		);

		// Commands
		[1, 2, 3, 4].forEach((tier) => {
			this.addCommand({
				id: `load-tier-${tier}`,
				name: `Load Tier ${tier} Adversaries`,
				callback: () =>
					this.loadContentToMarkdown(`tier-${tier}-adversaries`),
			});
		});

		this.addCommand({
			id: "adversary-creator",
			name: "Adversary Creator",
			callback: () => this.openCreator("adversary"),
		});

		this.addCommand({
			id: "environment-creator",
			name: "Environment Creator",
			callback: () => this.openCreator("environment"),
		});
	}

	private async openCreator(type: "adversary" | "environment") {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("Please open a note first.");
			return;
		}

		if (activeView.getMode() !== "source") {
			new Notice("Please switch to Edit mode when using in a note.");
			return;
		}

		if (type === "adversary") {
			new TextInputModal(this, activeView.editor).open();
		} else {
			new EnvironmentModal(this, activeView.editor, (result) => {
				this.insertEnvironment(activeView.editor, result);
			}).open();
		}
	}

	private async loadContentToMarkdown(contentType: string) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("Please open a note first.");
			return;
		}

		let content = "";
		if (contentType.startsWith("tier-")) {
			const tier = contentType.split("-")[1];
			content = await this.getAdversaryTierContent(tier);
		}

		if (content) {
			activeView.editor.replaceSelection(content);
		}
	}

	private async getAdversaryTierContent(tier: string): Promise<string> {
		// Implement your logic to get markdown content for the tier
		return `# Tier ${tier} Adversaries\n\n...`;
	}

	private insertEnvironment(editor: Editor, result: any) {
		const html = environmentToHTML(result);
		if (editor) {
			editor.replaceSelection(html);
		}
	}

	onunload() {
		// Cleanup
	}
}

// private getActiveCanvas(): any | null {
//     const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
//     if (canvasLeaves.length === 0) return null;
//     return canvasLeaves[0].view;
// }

// private async insertIntoCanvasCard(canvas: any, content: string) {
//     try {
//         const selection = canvas.selection;
//         if (!selection?.size) {
//             new Notice("Please select a canvas card first.");
//             return;
//         }

//         for (const node of selection.values()) {
//             if (node?.type === 'text') {
//                 const currentText = node?.getText() || '';
//                 await node?.setText(currentText + (currentText ? '\n\n' : '') + content);
//                 new Notice("Added to canvas card!");
//             }
//         }
//     } catch (error) {
//         console.error("Canvas insertion error:", error);
//         new Notice("Failed to add to canvas card.");
//     }
// }

// private async loadContentToCanvas(contentType: string) {
//     const canvas = this.getActiveCanvas();
//     if (!canvas) {
//         new Notice("Please open a canvas first.");
//         return;
//     }

//     let content = "";
//     if (contentType.startsWith('tier-')) {
//         const tier = contentType.split('-')[1];
//         content = await this.getAdversaryTierContent(tier);
//     }

//     if (content) {
//         this.insertIntoCanvasCard(canvas, content);
//     }
// }

// private adversaryToMarkdown(data: any): string {
//     return `## ${data.name}\n\n**Type:** ${data.type}\n**Difficulty:** ${data.difficulty}\n\n${data.description}\n\n---\n`;
// }

// private async getAdversaryTierContent(tier: string): Promise<string> {
//     // Implement your logic to get markdown content for the tier
//     return `# Tier ${tier} Adversaries\n\n...`;
// }

// import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
// import { AdversaryView, ADVERSARY_VIEW_TYPE } from "./adversaries/adversarySearch";
// import { EnvironmentView, ENVIRONMENT_VIEW_TYPE } from "./environments/environmentSearch";
// import { TextInputModal } from "./adversaries/adversaryCreator/textInputModalAdv";
// import { loadAdversaryTier } from "./adversaries/adversaryList";
// import { adversariesSidebar } from "./sidebar";
// import { loadStyleSheet } from "./style";
// import { openEnvironmentSidebar } from "./sidebar";
// import { environmentToHTML } from './environments/environmentsToHTML';
// import { EnvironmentModal } from './environments/environmentCreator/enviornmentModal';

// export default class DaggerForgePlugin extends Plugin {
//     savedInputState: Record<string, any> = {};

//     async onload() {
//         // ======================
//         // INITIAL SETUP
//         // ======================
//         await loadStyleSheet(this);
//         this.addStatusBarItem().setText("Status Bar Text");

//         // ======================
//         // ADVERSARY FUNCTIONALITY
//         // ======================
//         this.registerView(ADVERSARY_VIEW_TYPE, (leaf) => new AdversaryView(leaf));

//         // Adversary Ribbon Icons
//         this.addRibbonIcon("venetian-mask", "Adversary Browser", () => {
//             adversariesSidebar(this);
//         });
//         this.addRibbonIcon("swords", "Adversary Creator", () => {
//             const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

//             if (!activeView) {
//                 new Notice("Please open a note first.");
//                 return;
//             }

//             const mode = activeView.getMode();
//             if (mode !== "source") {
//                 new Notice("Please switch to Edit mode to use the Adversary Creator.");
//                 return;
//             }

//             this.openAdversaryCreator();
//         });

//         // Adversary Commands
//         [1, 2, 3, 4].forEach((tier) => {
//             this.addCommand({
//                 id: `load-tier-${tier}`,
//                 name: `Load Tier ${tier} Adversaries`,
//                 editorCallback: (editor) => loadAdversaryTier(String(tier), editor),
//             });
//         });
//         this.addCommand({
//             id: "Adversary-Creator",
//             name: "Adversary-Creator",
//             editorCallback: (editor) => new TextInputModal(this, editor).open(),
//         });

//         // ======================
//         // ENVIRONMENT FUNCTIONALITY
//         // ======================
//         this.registerView(ENVIRONMENT_VIEW_TYPE, (leaf) => new EnvironmentView(leaf));

//         // Environment Ribbon Icons
//         this.addRibbonIcon("mountain", "Environment Browser", () => {
//             openEnvironmentSidebar(this);
//         });
//         this.addRibbonIcon("landmark", "Environment Creator", () => {
//             const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

//             if (!activeView) {
//                 new Notice("Please open a note first.");
//                 return;
//             }

//             const mode = activeView.getMode();
//             if (mode !== "source") {
//                 new Notice("Please switch to Edit mode to use the Environment Creator.");
//                 return;
//             }

//             this.openEnvironmentCreator();
//         });

//         // Environment Commands
//         this.addCommand({
//             id: "Environment-Creator",
//             name: "Environment Creator",
//             editorCallback: (editor: Editor) => {
//                 new EnvironmentModal(this, editor, (result) => {
//                     this.insertEnvironment(editor, result);
//                 }).open();
//             },
//         });
//     }

//     // ======================
//     // HELPER METHODS
//     // ======================
//     private openAdversaryCreator() {
//         const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
//         if (activeView) {
//             new TextInputModal(this, activeView.editor).open();
//         } else {
//             new Notice("Please open a note first to create an adversary.");
//         }
//     }

//     private openEnvironmentCreator() {
//         const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
//         if (activeView) {
//             new EnvironmentModal(this, activeView.editor, (result) => {
//                 this.insertEnvironment(activeView.editor, result);
//             }).open();
//         } else {
//             new Notice("Please open a note first to create an environment.");
//         }
//     }

//     private insertEnvironment(editor: Editor, result: any) {
//         const html = environmentToHTML(result);
//         if (editor) {
//             editor.replaceSelection(html);
//         } else {
//             new Notice("No active editor found. Create a new note first.");
//         }
//     }

//     onunload() {
//         // Clean up if needed
//     }
// }

// In your onload() method:
// this.registerDomEvent(document, 'click', (evt) => {
// 	const clickedElement = evt.target as HTMLElement;
// 	const editor = this.app.workspace.activeEditor?.editor;

// 	if (clickedElement.closest('.card-outer') && editor) {
// 		new TextInputModal(
// 			this,
// 			editor,
// 			clickedElement.closest('.card-outer') as HTMLElement
// 		).open();
// 	}
// });
// this.registerDomEvent(document, "click", (evt) => console.log("click", evt));
