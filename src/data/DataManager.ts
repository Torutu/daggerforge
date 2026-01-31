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

	getAdversariesBySource(source: string): AdvData[] {
		return this.data.adversaries.filter(
			a => (a as any).source?.toLowerCase() === source.toLowerCase()
		);
	}

	async updateAdversary(index: number, adversary: AdvData): Promise<void> {
		if (index < 0 || index >= this.data.adversaries.length) return;
		this.data.adversaries[index] = adversary;
		await this.save();
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
	
	searchAdversaries(query: string): AdvData[] {
		return this.data.adversaries.filter(a =>
			a.name.toLowerCase().includes(query.toLowerCase())
		);
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

	getEnvironmentsBySource(source: string): EnvironmentData[] {
		return this.data.environments.filter(
			e => (e as any).source?.toLowerCase() === source.toLowerCase()
		);
	}

	async updateEnvironment(index: number, env: EnvironmentData): Promise<void> {
		if (index < 0 || index >= this.data.environments.length) return;
		this.data.environments[index] = env;
		await this.save();
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

	searchEnvironments(query: string): EnvironmentData[] {
		return this.data.environments.filter(e =>
			e.name.toLowerCase().includes(query.toLowerCase())
		);
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

	async exportData(): Promise<string> {
		return JSON.stringify(this.data, null, 2);
	}

	/*
	 * Import data from a JSON string
	 * @param jsonString The JSON string to import
	 */
	async importData(jsonString: string): Promise<void> {
		const imported = JSON.parse(jsonString);

		const newAdversaries: AdvData[] = [
			...(imported.adversaries ?? []),
			...(imported.custom_Adversaries ?? []),
			...(imported.incredible_Adversaries ?? []),
			...(imported.custom_Broskies ?? []).map((a: any) => ({
				...a,
				source: 'broskies'
			}))
		];

		const newEnvironments: EnvironmentData[] = [
			...(imported.environments ?? []),
			...(imported.custom_Environments ?? []),
			...(imported.incredible_Environments ?? [])
		];

		this.data.adversaries.push(...newAdversaries);
		this.data.environments.push(...newEnvironments);

		this.ensureAdversariesHaveIds();
		this.ensureEnvironmentsHaveIds();

		await this.save();
	}

	async clearAllData(): Promise<void> {
		this.data = {
			version: '2.0',
			adversaries: [],
			environments: [],
			lastUpdated: Date.now()
		};
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

	getStatistics() {
		const advBySource = this.groupBySource(this.data.adversaries);
		const envBySource = this.groupBySource(this.data.environments);

		return {
			totalAdversaries: this.data.adversaries.length,
			adversariesBySource: advBySource,
			totalEnvironments: this.data.environments.length,
			environmentsBySource: envBySource,
			lastUpdated: new Date(this.data.lastUpdated).toLocaleString(),
			version: this.data.version
		};
	}

	private groupBySource(list: (AdvData | EnvironmentData)[]): Record<string, number> {
		return list.reduce((acc, item) => {
			const src = (item as any).source || 'unknown';
			acc[src] = (acc[src] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
	}
}
