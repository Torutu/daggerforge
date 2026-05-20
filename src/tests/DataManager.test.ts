/**
 * DataManager.test.ts
 *
 * Tests for DataManager — saving, loading, and managing adversary and environment data.
 */

import { DataManager } from '../data/index';
import type { AdvData, EnvironmentData } from '../types/index';

function mockPlugin() {
    const plugin = {
        _store: null as any,
        async loadData() { return plugin._store; },
        async saveData(data: any) { plugin._store = data; },
    };
    return plugin;
}

async function createManager() {
    const dm = new DataManager(mockPlugin() as any);
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

// ── Adversaries ───────────────────────────────────────────────────────────────

describe('Adversaries', () => {
    test('addAdversary stores the record', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());
        expect(dm.getAdversaries()).toHaveLength(1);
    });

    test('new adversary gets a CUA_ prefixed id', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());
        expect(dm.getAdversaries()[0].id).toMatch(/^CUA_/);
    });

    test('getAdversaries returns the stored name', async () => {
        const dm = await createManager();
        await dm.addAdversary(sampleAdversary());
        expect(dm.getAdversaries()[0].name).toBe('Test Goblin');
    });

    test('deleteAdversaryById removes the record', async () => {
        const dm = await createManager();
        const adv = { ...sampleAdversary(), id: 'TEST_ID' };
        await dm.addAdversary(adv);
        await dm.deleteAdversaryById('TEST_ID');
        expect(dm.getAdversaries()).toHaveLength(0);
    });
});

// ── Environments ──────────────────────────────────────────────────────────────

describe('Environments', () => {
    test('addEnvironment stores the record', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());
        expect(dm.getEnvironments()).toHaveLength(1);
    });

    test('new environment gets a CUE_ prefixed id', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());
        expect(dm.getEnvironments()[0].id).toMatch(/^CUE_/);
    });

    test('getEnvironments returns the stored name', async () => {
        const dm = await createManager();
        await dm.addEnvironment(sampleEnvironment());
        expect(dm.getEnvironments()[0].name).toBe('Test Swamp');
    });

    test('deleteEnvironmentById removes the record', async () => {
        const dm = await createManager();
        const env = { ...sampleEnvironment(), id: 'TEST_ENV_ID' };
        await dm.addEnvironment(env);
        await dm.deleteEnvironmentById('TEST_ENV_ID');
        expect(dm.getEnvironments()).toHaveLength(0);
    });
});

// ── Import ────────────────────────────────────────────────────────────────────

describe('importData', () => {
    test('imports adversaries from JSON string', async () => {
        const dm = await createManager();
        await dm.importData(JSON.stringify({ adversaries: [sampleAdversary()], environments: [] }));
        expect(dm.getAdversaries()).toHaveLength(1);
    });
});
