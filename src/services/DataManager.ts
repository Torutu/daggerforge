import { Plugin } from 'obsidian';
import { CardData } from '../types/adversary';
import { EnvironmentData } from '../types/environment';

export interface StoredData {
	version: string;
	adversaries: CardData[];
	environments: EnvironmentData[];
	lastUpdated: number;
}

/**
 * DataManager — unified version
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

			// Merge base
			this.data = { ...this.data, ...saved };

			// Migrate all older keys if present
			const allAdversaries: CardData[] = [];
			const allEnvironments: EnvironmentData[] = [];

			// Collect all known legacy arrays
			if (Array.isArray((saved as any).custom_Adversaries))
				allAdversaries.push(...(saved as any).custom_Adversaries);
			if (Array.isArray((saved as any).incredible_Adversaries))
				allAdversaries.push(...(saved as any).incredible_Adversaries);
			if (Array.isArray((saved as any).custom_Broskies))
				allAdversaries.push(
					...(saved as any).custom_Broskies.map((a: any) => ({
						...a,
						source: 'broskies'
					}))
				);

			if (Array.isArray((saved as any).custom_Environments))
				allEnvironments.push(...(saved as any).custom_Environments);
			if (Array.isArray((saved as any).incredible_Environments))
				allEnvironments.push(...(saved as any).incredible_Environments);

			// Append migrated data
			if (allAdversaries.length > 0) {
				this.data.adversaries.push(...allAdversaries);
}
			if (allEnvironments.length > 0) {
				this.data.environments.push(...allEnvironments);
}

			// Clean up old keys
			delete (this.data as any).custom_Adversaries;
			delete (this.data as any).incredible_Adversaries;
			delete (this.data as any).custom_Environments;
			delete (this.data as any).incredible_Environments;
			delete (this.data as any).custom_Broskies;

			await this.save();
} catch (err) {
			console.error('DataManager: Error loading data', err);
		}
	}

	/**
	 * Save data to disk
	 */
	private async save(): Promise<void> {
		this.data.lastUpdated = Date.now();
		await this.plugin.saveData(this.data);
	}

	// ==================== ADVERSARIES ====================

	async addAdversary(adversary: CardData): Promise<void> {
		this.data.adversaries.push(adversary);
		await this.save();
	}

	getAdversaries(): CardData[] {
		return this.data.adversaries;
	}

	getAdversariesBySource(source: string): CardData[] {
		return this.data.adversaries.filter(
			a => (a as any).source?.toLowerCase() === source.toLowerCase()
		);
	}

	async updateAdversary(index: number, adversary: CardData): Promise<void> {
		if (index < 0 || index >= this.data.adversaries.length) return;
		this.data.adversaries[index] = adversary;
		await this.save();
	}

	async deleteAdversary(index: number): Promise<void> {
		if (index < 0 || index >= this.data.adversaries.length) return;
		this.data.adversaries.splice(index, 1);
		await this.save();
	}

	searchAdversaries(query: string): CardData[] {
		return this.data.adversaries.filter(a =>
			a.name.toLowerCase().includes(query.toLowerCase())
		);
	}

	// ==================== ENVIRONMENTS ====================

	async addEnvironment(env: EnvironmentData): Promise<void> {
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

	async deleteEnvironment(index: number): Promise<void> {
		if (index < 0 || index >= this.data.environments.length) return;
		this.data.environments.splice(index, 1);
		await this.save();
	}

	searchEnvironments(query: string): EnvironmentData[] {
		return this.data.environments.filter(e =>
			e.name.toLowerCase().includes(query.toLowerCase())
		);
	}

	// ==================== UTILITIES ====================

	async exportData(): Promise<string> {
		return JSON.stringify(this.data, null, 2);
	}

	async importData(jsonString: string): Promise<void> {
		const imported = JSON.parse(jsonString);

		// Migrate any old fields into unified arrays
		const newAdversaries: CardData[] = [
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
			// Reset in-memory data first
			this.data = {
				version: '2.0',
				adversaries: [],
				environments: [],
				lastUpdated: Date.now()
			};
			
			// Delete the actual data.json file
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

	private groupBySource(list: (CardData | EnvironmentData)[]): Record<string, number> {
		return list.reduce((acc, item) => {
			const src = (item as any).source || 'unknown';
			acc[src] = (acc[src] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
	}
}
