import { MarkdownView, Notice, App } from "obsidian";
import type DaggerForgePlugin from "../main";
import { EnvironmentEditorModal } from ".";
import { extractCardData, TextInputModal } from "./adversaries/index";
import type { EnvironmentData, EnvSavedFeatureState } from "../types/index";

// Helper: Get the card instance ID from the card element
function getCardInstanceId(cardElement: HTMLElement): string {
	return cardElement.getAttribute('data-card-instance-id') || '';
}

// Helper: Find the correct card section in markdown by instance ID
function findCardInMarkdownById(fullContent: string, cardInstanceId: string): { startIndex: number; endIndex: number } {
	if (!cardInstanceId) {
		return { startIndex: -1, endIndex: -1 };
	}

	// Search for the section with matching data-card-instance-id
	const idPattern = new RegExp(`data-card-instance-id="${cardInstanceId}"`, 'i');
	const match = idPattern.exec(fullContent);

	if (!match) {
		return { startIndex: -1, endIndex: -1 };
	}

	// Find the opening <section tag that contains this attribute
	let sectionStartIndex = fullContent.lastIndexOf('<section', match.index);
	if (sectionStartIndex === -1) {
		return { startIndex: -1, endIndex: -1 };
	}

	// Find the closing </section> tag
	let openCount = 1;
	let searchIndex = sectionStartIndex + 8; // Skip past '<section'
	let sectionEndIndex = -1;

	while (openCount > 0 && searchIndex < fullContent.length) {
		const nextOpen = fullContent.indexOf('<section', searchIndex);
		const nextClose = fullContent.indexOf('</section>', searchIndex);

		if (nextClose === -1) break;

		if (nextOpen !== -1 && nextOpen < nextClose) {
			// Found nested opening tag before closing tag
			openCount++;
			searchIndex = nextOpen + 8;
		} else {
			// Closing tag comes next
			openCount--;
			if (openCount === 0) {
				sectionEndIndex = nextClose + 10;
			}
			searchIndex = nextClose + 10;
		}
	}

	return { startIndex: sectionStartIndex, endIndex: sectionEndIndex };
}

// Helper: Find environment card in markdown by instance ID
function findEnvCardInMarkdownById(fullContent: string, cardInstanceId: string): { startIndex: number; endIndex: number } {
	if (!cardInstanceId) {
		return { startIndex: -1, endIndex: -1 };
	}

	// Search for the section with matching data-card-instance-id
	const idPattern = new RegExp(`data-card-instance-id="${cardInstanceId}"`, 'i');
	const match = idPattern.exec(fullContent);

	if (!match) {
		return { startIndex: -1, endIndex: -1 };
	}

	// Find the opening <section tag that contains this attribute
	let sectionStartIndex = fullContent.lastIndexOf('<section', match.index);
	if (sectionStartIndex === -1) {
		return { startIndex: -1, endIndex: -1 };
	}

	// Find the closing </section> tag
	let openCount = 1;
	let searchIndex = sectionStartIndex + 8; // Skip past '<section'
	let sectionEndIndex = -1;

	while (openCount > 0 && searchIndex < fullContent.length) {
		const nextOpen = fullContent.indexOf('<section', searchIndex);
		const nextClose = fullContent.indexOf('</section>', searchIndex);

		if (nextClose === -1) break;

		if (nextOpen !== -1 && nextOpen < nextClose) {
			// Found nested opening tag before closing tag
			openCount++;
			searchIndex = nextOpen + 8;
		} else {
			// Closing tag comes next
			openCount--;
			if (openCount === 0) {
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
		
		// Get the unique instance ID of the card being edited
		const cardInstanceId = getCardInstanceId(cardElement);
		const { startIndex: sectionStartIndex, endIndex: sectionEndIndex } = findCardInMarkdownById(fullContent, cardInstanceId);
		
		if (sectionStartIndex === -1 || sectionEndIndex === -1) {
			new Notice("Could not find card in markdown.");
			return;
		}
		
		const modal = new TextInputModal(plugin, editor, cardElement, cardData);
		modal.onSubmit = async (newHTML: string, newData: any) => {
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
		
		// Get the unique instance ID of the card being edited
		const cardInstanceId = getCardInstanceId(cardElement);
		const { startIndex: sectionStartIndex, endIndex: sectionEndIndex } = findEnvCardInMarkdownById(fullContent, cardInstanceId);
		
		if (sectionStartIndex === -1 || sectionEndIndex === -1) {
			new Notice("Could not find environment card in markdown.");
			return;
		}
		
		const innerDiv = cardElement.querySelector('.df-env-card-inner');
		
		const tierTypeText = innerDiv?.querySelector('.df-env-feat-tier-type')?.textContent?.trim() || '';
		const tierMatch = tierTypeText.match(/Tier\s+(\d+)\s+([A-Za-z]+)/);
		const tier = tierMatch ? tierMatch[1] : '1';
		const type = tierMatch ? tierMatch[2] : 'Exploration';
		
		const name = innerDiv?.querySelector(".df-env-name")?.textContent?.trim() ?? "(unknown environment)";
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
		
		// Extract features from data attributes
		const featuresSection = innerDiv?.querySelector('.df-features-section');
		const features: EnvSavedFeatureState[] = Array.from(featuresSection?.querySelectorAll('.df-feature') || []).map((feat: any) => {
			const featName = feat.getAttribute('data-feature-name') || '';
			const featType = feat.getAttribute('data-feature-type') || 'Passive';
			const cost = feat.getAttribute('data-feature-cost') || undefined;
			const bullets = Array.from(feat.querySelectorAll('.df-env-bullet-item')).map((b: Element) => b.textContent?.trim() || '');
			
			const textDiv = feat.querySelector('.df-env-feat-text');
			const text = textDiv?.textContent?.trim() || '';
			
			const afterTextEl = feat.querySelector('#textafter');
			const textAfter = afterTextEl ? afterTextEl.textContent?.trim() : undefined;
			
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
			
			new Notice(`Updated environment: ${name}`);
			
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

export async function handleCardEditClick(evt: MouseEvent, app: App, plugin?: DaggerForgePlugin) {
	const target = evt.target as HTMLElement;
	if (!target) return;

	let cardType: "env" | "adv" | null = null;
	if (target.matches(".df-env-edit-button")) cardType = "env";
	else if (target.closest(".df-adv-edit-button")) cardType = "adv";

	if (!cardType) return;

	if (!plugin) {
		new Notice("Plugin instance not available for editing.");
		return;
	}

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
		
		const name = innerDiv?.querySelector(".df-env-name")?.textContent?.trim() ?? "(unknown environment)";
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
		
		// Extract features from data attributes
		const featuresSection = innerDiv?.querySelector('.df-features-section');
		const features: EnvSavedFeatureState[] = Array.from(featuresSection?.querySelectorAll('.df-feature') || []).map((feat: any) => {
			const featName = feat.getAttribute('data-feature-name') || '';
			const featType = feat.getAttribute('data-feature-type') || 'Passive';
			const cost = feat.getAttribute('data-feature-cost') || undefined;
			const bullets = Array.from(feat.querySelectorAll('.df-env-bullet-item')).map((b: Element) => b.textContent?.trim() || '');
			
			const textDiv = feat.querySelector('.df-env-feat-text');
			const text = textDiv?.textContent?.trim() || '';
			
			const afterTextEl = feat.querySelector('#textafter');
			const textAfter = afterTextEl ? afterTextEl.textContent?.trim() : undefined;
			
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
				
				new Notice(`Updated environment: ${name}`);
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
