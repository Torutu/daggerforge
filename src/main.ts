import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { AdversaryView, ADVERSARY_VIEW_TYPE } from "./adversaries/adversarySearch";
import { EnvironmentView, ENVIRONMENT_VIEW_TYPE } from "./environments/environmentSearch";
import { TextInputModal } from "./adversaries/adversaryCreator/textInputModalAdv";
import { loadAdversaryTier } from "./adversaries/adversaryList";
import { adversariesSidebar } from "./sidebar";
import { loadStyleSheet } from "./style";
import { openEnvironmentSidebar } from "./sidebar";
import { environmentToHTML } from './environments/environmentsToHTML';
import { EnvironmentModal } from './environments/environmentCreator/enviornmentModal';

export default class DaggerForgePlugin extends Plugin {
    savedInputState: Record<string, any> = {};
    
    async onload() {
        // ======================
        // INITIAL SETUP
        // ======================
        await loadStyleSheet(this);
        this.addStatusBarItem().setText("Status Bar Text");

        // ======================
        // ADVERSARY FUNCTIONALITY
        // ======================
        this.registerView(ADVERSARY_VIEW_TYPE, (leaf) => new AdversaryView(leaf));
        
        // Adversary Ribbon Icons
        this.addRibbonIcon("venetian-mask", "Adversary Browser", () => {
            adversariesSidebar(this);
        });
        this.addRibbonIcon("swords", "Adversary Creator", () => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

            if (!activeView) {
                new Notice("Please open a note first.");
                return;
            }

            const mode = activeView.getMode();
            if (mode !== "source") {
                new Notice("Please switch to Edit mode to use the Adversary Creator.");
                return;
            }

            this.openAdversaryCreator();
        });


        // Adversary Commands
        [1, 2, 3, 4].forEach((tier) => {
            this.addCommand({
                id: `load-tier-${tier}`,
                name: `Load Tier ${tier} Adversaries`,
                editorCallback: (editor) => loadAdversaryTier(String(tier), editor),
            });
        });
        this.addCommand({
            id: "Adversary-Creator",
            name: "Adversary-Creator",
            editorCallback: (editor) => new TextInputModal(this, editor).open(),
        });

        // ======================
        // ENVIRONMENT FUNCTIONALITY
        // ======================
        this.registerView(ENVIRONMENT_VIEW_TYPE, (leaf) => new EnvironmentView(leaf));
        
        // Environment Ribbon Icons
        this.addRibbonIcon("mountain", "Environment Browser", () => {
            openEnvironmentSidebar(this);
        });
        this.addRibbonIcon("landmark", "Environment Creator", () => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

            if (!activeView) {
                new Notice("Please open a note first.");
                return;
            }

            const mode = activeView.getMode();
            if (mode !== "source") {
                new Notice("Please switch to Edit mode to use the Environment Creator.");
                return;
            }

            this.openEnvironmentCreator();
        });


        // Environment Commands
        this.addCommand({
            id: "Environment-Creator",
            name: "Environment Creator",
            editorCallback: (editor: Editor) => {
                new EnvironmentModal(this, editor, (result) => {
                    this.insertEnvironment(editor, result);
                }).open();
            },
        });
    }

    // ======================
    // HELPER METHODS
    // ======================
    private openAdversaryCreator() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            new TextInputModal(this, activeView.editor).open();
        } else {
            new Notice("Please open a note first to create an adversary.");
        }
    }

    private openEnvironmentCreator() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            new EnvironmentModal(this, activeView.editor, (result) => {
                this.insertEnvironment(activeView.editor, result);
            }).open();
        } else {
            new Notice("Please open a note first to create an environment.");
        }
    }

    private insertEnvironment(editor: Editor, result: any) {
        const html = environmentToHTML(result);
        if (editor) {
            editor.replaceSelection(html);
        } else {
            new Notice("No active editor found. Create a new note first.");
        }
    }

    onunload() {
        // Clean up if needed
    }
}
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