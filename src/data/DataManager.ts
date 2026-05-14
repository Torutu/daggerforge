import { Notice, Plugin } from 'obsidian';
import { AdvData, EnvironmentData, PluginSettings, DEFAULT_SETTINGS } from '../types/index';
import { generateEnvUniqueId, generateAdvUniqueId } from '../utils/index';

export interface StoredCustomData {
	adversaries: AdvData[];
	environments: EnvironmentData[];
	settings: PluginSettings;
	lastUpdated: number;
}

export class DataManager {
	private plugin: Plugin;
	private data: StoredCustomData = {
		adversaries: [],
		environments: [],
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
		await this.save();
	}

	getAdversaries(): AdvData[] {
		return this.data.adversaries;
	}

	async deleteAdversaryById(id: string): Promise<void> {
		const index = this.data.adversaries.findIndex(a => (a).id === id);
		if (index === -1) throw new Error(`Adversary with ID ${id} not found`);
		this.data.adversaries.splice(index, 1);
		await this.save();
	}

	// ==================== ENVIRONMENTS ====================

	async addEnvironment(env: EnvironmentData): Promise<void> {
		if (!(env as any).id) {
			(env as any).id = generateEnvUniqueId();
		}
		this.data.environments.push(env);
		await this.save();
	}

	getEnvironments(): EnvironmentData[] {
		return this.data.environments;
	}

	async deleteEnvironmentById(id: string): Promise<void> {
		const index = this.data.environments.findIndex(e => (e as any).id === id);
		if (index === -1) throw new Error(`Environment with ID ${id} not found`);
		this.data.environments.splice(index, 1);
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
		this.ensureAdversariesHaveIds();
		this.ensureEnvironmentsHaveIds();
		await this.save();
	}

	async deleteDataFile(): Promise<void> {
		try {
			this.data = { adversaries: [], environments: [], settings: DEFAULT_SETTINGS, lastUpdated: Date.now() };
			await this.plugin.saveData(null);
		} catch (err) {
			console.error('DataManager: Error deleting data.json file', err);
			throw err;
		}
	}
}
