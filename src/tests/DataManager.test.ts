/**
 * DataManager.test.ts
 * 
 * Tests for DataManager - saving, loading, and managing data
 */

import { DataManager } from '../data/index';
import type { AdvData } from '../types/index';
import type { EnvironmentData } from '../types/index';

const testResults: string[] = [];

function logResult(testName: string, expected: any, actual: any, passed: boolean) {
    testResults.push(`Test: ${testName}`);
    testResults.push(`  Expected: ${expected}`);
    testResults.push(`  Actual:   ${actual}`);
    testResults.push(`  Result:   ${passed ? 'PASS' : 'FAIL'}`);
    testResults.push('');
}

afterAll(() => {
    console.log(`
========================================
DATA MANAGER TEST RESULTS
========================================

${testResults.join('\n')}`);
});

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

describe('Adding adversaries', () => {
    it('can add an adversary', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());

        const all = dm.getAdversaries();
        const expected = 1;
        const actual = all.length;

        logResult('Add adversary', `${expected} adversary`, `${actual} adversary`, actual === expected);

        expect(all).toHaveLength(1);
    });

    it('gives new adversaries an ID', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());

        const saved = dm.getAdversaries()[0];
        const expected = 'CUA_';
        const actual = saved.id.substring(0, 4);

        logResult('Adversary ID generation', `ID starts with "${expected}"`, `ID: ${saved.id}`, actual === expected);

        expect(saved.id).toMatch(/^CUA_/);
    });
});

describe('Getting adversaries', () => {
    it('can get all adversaries', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());

        const all = dm.getAdversaries();
        const expected = 'Test Goblin';
        const actual = all[0].name;

        logResult('Get adversary by name', `"${expected}"`, `"${actual}"`, actual === expected);

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

        const expected = 0;
        const actual = dm.getAdversaries().length;

        logResult('Delete adversary', `${expected} adversaries remaining`, `${actual} adversaries remaining`, actual === expected);

        expect(dm.getAdversaries()).toHaveLength(0);
    });
});

describe('Adding environments', () => {
    it('can add an environment', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());

        const all = dm.getEnvironments();
        const expected = 1;
        const actual = all.length;

        logResult('Add environment', `${expected} environment`, `${actual} environment`, actual === expected);

        expect(all).toHaveLength(1);
    });

    it('gives new environments an ID', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());

        const saved = dm.getEnvironments()[0];
        const expected = 'CUE_';
        const actual = saved.id.substring(0, 4);

        logResult('Environment ID generation', `ID starts with "${expected}"`, `ID: ${saved.id}`, actual === expected);

        expect(saved.id).toMatch(/^CUE_/);
    });
});

describe('Getting environments', () => {
    it('can get all environments', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());

        const all = dm.getEnvironments();
        const expected = 'Test Swamp';
        const actual = all[0].name;

        logResult('Get environment by name', `"${expected}"`, `"${actual}"`, actual === expected);

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

        const expected = 0;
        const actual = dm.getEnvironments().length;

        logResult('Delete environment', `${expected} environments remaining`, `${actual} environments remaining`, actual === expected);

        expect(dm.getEnvironments()).toHaveLength(0);
    });
});

describe('Import data', () => {
    it('can import data from JSON', async () => {
        const dm = await createManager();
        const data = {
            adversaries: [sampleAdversary()],
            environments: []
        };

        await dm.importData(JSON.stringify(data));

        const expected = 1;
        const actual = dm.getAdversaries().length;

        logResult('Import JSON data', `${expected} adversary imported`, `${actual} adversary imported`, actual === expected);

        expect(dm.getAdversaries()).toHaveLength(1);
    });
});
