import { MarkdownView, Notice, App } from "obsidian";
import type DaggerForgePlugin from "../main";
import { EnvironmentEditorModal } from ".";
import { extractCardData, TextInputModal } from "./adversaries/index";
import type { EnvironmentData, EnvSavedFeatureState } from "../types/index";

// Helper: Find which position this card is at in the DOM (for cards with duplicate names)
function findCardIndexInDOM(cardElement: HTMLElement, cardType: string): number {
	const selector = cardType === "env" ? ".df-env-card-outer" : ".df-card-outer";
	const allCards = Array.from(document.querySelectorAll(selector));
	return allCards.indexOf(cardElement);
}

// Helper: Find the correct card section in markdown by name and DOM position
function findCardInMarkdown(fullContent: string, cardName: string, domIndex: number, cardType: string): { startIndex: number; endIndex: number } {
	const cardNameEscaped = cardName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	
	// First, find all section opening tags that match the card type
	let sectionOpenings = [];
	const sectionTagPattern = cardType === "adv" 
		? /<section[^>]*class="[^"]*df-card-outer[^"]*"[^>]*>/gi
		: /<section[^>]*class="[^"]*df-env-card-outer[^"]*"[^>]*>/gi;
	
	let match;
	const sectionRegex = new RegExp(sectionTagPattern.source, sectionTagPattern.flags);
	while ((match = sectionRegex.exec(fullContent)) !== null) {
		sectionOpenings.push(match.index);
	}
	
	if (sectionOpenings.length === 0) {
		return { startIndex: -1, endIndex: -1 };
	}
	
	// Now find which sections contain the card name
	let namePattern: RegExp;
	if (cardType === "adv") {
		namePattern = new RegExp(`<h2[^>]*>${cardNameEscaped}<\\/h2>`, 'i');
	} else {
		namePattern = new RegExp(`<[^>]*class="[^"]*df-env-name[^"]*"[^>]*>${cardNameEscaped}<\\/[^>]*>`, 'i');
	}
	
	let matchingSections = [];
	for (let i = 0; i < sectionOpenings.length; i++) {
		const sectionStart = sectionOpenings[i];
		const nextSectionStart = i + 1 < sectionOpenings.length ? sectionOpenings[i + 1] : fullContent.length;
		
		// Search for the card name within this section
		const sectionContent = fullContent.substring(sectionStart, nextSectionStart);
		if (namePattern.test(sectionContent)) {
			matchingSections.push(sectionStart);
		}
	}
	
	if (matchingSections.length === 0) {
		return { startIndex: -1, endIndex: -1 };
	}
	
	// Pick the correct section based on DOM index
	const targetSectionIndex = Math.min(domIndex, matchingSections.length - 1);
	const sectionStartIndex = matchingSections[targetSectionIndex];
	
	// Now find the closing </section> tag for this specific section
	let closeCount = 1;
	let searchIndex = sectionStartIndex + 8; // Skip past '<section'
	let sectionEndIndex = -1;
	
	while (closeCount > 0 && searchIndex < fullContent.length) {
		const nextOpen = fullContent.indexOf('<section', searchIndex);
		const nextClose = fullContent.indexOf('</section>', searchIndex);
		
		if (nextClose === -1) break;
		
		if (nextOpen !== -1 && nextOpen < nextClose) {
			// Found opening tag before closing tag
			closeCount++;
			searchIndex = nextOpen + 8;
		} else {
			// Closing tag comes next
			closeCount--;
			if (closeCount === 0) {
				sectionEndIndex = nextClose + 10;
			}
			searchIndex = nextClose + 10;
		}
	}
	
	return { startIndex: sectionStartIndex, endIndex: sectionEndIndex };
}

export const onEditClick = (
	evt: Event,
	cardType: string,
	plugin: DaggerForgePlugin
) => {
	evt.stopPropagation();

	const button = evt.target as HTMLElement;
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

	let cardName = "";
	if (cardType === "env") {
		const nameEl = cardElement.querySelector(".df-env-name");
		cardName = nameEl?.textContent?.trim() ?? "(unknown environment)";
	} else if (cardType === "adv") {
		const nameEl = cardElement.querySelector("h2");
		cardName = nameEl?.textContent?.trim() ?? "(unknown adversary)";
	}

	if (cardType === "adv") {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Please open a markdown note first.");
			return;
		}

		const editor = view.editor;
		const cardData = extractCardData(cardElement);
		const fullContent = editor.getValue();
		
		// FIX: Use helper function to get DOM index and markdown position
		const domIndex = findCardIndexInDOM(cardElement, "adv");
		const { startIndex: sectionStartIndex, endIndex: sectionEndIndex } = findCardInMarkdown(fullContent, cardName, domIndex, "adv");
		
		if (sectionStartIndex === -1 || sectionEndIndex === -1) {
			new Notice("Could not find card in markdown.");
			return;
		}
		
		const oldHTML = fullContent.substring(sectionStartIndex, sectionEndIndex);
		
		const modal = new TextInputModal(plugin, editor, cardElement, cardData);
		modal.onSubmit = async (newHTML: string, newData: any) => {
			const content = editor.getValue();
			// Use the new HTML as-is, don't add extra sections
			const finalHTML = newHTML;
			
			const beforeCard = content.substring(0, sectionStartIndex);
			const afterCard = content.substring(sectionEndIndex);
			const newContent = beforeCard + finalHTML + afterCard;
			
			editor.setValue(newContent);
			
			const file = view.file;
			if (file) {
				await plugin.app.vault.modify(file, newContent);
			}
			
			try {
				await plugin.dataManager.addAdversary(newData);
				new Notice(`Updated adversary: ${cardName}`);
			} catch (error) {
				console.error("Error saving adversary:", error);
				new Notice("Error saving adversary. Check console for details.");
			}
			
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
		
		// FIX: Use helper function to get DOM index and markdown position
		const domIndex = findCardIndexInDOM(cardElement, "env");
		const { startIndex: sectionStartIndex, endIndex: sectionEndIndex } = findCardInMarkdown(fullContent, cardName, domIndex, "env");
		
		if (sectionStartIndex === -1 || sectionEndIndex === -1) {
			new Notice("Could not find environment card in markdown.");
			return;
		}
		
		const oldHTML = fullContent.substring(sectionStartIndex, sectionEndIndex);
		
		const innerDiv = cardElement.querySelector('.df-env-card-inner');
		
		const tierTypeText = innerDiv?.querySelector('.df-env-feat-tier-type')?.textContent?.trim() || '';
		const tierMatch = tierTypeText.match(/Tier\s+(\d+)\s+([A-Za-z]+)/);
		const tier = tierMatch ? tierMatch[1] : '1';
		const type = tierMatch ? tierMatch[2] : 'Exploration';
		
		const name = cardName;
		const desc = innerDiv?.querySelector('.df-env-desc')?.textContent?.trim() || '';
		
		const impulseEl = Array.from(innerDiv?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Impulse:')
		);
		const impulse = impulseEl ? impulseEl.textContent?.replace('Impulse:', '').trim() : '';
		
		const diffPotEl = innerDiv?.querySelector('.df-env-card-diff-pot');
		const diffEl = Array.from(diffPotEl?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Difficulty')
		);
		const advEl = Array.from(diffPotEl?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Potential Adversaries')
		);
		
		const difficulty = diffEl ? diffEl.textContent?.split(':')[1]?.trim() : '';
		const potentialAdversaries = advEl ? advEl.textContent?.split(':')[1]?.trim() : '';
		
		// SIMPLE FEATURE EXTRACTION FROM DATA ATTRIBUTES
		const featuresSection = innerDiv?.querySelector('.df-features-section');
		const features: EnvSavedFeatureState[] = Array.from(featuresSection?.querySelectorAll('.df-feature') || []).map((feat: any) => {
			// Get from data attributes
			const featName = feat.getAttribute('data-feature-name') || '';
			const featType = feat.getAttribute('data-feature-type') || 'Passive';
			const cost = feat.getAttribute('data-feature-cost') || undefined;
			// Get bullets
			const bullets = Array.from(feat.querySelectorAll('.df-env-bullet-item')).map((b: Element) => b.textContent?.trim() || '');
			
			// Get text
			const textDiv = feat.querySelector('.df-env-feat-text');
			const text = textDiv?.textContent?.trim() || '';
			
			// Get text after
			const afterTextEl = feat.querySelector('#textafter');
			const textAfter = afterTextEl ? afterTextEl.textContent?.trim() : undefined;
			
			// Get questions
			const questionsDiv = feat.querySelector('.df-env-questions');
			const questions = questionsDiv ? 
				Array.from(questionsDiv.querySelectorAll('.df-env-question')).map((q: Element) => q.textContent?.trim() || '').filter(q => q) :
				[];
			
			return {
				name: featName,
				type: featType,
				cost: cost && cost !== '' ? cost : undefined,
				text,
				bullets: bullets.filter(b => b),
				textAfter,
				questions,
			};
		});
		
		const envData: EnvironmentData = {
			id: "",
			name,
			tier: parseInt(tier),
			type,
			desc,
			impulse,
			difficulty,
			potentialAdversaries,
			source: 'custom',
			features,
		};
		
		const modal = new EnvironmentEditorModal(plugin, editor, cardElement, envData);
		modal.onSubmit = async (newHTML: string) => {
			const content = editor.getValue();
			const finalHTML = newHTML;
			
			const beforeCard = content.substring(0, sectionStartIndex);
			const afterCard = content.substring(sectionEndIndex);
			const newContent = beforeCard + finalHTML + afterCard;
			
			editor.setValue(newContent);
			
			const file = view.file;
			if (file) {
				await plugin.app.vault.modify(file, newContent);
			}
			
			new Notice(`Updated environment: ${cardName}`);
			
			const envView = plugin.app.workspace
				.getLeavesOfType("environment-view")
				.map((l) => l.view)
				.find((v) => typeof (v as any).refresh === "function") as any;

			if (envView) {
				await envView.refresh();
			}
		};
		modal.open();
	}
};

export async function handleCardClick(evt: MouseEvent, app: App, plugin?: DaggerForgePlugin) {
	const target = evt.target as HTMLElement;
	if (!target) return;
	
	if (!plugin) {
		new Notice("Plugin instance not available for editing.");
		return;
	}

	let cardType: "env" | "adv" | null = null;
	if (target.matches(".df-env-edit-button")) cardType = "env";
	else if (target.closest(".df-adv-edit-button")) cardType = "adv";

	if (!cardType) return;

	// Check if we're on a canvas
	const activeLeaf = app.workspace.activeLeaf;
	const isCanvas = activeLeaf?.view?.getViewType?.() === "canvas";

	if (isCanvas) {
		// Handle canvas card editing
		handleCanvasCardEdit(evt, cardType, plugin);
		return;
	}

	// Handle markdown card editing
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return;

	const isEditMode = view.getMode() === "source";

	if (isEditMode) {
		onEditClick(evt, cardType, plugin);
	} else {
		const state = view.leaf.view.getState();
		state.mode = 'source';
		await view.leaf.setViewState({
			type: 'markdown',
			state: state
		});
		onEditClick(evt, cardType, plugin);
	}
}

async function handleCanvasCardEdit(
	evt: Event,
	cardType: string,
	plugin: DaggerForgePlugin
) {
	evt.stopPropagation();

	const button = evt.target as HTMLElement;
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

	let cardName = "";
	if (cardType === "env") {
		const nameEl = cardElement.querySelector(".df-env-name");
		cardName = nameEl?.textContent?.trim() ?? "(unknown environment)";
	} else if (cardType === "adv") {
		const nameEl = cardElement.querySelector("h2");
		cardName = nameEl?.textContent?.trim() ?? "(unknown adversary)";
	}

	if (cardType === "adv") {
		const cardData = extractCardData(cardElement);
		const modal = new TextInputModal(plugin, null as any, cardElement, cardData);
		modal.onSubmit = async (newHTML: string, newData: any) => {
			try {
				// Parse the new HTML to extract inner content
				const parser = new DOMParser();
				const doc = parser.parseFromString(newHTML, 'text/html');
				
				// Find the inner div in the new HTML
				const newInner = doc.querySelector('.df-card-inner');
				
				if (newInner && cardElement) {
					// Find the existing inner div and replace only its content
					const existingInner = cardElement.querySelector('.df-card-inner');
					if (existingInner) {
						// Clone the new content safely
						const clonedContent = newInner.cloneNode(true) as HTMLElement;
						
						// Clear existing content safely
						while (existingInner.firstChild) {
							existingInner.removeChild(existingInner.firstChild);
						}
						
						// Append cloned nodes
						while (clonedContent.firstChild) {
							existingInner.appendChild(clonedContent.firstChild);
						}
						
						// Force canvas to re-render by triggering a small style update
						cardElement.classList.add('df-canvas-force-rerender');
						requestAnimationFrame(() => {
						if (cardElement) {
						cardElement.classList.remove('df-canvas-force-rerender');
						 cardElement.classList.add('df-canvas-normal-opacity');
						 }
								});
					}
				}
				
				// Save to data manager
				await plugin.dataManager.addAdversary(newData);
				new Notice(`Updated adversary: ${cardName}`);
			} catch (error) {
				console.error("Error updating adversary:", error);
				new Notice("Error updating adversary. Check console for details.");
			}
			
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
		const innerDiv = cardElement.querySelector('.df-env-card-inner');
		
		const tierTypeText = innerDiv?.querySelector('.df-env-feat-tier-type')?.textContent?.trim() || '';
		const tierMatch = tierTypeText.match(/Tier\s+(\d+)\s+([A-Za-z]+)/);
		const tier = tierMatch ? tierMatch[1] : '1';
		const type = tierMatch ? tierMatch[2] : 'Exploration';
		
		const name = cardName;
		const desc = innerDiv?.querySelector('.df-env-desc')?.textContent?.trim() || '';
		
		const impulseEl = Array.from(innerDiv?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Impulse:')
		);
		const impulse = impulseEl ? impulseEl.textContent?.replace('Impulse:', '').trim() : '';
		
		const diffPotEl = innerDiv?.querySelector('.df-env-card-diff-pot');
		const diffEl = Array.from(diffPotEl?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Difficulty')
		);
		const advEl = Array.from(diffPotEl?.querySelectorAll('p') || []).find(p => 
			p.textContent?.includes('Potential Adversaries')
		);
		
		const difficulty = diffEl ? diffEl.textContent?.split(':')[1]?.trim() : '';
		const potentialAdversaries = advEl ? advEl.textContent?.split(':')[1]?.trim() : '';
		
		// SIMPLE FEATURE EXTRACTION FROM DATA ATTRIBUTES
		const featuresSection = innerDiv?.querySelector('.df-features-section');
		const features: EnvSavedFeatureState[] = Array.from(featuresSection?.querySelectorAll('.df-feature') || []).map((feat: any) => {
			// Get from data attributes
			const featName = feat.getAttribute('data-feature-name') || '';
			const featType = feat.getAttribute('data-feature-type') || 'Passive';
			const cost = feat.getAttribute('data-feature-cost') || undefined;
			// Get bullets
			const bullets = Array.from(feat.querySelectorAll('.df-env-bullet-item')).map((b: Element) => b.textContent?.trim() || '');
			
			// Get text
			const textDiv = feat.querySelector('.df-env-feat-text');
			const text = textDiv?.textContent?.trim() || '';
			
			// Get text after
			const afterTextEl = feat.querySelector('#textafter');
			const textAfter = afterTextEl ? afterTextEl.textContent?.trim() : undefined;
			
			// Get questions
			const questionsDiv = feat.querySelector('.df-env-questions');
			const questions = questionsDiv ? 
				Array.from(questionsDiv.querySelectorAll('.df-env-question')).map((q: Element) => q.textContent?.trim() || '').filter(q => q) :
				[];
			
			return {
				name: featName,
				type: featType,
				cost: cost && cost !== '' ? cost : undefined,
				text,
				bullets: bullets.filter(b => b),
				textAfter,
				questions,
			};
		});
		
		const envData: EnvironmentData = {
			id: "",
			name,
			tier: parseInt(tier),
			type,
			desc,
			impulse,
			difficulty,
			potentialAdversaries,
			source: 'custom',
			features,
		};
		
		const modal = new EnvironmentEditorModal(plugin, null as any, cardElement, envData);
		modal.onSubmit = async (newHTML: string) => {
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(newHTML, 'text/html');
				const innerContent = doc.querySelector('.df-env-card-inner');
				
				if (innerContent) {
					const existingInner = cardElement!.querySelector('.df-env-card-inner');
					if (existingInner) {
						// Clone the new content safely
						const clonedContent = innerContent.cloneNode(true) as HTMLElement;
						
						// Clear existing content safely
						while (existingInner.firstChild) {
							existingInner.removeChild(existingInner.firstChild);
						}
						
						// Append cloned nodes
						while (clonedContent.firstChild) {
							existingInner.appendChild(clonedContent.firstChild);
						}
						
						// Force canvas to re-render
						cardElement!.classList.add('df-canvas-force-rerender');
						requestAnimationFrame(() => {
						if (cardElement) {
						cardElement.classList.remove('df-canvas-force-rerender');
						 cardElement.classList.add('df-canvas-normal-opacity');
						 }
										});
					}
				} else {
					// Fallback: use DOMParser for safe HTML parsing
					const tempParser = new DOMParser();
					const tempDoc = tempParser.parseFromString(newHTML, 'text/html');
					
					// Clear and replace entire card safely
					while (cardElement!.firstChild) {
						cardElement!.removeChild(cardElement!.firstChild);
					}
					
					// Clone and append all parsed content
					Array.from(tempDoc.body.childNodes).forEach(node => {
						const clonedNode = node.cloneNode(true);
						cardElement!.appendChild(clonedNode);
					});
				}
				
				new Notice(`Updated environment: ${cardName}`);
			} catch (error) {
				console.error("Error updating environment:", error);
				new Notice("Error updating environment. Check console for details.");
			}
			
			const envView = plugin.app.workspace
				.getLeavesOfType("environment-view")
				.map((l) => l.view)
				.find((v) => typeof (v as any).refresh === "function") as any;

			if (envView) {
				await envView.refresh();
			}
		};
		modal.open();
	}
}
