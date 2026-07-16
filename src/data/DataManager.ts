import { Events, Notice, Plugin } from 'obsidian';
import { AdvData, CharacterData, EnvironmentData, GearData, PluginSettings, DEFAULT_SETTINGS, normalizeCharacter } from '../types/index';
import { generateEnvUniqueId, generateAdvUniqueId, generateCharacterUniqueId, generateItemUniqueId } from '../utils/index';

export interface StoredCustomData {
	adversaries: AdvData[];
	environments: EnvironmentData[];
	characters: CharacterData[];
	items: GearData[];
	settings: PluginSettings;
	lastUpdated: number;
}

export class DataManager {
	/**
	 * Change notifications so every mounted embed (character sheets, adversary
	 * and environment cards) stays in sync. Events:
	 *   "character-changed" (character, origin) / "character-deleted" (id)
	 *   "adversary-changed" (adversary) / "adversary-deleted" (id)
	 *   "environment-changed" (environment) / "environment-deleted" (id)
	 *   "characters-reloaded" (), "data-reloaded" () — bulk import/reset.
	 * `origin` is an opaque token a character sheet passes with its own saves
	 * so it can ignore its own echo.
	 */
	readonly events = new Events();

	private plugin: Plugin;
	private data: StoredCustomData = {
		adversaries: [],
		environments: [],
		characters: [],
		items: [],
		settings: DEFAULT_SETTINGS,
		lastUpdated: Date.now()
	};

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		try {
			const saved = await this.plugin.loadData();
			if (!saved) {
				new Notice('No data.json found');
				return;
			}

			this.data = {
				adversaries: this.migrateAdversaries(saved.adversaries || []),
				environments: this.migrateEnvironments(saved.environments || []),
				characters: this.migrateCharacters(saved.characters || []),
				items: saved.items || [],
				settings: this.mergeSettings(saved.settings),
				lastUpdated: saved.lastUpdated || Date.now()
			};

			this.ensureAdversariesHaveIds();
			this.ensureEnvironmentsHaveIds();
			await this.save();
		} catch (err) {
			console.error('DataManager: Error loading data', err);
		}
	}

	private mergeSettings(saved: Partial<PluginSettings> | undefined): PluginSettings {
		if (!saved) return { ...DEFAULT_SETTINGS };
		return { ...DEFAULT_SETTINGS, ...saved };
	}

	// Convert old environment feature shape (text/bullets/textAfter) → richContent
	private migrateEnvironments(envs: any[]): EnvironmentData[] {
		return envs.map((env: any) => ({
			...env,
			features: (env.features ?? []).map((f: any) => {
				if (f.richContent !== undefined && f.richContent !== null) return f;
				const parts: string[] = [];
				if (f.text) parts.push(`<p>${f.text}</p>`);
				if (Array.isArray(f.bullets) && f.bullets.length) {
					parts.push(`<ul>${(f.bullets as string[]).map(b => `<li>${b}</li>`).join("")}</ul>`);
				}
				if (f.textAfter) parts.push(`<p>${f.textAfter}</p>`);
				return { name: f.name ?? "", type: f.type ?? "Passive", cost: f.cost ?? undefined, richContent: parts.join(""), questions: f.questions ?? [] };
			}),
		}));
	}

	// Convert old adversary feature shape (desc) → richContent
	private migrateAdversaries(advs: any[]): AdvData[] {
		return advs.map((adv: any) => ({
			...adv,
			features: (adv.features ?? []).map((f: any) => {
				if (f.richContent !== undefined && f.richContent !== null) return f;
				return { name: f.name ?? "", type: f.type ?? "Passive", cost: f.cost ?? "", richContent: f.desc ? `<p>${f.desc}</p>` : "" };
			}),
		}));
	}

	private async save(): Promise<void> {
		this.data.lastUpdated = Date.now();
		await this.plugin.saveData(this.data);
	}

	getSettings(): PluginSettings {
		return this.data.settings;
	}

	async updateSettings(settings: PluginSettings): Promise<void> {
		this.data.settings = settings;
		await this.save();
	}

	// ==================== ADVERSARIES ====================

	async addAdversary(adversary: AdvData): Promise<void> {
		if (!(adversary).id) {
			(adversary).id = generateAdvUniqueId();
		}
		this.data.adversaries.push(adversary);
		this.events.trigger("adversary-changed", adversary);
		await this.save();
	}

	/** Adds the adversary, or replaces the stored one with the same id. */
	async upsertAdversary(adversary: AdvData): Promise<void> {
		if (!adversary.id) adversary.id = generateAdvUniqueId();
		const index = this.data.adversaries.findIndex(a => a.id === adversary.id);
		if (index === -1) this.data.adversaries.push(adversary);
		else this.data.adversaries[index] = adversary;
		// Trigger before the disk write so mounted embeds update instantly
		this.events.trigger("adversary-changed", adversary);
		await this.save();
	}

	getAdversaries(): AdvData[] {
		return this.data.adversaries;
	}

	async deleteAdversaryById(id: string): Promise<void> {
		const index = this.data.adversaries.findIndex(a => (a).id === id);
		if (index === -1) throw new Error(`Adversary with ID ${id} not found`);
		this.data.adversaries.splice(index, 1);
		this.events.trigger("adversary-deleted", id);
		await this.save();
	}

	// ==================== ENVIRONMENTS ====================

	async addEnvironment(env: EnvironmentData): Promise<void> {
		if (!(env as any).id) {
			(env as any).id = generateEnvUniqueId();
		}
		this.data.environments.push(env);
		this.events.trigger("environment-changed", env);
		await this.save();
	}

	/** Adds the environment, or replaces the stored one with the same id. */
	async upsertEnvironment(env: EnvironmentData): Promise<void> {
		if (!env.id) env.id = generateEnvUniqueId();
		const index = this.data.environments.findIndex(e => e.id === env.id);
		if (index === -1) this.data.environments.push(env);
		else this.data.environments[index] = env;
		this.events.trigger("environment-changed", env);
		await this.save();
	}

	getEnvironments(): EnvironmentData[] {
		return this.data.environments;
	}

	async deleteEnvironmentById(id: string): Promise<void> {
		const index = this.data.environments.findIndex(e => (e as any).id === id);
		if (index === -1) throw new Error(`Environment with ID ${id} not found`);
		this.data.environments.splice(index, 1);
		this.events.trigger("environment-deleted", id);
		await this.save();
	}

	// ==================== CUSTOM ITEMS ====================

	getItems(): GearData[] {
		return this.data.items;
	}

	/** Adds the item, or replaces the stored one with the same id. */
	async upsertItem(item: GearData): Promise<void> {
		if (!item.id) item.id = generateItemUniqueId();
		item.source = "custom";
		const index = this.data.items.findIndex(i => i.id === item.id);
		if (index === -1) this.data.items.push(item);
		else this.data.items[index] = item;
		this.events.trigger("item-changed", item);
		await this.save();
	}

	async deleteItemById(id: string): Promise<void> {
		const index = this.data.items.findIndex(i => i.id === id);
		if (index === -1) throw new Error(`Item with ID ${id} not found`);
		this.data.items.splice(index, 1);
		this.events.trigger("item-deleted", id);
		await this.save();
	}

	// ==================== CHARACTERS ====================

	// Coerce stored characters through the normalizer so older saves pick up
	// any newly added sheet fields with safe defaults.
	private migrateCharacters(characters: unknown[]): CharacterData[] {
		return characters.map(c => normalizeCharacter(c, generateCharacterUniqueId()));
	}

	getCharacters(): CharacterData[] {
		return this.data.characters;
	}

	/** Adds the character, or replaces the stored one with the same id. */
	async upsertCharacter(character: CharacterData, origin?: unknown): Promise<void> {
		const index = this.data.characters.findIndex(c => c.id === character.id);
		if (index === -1) this.data.characters.push(character);
		else this.data.characters[index] = character;
		// Trigger before the disk write so other mounted sheets update instantly
		this.events.trigger("character-changed", character, origin);
		await this.save();
	}

	async deleteCharacterById(id: string): Promise<void> {
		const index = this.data.characters.findIndex(c => c.id === id);
		if (index === -1) throw new Error(`Character with ID ${id} not found`);
		this.data.characters.splice(index, 1);
		this.events.trigger("character-deleted", id);
		await this.save();
	}

	// ==================== UTILITIES ====================

	private ensureAdversariesHaveIds(): void {
		this.data.adversaries = this.data.adversaries.map(adv => ({
			...adv,
			id: (adv as any).id || generateAdvUniqueId()
		}));
	}

	private ensureEnvironmentsHaveIds(): void {
		this.data.environments = this.data.environments.map(env => ({
			...env,
			id: (env as any).id || generateEnvUniqueId()
		}));
	}

	async importData(jsonString: string): Promise<void> {
		const imported = JSON.parse(jsonString);
		this.data.adversaries.push(...(imported.adversaries ?? []));
		this.data.environments.push(...(imported.environments ?? []));
		this.data.characters.push(...this.migrateCharacters(imported.characters ?? []));
		this.ensureAdversariesHaveIds();
		this.ensureEnvironmentsHaveIds();
		this.events.trigger("characters-reloaded");
		this.events.trigger("data-reloaded");
		await this.save();
	}

	async deleteDataFile(): Promise<void> {
		try {
			this.data = { adversaries: [], environments: [], characters: [], items: [], settings: DEFAULT_SETTINGS, lastUpdated: Date.now() };
			this.events.trigger("characters-reloaded");
			this.events.trigger("data-reloaded");
			await this.plugin.saveData(null);
		} catch (err) {
			console.error('DataManager: Error deleting data.json file', err);
			throw err;
		}
	}
}
