import { Plugin } from 'obsidian';
import { AdvData ,EnvironmentData} from '../types/index';
import { generateEnvUniqueId, generateAdvUniqueId } from '../utils/index';

export interface StoredData {
	version: string;
	adversaries: AdvData[];
	environments: EnvironmentData[];
	lastUpdated: number;
}

/**
 * DataManager -
 * Stores everything under:
 * .obsidian/plugins/daggerforge/data.json
 */
export class DataManager {
	private plugin: Plugin;
	private data: StoredData = {
		version: '2.0',
		adversaries: [],
		environments: [],
		lastUpdated: Date.now()
	};

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	/**
	 * Load and migrate old data formats
	 */
	async load(): Promise<void> {
		try {
			const saved = await this.plugin.loadData();
			if (!saved) return;
			
			this.data = {
				version: saved.version || '2.0',
				adversaries: saved.adversaries || [],
				environments: saved.environments || [],
				lastUpdated: saved.lastUpdated || Date.now()
			};
			
			this.ensureAdversariesHaveIds();
			this.ensureEnvironmentsHaveIds();
			await this.save();
		} catch (err) {
			console.error('DataManager: Error loading data', err);
		}
	}

	private async save(): Promise<void> {
		this.data.lastUpdated = Date.now();
		await this.plugin.saveData(this.data);
	}

	// ==================== ADVERSARIES ====================

	async addAdversary(adversary: AdvData): Promise<void> {
		if (!(adversary as any).id) {
			(adversary as any).id = generateAdvUniqueId();
		}
		this.data.adversaries.push(adversary);
		await this.save();
	}

	getAdversaries(): AdvData[] {
		return this.data.adversaries;
	}

	/**
	 * Delete adversary by unique ID
	 * @param id The unique ID of the adversary to delete
	 */
	async deleteAdversaryById(id: string): Promise<void> {
		const index = this.data.adversaries.findIndex(a => (a as any).id === id);
		if (index === -1) {
			throw new Error(`Adversary with ID ${id} not found`);
		}
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

	/**
	 * Delete environment by unique ID
	 * @param id The unique ID of the environment to delete
	 */
	async deleteEnvironmentById(id: string): Promise<void> {
		const index = this.data.environments.findIndex(e => (e as any).id === id);
		if (index === -1) {
			throw new Error(`Environment with ID ${id} not found`);
		}
		this.data.environments.splice(index, 1);
		await this.save();
	}

	// ==================== UTILITIES ====================

	/**
	 * Ensure all adversaries have unique IDs
	 * (for migration from old data without IDs)
	 */
	private ensureAdversariesHaveIds(): void {
		this.data.adversaries = this.data.adversaries.map(adv => ({
			...adv,
			id: (adv as any).id || generateAdvUniqueId()
		}));
	}

	/**
	 * Ensure all environments have unique IDs
	 * (for migration from old data without IDs)
	 */
	private ensureEnvironmentsHaveIds(): void {
		this.data.environments = this.data.environments.map(env => ({
			...env,
			id: (env as any).id || generateEnvUniqueId()
		}));
	}

	/*
	 * Import data from a JSON string
	 * @param jsonString The JSON string to import
	 */
	async importData(jsonString: string): Promise<void> {
		const imported = JSON.parse(jsonString);

		const newAdversaries: AdvData[] = imported.adversaries ?? [];
		const newEnvironments: EnvironmentData[] = imported.environments ?? [];

		this.data.adversaries.push(...newAdversaries);
		this.data.environments.push(...newEnvironments);

		this.ensureAdversariesHaveIds();
		this.ensureEnvironmentsHaveIds();

		await this.save();
	}

	/**
	 * Delete the data.json file completely
	 * This will remove all stored plugin data from disk
	 */
	async deleteDataFile(): Promise<void> {
		try {
			this.data = {
				version: '2.0',
				adversaries: [],
				environments: [],
				lastUpdated: Date.now()
			};
			
			await this.plugin.saveData(null);
		} catch (err) {
			console.error('DataManager: Error deleting data.json file', err);
			throw err;
		}
	}
}
