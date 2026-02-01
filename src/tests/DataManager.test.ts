/**
 * DataManager.test.ts
 * 
 * Simple tests showing how DataManager works.
 * Each test does one thing and checks one result.
 */

import { DataManager } from '../data/DataManager';
import type { AdvData } from '../types/adversary';
import type { EnvironmentData } from '../types/environment';

// Simple mock to pretend we're saving/loading data
function createMockPlugin() {
    const plugin = {
        _store: null,
        async loadData() { return plugin._store; },
        async saveData(data: any) { plugin._store = data; },
    };
    return plugin;
}

async function createManager() {
    const plugin = createMockPlugin();
    const dm = new DataManager(plugin as any);
    await dm.load();
    return dm;
}

// Sample adversary for testing
function sampleAdversary(): AdvData {
    return {
        id: '',
        name: 'Test Goblin',
        tier: '1',
        type: 'Minion',
        desc: 'A small green creature',
        motives: 'Steal, flee',
        difficulty: '10',
        thresholdMajor: '6',
        thresholdSevere: '12',
        hp: '4',
        stress: '2',
        atk: '+2',
        weaponName: 'Dagger',
        weaponRange: 'Very Close',
        weaponDamage: '1d6+1 phy',
        xp: '',
        source: 'custom',
        features: [],
    };
}

// Sample environment for testing
function sampleEnvironment(): EnvironmentData {
    return {
        id: '',
        name: 'Test Swamp',
        tier: '1',
        type: 'Exploration',
        desc: 'A murky wetland',
        impulse: 'Drag in, disorient',
        difficulty: '12',
        potentialAdversaries: 'Swamp Serpent',
        source: 'custom',
        features: [],
    };
}

// ===========================================================================
// Adversary Tests
// ===========================================================================

describe('Adding adversaries', () => {
    it('can add an adversary', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());
        
        const all = dm.getAdversaries();
        expect(all).toHaveLength(1);
    });

    it('gives new adversaries an ID', async () => {
        const dm = await createManager();
        const adv = sampleAdversary();
        await dm.addAdversary(adv);
        
        const saved = dm.getAdversaries()[0];
        expect(saved.id).toMatch(/^CUA_/);
    });
});

describe('Getting adversaries', () => {
    it('can get all adversaries', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());
        
        const all = dm.getAdversaries();
        expect(all[0].name).toBe('Test Goblin');
    });
});

describe('Deleting adversaries', () => {
    it('can delete an adversary', async () => {
        const dm = await createManager();
        const adv = sampleAdversary();
        adv.id = 'TEST_ID';
        await dm.addAdversary(adv);
        
        await dm.deleteAdversaryById('TEST_ID');
        
        expect(dm.getAdversaries()).toHaveLength(0);
    });
});

// ===========================================================================
// Environment Tests
// ===========================================================================

describe('Adding environments', () => {
    it('can add an environment', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());
        
        const all = dm.getEnvironments();
        expect(all).toHaveLength(1);
    });

    it('gives new environments an ID', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());
        
        const saved = dm.getEnvironments()[0];
        expect(saved.id).toMatch(/^CUE_/);
    });
});

describe('Getting environments', () => {
    it('can get all environments', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());
        
        const all = dm.getEnvironments();
        expect(all[0].name).toBe('Test Swamp');
    });
});

describe('Deleting environments', () => {
    it('can delete an environment', async () => {
        const dm = await createManager();
        const env = sampleEnvironment();
        env.id = 'TEST_ENV_ID';
        await dm.addEnvironment(env);
        
        await dm.deleteEnvironmentById('TEST_ENV_ID');
        
        expect(dm.getEnvironments()).toHaveLength(0);
    });
});

// ===========================================================================
// Import data Tests
// ===========================================================================

describe('Import data', () => {
    it('can import data from JSON', async () => {
        const dm = await createManager();
        const data = {
            adversaries: [sampleAdversary()],
            environments: []
        };
        
        await dm.importData(JSON.stringify(data));
        
        expect(dm.getAdversaries()).toHaveLength(1);
    });
});
