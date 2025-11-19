import { MarkdownView, Notice, App } from "obsidian";
import type DaggerForgePlugin from "../main";
import { extractCardData } from "../features/adversaries/editor/CardDataHelpers";
import { TextInputModal } from "../features/adversaries/creator/TextInputModal";
import { EnvironmentModal } from "../features/environments/creator/EnvModal";
import { environmentToHTML } from "../features/environments/components/EnvToHTML";

export const onEditClick = (
	evt: Event,
	cardType: string,
	plugin: DaggerForgePlugin
) => {
	evt.stopPropagation();

	// Get the button that was clicked
	const button = evt.target as HTMLElement;

	// Find the outer card element depending on the type
	let cardElement: HTMLElement | null = null;

	if (cardType === "env") {
		cardElement = button.closest(".df-env-card-outer");
	} else if (cardType === "adv") {
		cardElement = button.closest(".df-card-outer");
	}

	if (!cardElement) {
		new Notice("Could not find card element!");
		return;
	}

	// Now grab the name depending on the type
	let cardName = "";
	if (cardType === "env") {
		const nameEl = cardElement.querySelector(".df-env-name");
		cardName = nameEl?.textContent?.trim() ?? "(unknown environment)";
	} else if (cardType === "adv") {
		const nameEl = cardElement.querySelector("h2");
		cardName = nameEl?.textContent?.trim() ?? "(unknown adversary)";
	}

	// Handle editing based on card type
	if (cardType === "adv") {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Please open a markdown note first.");
			return;
		}

		const editor = view.editor;
		const cardData = extractCardData(cardElement);
		
		// Get the full content
		const fullContent = editor.getValue();
		
		// Use the card name to find the card in the markdown
		const cardNameEscaped = cardName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const h2Pattern = new RegExp(`<h2[^>]*>${cardNameEscaped}</h2>`, 'i');
		
		const h2Match = fullContent.match(h2Pattern);
		if (!h2Match) {
			new Notice("Could not find card name in markdown.");
			return;
		}
		
		const h2Index = fullContent.indexOf(h2Match[0]);
		
		// Find the start of the section by looking backwards for <section
		let sectionStartIndex = h2Index;
		const beforeContent = fullContent.substring(0, h2Index);
		const lastSectionStart = beforeContent.lastIndexOf('<section');
		
		if (lastSectionStart !== -1) {
			sectionStartIndex = lastSectionStart;
		}
		
		// Find the end of the section by looking forward for </section>
		const afterContent = fullContent.substring(h2Index);
		const sectionEndMatch = afterContent.match(/<\/section>/);
		let sectionEndIndex = h2Index + afterContent.indexOf('</section>');
		
		if (sectionEndMatch && sectionEndIndex !== -1) {
			sectionEndIndex += 10; // length of </section>
		} else {
			// If no section tag found, fall back to finding the card div
			const cardDivPattern = /<div[^>]*class="[^"]*df-card-outer[^"]*"[^>]*>/i;
			const beforeH2 = fullContent.substring(Math.max(0, h2Index - 500), h2Index);
			const divMatch = beforeH2.match(cardDivPattern);
			if (divMatch) {
				sectionStartIndex = h2Index - beforeH2.length + beforeH2.lastIndexOf(divMatch[0]);
			}
			sectionEndIndex = fullContent.indexOf('</div>', h2Index) + 6;
		}
		
		if (sectionStartIndex === -1 || sectionEndIndex === -1) {
			new Notice("Could not find complete card structure in markdown.");
			return;
		}
		
		const oldHTML = fullContent.substring(sectionStartIndex, sectionEndIndex);
		
		// Open the adversary editor modal with the card data
		const modal = new TextInputModal(plugin, editor, cardElement, cardData);
		modal.onSubmit = async (newHTML: string, newData: any) => {
			// Get fresh content
			const content = editor.getValue();
			
			// Wrap new HTML in section tags if the old one had them
			let finalHTML = newHTML;
			if (oldHTML.includes('<section')) {
				finalHTML = `<section>\n${newHTML}\n</section>`;
			}
			
			// Find and replace the old card with new card
			const beforeCard = content.substring(0, sectionStartIndex);
			const afterCard = content.substring(sectionEndIndex);
			const newContent = beforeCard + finalHTML + afterCard;
			
			// Set the new content
			editor.setValue(newContent);
			
			// Save the file
			const file = view.file;
			if (file) {
				await plugin.app.vault.modify(file, newContent);
			}
			
			// Save as custom adversary to DataManager (same as creation)
			try {
				await plugin.dataManager.addAdversary(newData);
				new Notice(`Updated adversary: ${cardName}`);
			} catch (error) {
				console.error("Error saving adversary:", error);
				new Notice("Error saving adversary. Check console for details.");
			}
			
			// Refresh AdversaryView if open
			const advView = plugin.app.workspace
				.getLeavesOfType("adversary-view")
				.map((l) => l.view)
				.find((v) => typeof (v as any).refresh === "function") as any;

			if (advView) {
				await advView.refresh();
			}
		};
		modal.open();
	} else if (cardType === "env") {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Please open a markdown note first.");
			return;
		}

		const editor = view.editor;
		const fullContent = editor.getValue();
		
		// For environments, find the section tag that contains this environment card
		const sectionPattern = /<section[^>]*class="[^"]*df-env-card-outer[^"]*"[^>]*>/i;
		const sectionMatch = fullContent.match(sectionPattern);
		
		if (!sectionMatch) {
			new Notice("Could not find environment section in markdown.");
			return;
		}
		
		// Find the index of this section tag
		const sectionStartIndex = fullContent.indexOf(sectionMatch[0]);
		
		// Find the corresponding closing </section> tag
		let closeCount = 1;
		let searchIndex = sectionStartIndex + sectionMatch[0].length;
		let sectionEndIndex = -1;
		
		while (closeCount > 0 && searchIndex < fullContent.length) {
			const nextOpen = fullContent.indexOf('<section', searchIndex);
			const nextClose = fullContent.indexOf('</section>', searchIndex);
			
			if (nextClose === -1) break;
			
			if (nextOpen !== -1 && nextOpen < nextClose) {
				closeCount++;
				searchIndex = nextOpen + 1;
			} else {
				closeCount--;
				if (closeCount === 0) {
					sectionEndIndex = nextClose + 10; // length of </section>
				}
				searchIndex = nextClose + 1;
			}
		}
		
		if (sectionStartIndex === -1 || sectionEndIndex === -1) {
			new Notice("Could not find complete environment structure in markdown.");
			return;
		}
		
		const oldHTML = fullContent.substring(sectionStartIndex, sectionEndIndex);
		
		// Extract environment data from the card element by parsing the rendered HTML
		// Get all text content and parse it
		const innerDiv = cardElement.querySelector('.df-env-card-inner');
		
		// Extract tier and type from "Tier X Type"
		const tierTypeText = innerDiv?.querySelector('.df-env-feat-tier-type')?.textContent?.trim() || '';
		const tierMatch = tierTypeText.match(/Tier\s+(\d+)\s+(.*)/);
		const tier = tierMatch ? tierMatch[1] : '1';
		const type = tierMatch ? tierMatch[2] : 'Exploration';
		
		// Extract description
		const desc = innerDiv?.querySelector('.df-env-desc')?.textContent?.trim() || '';
		
		// Extract impulse (after "Impulse:" text)
		const impulseEl = Array.from(innerDiv?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Impulse:')
		);
		const impulse = impulseEl ? impulseEl.textContent?.replace('Impulse:', '').trim() : '';
		
		// Extract difficulty and potential adversaries
		const diffPotEl = innerDiv?.querySelector('.df-env-card-diff-pot');
		const diffEl = Array.from(diffPotEl?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Difficulty')
		);
		const advEl = Array.from(diffPotEl?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Potential Adversaries')
		);
		
		const difficulty = diffEl ? diffEl.textContent?.split(':')[1]?.trim() : '';
		const potentialAdversaries = advEl ? advEl.textContent?.split(':')[1]?.trim() : '';
		
		// Extract features
		const featuresSection = innerDiv?.querySelector('.df-features-section');
		const features = Array.from(featuresSection?.querySelectorAll('.df-feature') || []).map((feat: any) => {
			const name = feat.getAttribute('data-feature-name') || '';
			const featType = feat.getAttribute('data-feature-type') || 'Passive';
			const cost = feat.getAttribute('data-feature-cost') || undefined;
			
			// Get the text content
			const textEl = feat.querySelector('.df-env-feat-text');
			const text = textEl?.textContent?.trim() || '';
			
			// Get questions
			const questionsDiv = feat.querySelector('.df-env-questions');
			const questions = questionsDiv ? 
				Array.from(questionsDiv.querySelectorAll('.df-env-question')).map((q: Element) => q.textContent?.trim() || '') :
				[];
			
			return {
				name,
				type: featType,
				cost: cost || undefined,
				text,
				bullets: [],
				questions: questions.filter(q => q),
			};
		});
		
		const envData: any = {
			name: cardName,
			tier: parseInt(tier),
			type,
			desc,
			impulse,
			difficulty,
			potentialAdversaries,
			source: 'custom',
			features,
		};
		
		// Open the environment editor modal
		const modal = new EnvironmentModal(plugin, editor, async (newEnvData) => {
			// Generate new HTML
			const newHTML = environmentToHTML(newEnvData);
			const finalHTML = `<section class="df-env-card-outer">\n${newHTML}\n</section>`;
			
			// Get fresh content
			const content = editor.getValue();
			
			// Find and replace
			const beforeCard = content.substring(0, sectionStartIndex);
			const afterCard = content.substring(sectionEndIndex);
			const newContent = beforeCard + finalHTML + afterCard;
			
			// Update editor
			editor.setValue(newContent);
			
			// Save the file
			const file = view.file;
			if (file) {
				await plugin.app.vault.modify(file, newContent);
			}
			
			// Save as custom environment
			try {
				await plugin.dataManager.addEnvironment(newEnvData);
				new Notice(`Updated environment: ${cardName}`);
			} catch (error) {
				console.error("Error saving environment:", error);
				new Notice("Error saving environment. Check console for details.");
			}
			
			// Refresh EnvironmentView if open
			const envView = plugin.app.workspace
				.getLeavesOfType("environment-view")
				.map((l) => l.view)
				.find((v) => typeof (v as any).refresh === "function") as any;

			if (envView) {
				await envView.refresh();
			}
		});
		
		// Pre-populate the modal with environment data
		plugin.savedInputStateEnv = envData;
		modal.open();
	}
};

export async function handleCardEditClick(evt: MouseEvent, app: App, plugin?: DaggerForgePlugin) {
	const target = evt.target as HTMLElement;
	if (!target) return;

	let cardType: "env" | "adv" | null = null;
	if (target.matches(".df-env-edit-button")) cardType = "env";
	else if (target.closest(".df-adv-edit-button")) cardType = "adv";

	if (!cardType) return;

	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return;

	const isEditMode = view.getMode() === "source";

	if (isEditMode) {
		if (plugin) {
			onEditClick(evt, cardType, plugin);
		} else {
			new Notice("Plugin instance not available for editing.");
		}
	} else {
		const state = view.leaf.view.getState();
		state.mode = 'source';
		await view.leaf.setViewState({
			type: 'markdown',
			state: state
		});
		if (plugin) {
			onEditClick(evt, cardType, plugin);
		} else {
			new Notice("Plugin instance not available for editing.");
		}
	}
}
