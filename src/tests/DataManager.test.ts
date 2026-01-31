/**
 * DataManager.test.ts
 * 
 * Integration tests for every public method on DataManager.
 * 
 * WHY we mock only two things:
 *   DataManager's constructor takes a Plugin instance, but the only methods
 *   it ever calls on that instance are loadData() and saveData().  We replace
 *   those with a simple in-memory store.  Everything else — ID generation,
 *   searching, migration, import/export — runs against real code.
 * 
 * Sections:
 *   1. Adversary CRUD          — add, get, update, delete, search
 *   2. Environment CRUD        — add, get, update, delete, search
 *   3. ID auto-generation      — missing IDs get assigned on add
 *   4. Migration                — ensureAdversariesHaveIds / ensureEnvironmentsHaveIds
 *   5. Import / Export          — round-trip and legacy format keys
 *   6. Statistics               — groupBySource counts
 *   7. Edge cases               — delete non-existent, update out-of-range, clear
 */

import { DataManager } from '../data/DataManager';
import type { AdvData } from '../types/adversary';
import type { EnvironmentData } from '../types/environment';

// ---------------------------------------------------------------------------
// Mock Plugin — only loadData / saveData matter to DataManager
// ---------------------------------------------------------------------------

interface MockPlugin {
    loadData: () => Promise<any>;
    saveData: (data: any) => Promise<void>;
    _store: any; // direct access for test assertions
}

function createMockPlugin(initialData: any = null): MockPlugin {
    const plugin: MockPlugin = {
        _store: initialData,
        async loadData() {
            return plugin._store;
        },
        async saveData(data: any) {
            plugin._store = data;
        },
    };
    return plugin;
}

// ---------------------------------------------------------------------------
// Test fixtures — minimal valid objects matching AdvData / EnvironmentData
// ---------------------------------------------------------------------------

function makeAdversary(overrides: Partial<AdvData> = {}): AdvData {
    return {
        id: '',                         // intentionally blank — DataManager should fill it
        name: 'Test Goblin',
        tier: '1',
        type: 'Minion',
        desc: 'A small green creature.',
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
        features: [
            { name: 'Sneak', type: 'Passive', cost: '', desc: 'Moves quietly.' }
        ],
        ...overrides,
    };
}

function makeEnvironment(overrides: Partial<EnvironmentData> = {}): EnvironmentData {
    return {
        id: '',                         // blank — DataManager should fill it
        name: 'Test Swamp',
        tier: 1,
        type: 'Exploration',
        desc: 'A murky wetland.',
        impulse: 'Drag in, disorient',
        difficulty: '12',
        potentialAdversaries: 'Swamp Serpent',
        source: 'custom',
        features: [
            {
                name: 'Muddy Ground',
                type: 'Passive',
                text: 'Movement through the swamp is difficult.',
                bullets: ['Thick mud slows movement.'],
                questions: ['How deep is the mud?'],
            }
        ],
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Helper — creates a fresh DataManager backed by an empty in-memory store
// ---------------------------------------------------------------------------

async function freshManager(): Promise<{ dm: DataManager; plugin: MockPlugin }> {
    const plugin = createMockPlugin(null);
    const dm = new DataManager(plugin as any);
    await dm.load();                    // load() on null store is a no-op
    return { dm, plugin };
}

// ===========================================================================
// 1. Adversary CRUD
// ===========================================================================

describe('DataManager — adversary CRUD', () => {
    it('adds an adversary and retrieves it', async () => {
        const { dm } = await freshManager();
        const adv = makeAdversary({ name: 'Orc Raider' });

        await dm.addAdversary(adv);

        const all = dm.getAdversaries();
        expect(all).toHaveLength(1);
        expect(all[0].name).toBe('Orc Raider');
    });

    it('assigns a CUA_ id when the adversary has no id', async () => {
        const { dm } = await freshManager();
        const adv = makeAdversary({ id: '' });

        await dm.addAdversary(adv);

        const stored = dm.getAdversaries()[0];
        expect(stored.id).toMatch(/^CUA_/);
    });

    it('preserves an existing id when one is provided', async () => {
        const { dm } = await freshManager();
        const adv = makeAdversary({ id: 'MY_CUSTOM_ID' });

        await dm.addAdversary(adv);

        expect(dm.getAdversaries()[0].id).toBe('MY_CUSTOM_ID');
    });

    it('updates an adversary at a valid index', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Before' }));

        const updated = makeAdversary({ name: 'After', id: 'keep' });
        await dm.updateAdversary(0, updated);

        expect(dm.getAdversaries()[0].name).toBe('After');
    });

    it('does nothing when updating at an out-of-range index', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Only One' }));

        // index 5 doesn't exist — should silently no-op
        await dm.updateAdversary(5, makeAdversary({ name: 'Ghost' }));

        expect(dm.getAdversaries()).toHaveLength(1);
        expect(dm.getAdversaries()[0].name).toBe('Only One');
    });

    it('deletes an adversary by id', async () => {
        const { dm } = await freshManager();
        const adv = makeAdversary({ id: 'DELETE_ME' });
        await dm.addAdversary(adv);

        await dm.deleteAdversaryById('DELETE_ME');

        expect(dm.getAdversaries()).toHaveLength(0);
    });

    it('throws when deleting a non-existent adversary id', async () => {
        const { dm } = await freshManager();

        await expect(dm.deleteAdversaryById('NOPE')).rejects.toThrow(
            'Adversary with ID NOPE not found'
        );
    });

    it('searches adversaries by name substring (case-insensitive)', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Fire Drake', id: 'a' }));
        await dm.addAdversary(makeAdversary({ name: 'Ice Golem', id: 'b' }));
        await dm.addAdversary(makeAdversary({ name: 'Fire Ant',  id: 'c' }));

        const results = dm.searchAdversaries('fire');
        expect(results).toHaveLength(2);
        expect(results.every(a => a.name.toLowerCase().includes('fire'))).toBe(true);
    });

    it('returns empty array when no adversaries match search', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Goblin' }));

        expect(dm.searchAdversaries('dragon')).toHaveLength(0);
    });

    it('filters adversaries by source', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'A', id: 'x', source: 'core' }));
        await dm.addAdversary(makeAdversary({ name: 'B', id: 'y', source: 'custom' }));
        await dm.addAdversary(makeAdversary({ name: 'C', id: 'z', source: 'core' }));

        const coreOnly = dm.getAdversariesBySource('core');
        expect(coreOnly).toHaveLength(2);
        expect(coreOnly.every(a => a.source === 'core')).toBe(true);
    });
});

// ===========================================================================
// 2. Environment CRUD
// ===========================================================================

describe('DataManager — environment CRUD', () => {
    it('adds an environment and retrieves it', async () => {
        const { dm } = await freshManager();
        const env = makeEnvironment({ name: 'Dark Forest' });

        await dm.addEnvironment(env);

        const all = dm.getEnvironments();
        expect(all).toHaveLength(1);
        expect(all[0].name).toBe('Dark Forest');
    });

    it('assigns a CUE_ id when the environment has no id', async () => {
        const { dm } = await freshManager();
        const env = makeEnvironment({ id: '' });

        await dm.addEnvironment(env);

        const stored = dm.getEnvironments()[0];
        expect(stored.id).toMatch(/^CUE_/);
    });

    it('preserves an existing id when one is provided', async () => {
        const { dm } = await freshManager();
        const env = makeEnvironment({ id: 'ENV_KEEP' });

        await dm.addEnvironment(env);

        expect(dm.getEnvironments()[0].id).toBe('ENV_KEEP');
    });

    it('updates an environment at a valid index', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ name: 'Before' }));

        const updated = makeEnvironment({ name: 'After', id: 'keep' });
        await dm.updateEnvironment(0, updated);

        expect(dm.getEnvironments()[0].name).toBe('After');
    });

    it('does nothing when updating at an out-of-range index', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ name: 'Only One' }));

        await dm.updateEnvironment(99, makeEnvironment({ name: 'Ghost' }));

        expect(dm.getEnvironments()).toHaveLength(1);
        expect(dm.getEnvironments()[0].name).toBe('Only One');
    });

    it('deletes an environment by id', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ id: 'DEL_ENV' }));

        await dm.deleteEnvironmentById('DEL_ENV');

        expect(dm.getEnvironments()).toHaveLength(0);
    });

    it('throws when deleting a non-existent environment id', async () => {
        const { dm } = await freshManager();

        await expect(dm.deleteEnvironmentById('NOPE')).rejects.toThrow(
            'Environment with ID NOPE not found'
        );
    });

    it('searches environments by name substring (case-insensitive)', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ name: 'Burning Plains', id: 'a' }));
        await dm.addEnvironment(makeEnvironment({ name: 'Frozen Tundra', id: 'b' }));
        await dm.addEnvironment(makeEnvironment({ name: 'Burning Marsh',  id: 'c' }));

        const results = dm.searchEnvironments('burning');
        expect(results).toHaveLength(2);
    });

    it('returns empty array when no environments match search', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ name: 'Swamp' }));

        expect(dm.searchEnvironments('volcano')).toHaveLength(0);
    });

    it('filters environments by source', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ name: 'A', id: 'x', source: 'core' }));
        await dm.addEnvironment(makeEnvironment({ name: 'B', id: 'y', source: 'void' }));
        await dm.addEnvironment(makeEnvironment({ name: 'C', id: 'z', source: 'core' }));

        const coreOnly = dm.getEnvironmentsBySource('core');
        expect(coreOnly).toHaveLength(2);
        expect(coreOnly.every(e => e.source === 'core')).toBe(true);
    });
});

// ===========================================================================
// 3. ID auto-generation on add
// ===========================================================================

describe('DataManager — ID auto-generation', () => {
    it('gives each added adversary a unique CUA_ id even when all start blank', async () => {
        const { dm } = await freshManager();

        for (let i = 0; i < 10; i++) {
            await dm.addAdversary(makeAdversary({ id: '', name: `Adv ${i}` }));
        }

        const ids = dm.getAdversaries().map(a => a.id);
        const uniqueIds = new Set(ids);

        expect(ids.every(id => id.startsWith('CUA_'))).toBe(true);
        expect(uniqueIds.size).toBe(10);     // no collisions
    });

    it('gives each added environment a unique CUE_ id even when all start blank', async () => {
        const { dm } = await freshManager();

        for (let i = 0; i < 10; i++) {
            await dm.addEnvironment(makeEnvironment({ id: '', name: `Env ${i}` }));
        }

        const ids = dm.getEnvironments().map(e => e.id);
        const uniqueIds = new Set(ids);

        expect(ids.every(id => id.startsWith('CUE_'))).toBe(true);
        expect(uniqueIds.size).toBe(10);
    });
});

// ===========================================================================
// 4. Migration — legacy data without IDs gets IDs on load()
// ===========================================================================

// Migration is tested indirectly through importData(), which is the actual
// path that triggers ensureAdversariesHaveIds / ensureEnvironmentsHaveIds.
// load() calls those helpers too, but it operates on this.data (the in-memory
// store) rather than on the return value of loadData(), so the migration
// logic is exercised most cleanly via import.
describe('DataManager — migration via import', () => {
    it('assigns CUA_ ids to imported adversaries that have none', async () => {
        const { dm } = await freshManager();

        // Payload with no id field — importData calls ensureAdversariesHaveIds
        const payload = JSON.stringify({
            adversaries: [
                { name: 'Old Goblin', tier: '1', type: 'Minion', desc: '', motives: '',
                  difficulty: '8', thresholdMajor: '4', thresholdSevere: '10',
                  hp: '3', stress: '1', atk: '+1', weaponName: 'Club',
                  weaponRange: 'Very Close', weaponDamage: '1d4 phy', xp: '', features: [] },
            ],
        });

        await dm.importData(payload);

        const adv = dm.getAdversaries()[0];
        expect(adv.id).toMatch(/^CUA_/);
    });

    it('assigns CUE_ ids to imported environments that have none', async () => {
        const { dm } = await freshManager();

        const payload = JSON.stringify({
            environments: [
                { name: 'Old Swamp', tier: 1, type: 'Exploration', desc: '', impulse: '',
                  difficulty: '10', potentialAdversaries: '', features: [] },
            ],
        });

        await dm.importData(payload);

        const env = dm.getEnvironments()[0];
        expect(env.id).toMatch(/^CUE_/);
    });

    it('does not overwrite existing IDs during import', async () => {
        const { dm } = await freshManager();

        const payload = JSON.stringify({
            adversaries: [
                { id: 'KEEP_THIS', name: 'Named Goblin', tier: '1', type: 'Minion',
                  desc: '', motives: '', difficulty: '8', thresholdMajor: '4',
                  thresholdSevere: '10', hp: '3', stress: '1', atk: '+1',
                  weaponName: 'Club', weaponRange: 'Very Close',
                  weaponDamage: '1d4 phy', xp: '', features: [] },
            ],
        });

        await dm.importData(payload);

        expect(dm.getAdversaries()[0].id).toBe('KEEP_THIS');
    });
});

// ===========================================================================
// 5. Import / Export — round-trip and legacy format keys
// ===========================================================================

describe('DataManager — import / export', () => {
    it('exports all stored data as valid JSON', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Exported Adv', id: 'EXP_A' }));
        await dm.addEnvironment(makeEnvironment({ name: 'Exported Env', id: 'EXP_E' }));

        const json = await dm.exportData();
        const parsed = JSON.parse(json);

        expect(parsed.adversaries).toHaveLength(1);
        expect(parsed.adversaries[0].name).toBe('Exported Adv');
        expect(parsed.environments).toHaveLength(1);
        expect(parsed.environments[0].name).toBe('Exported Env');
    });

    it('imports standard format adversaries and environments', async () => {
        const { dm } = await freshManager();
        const importPayload = JSON.stringify({
            adversaries: [makeAdversary({ name: 'Imported Adv', id: 'IMP_A' })],
            environments: [makeEnvironment({ name: 'Imported Env', id: 'IMP_E' })],
        });

        await dm.importData(importPayload);

        expect(dm.getAdversaries()[0].name).toBe('Imported Adv');
        expect(dm.getEnvironments()[0].name).toBe('Imported Env');
    });

    it('imports legacy custom_Adversaries and custom_Environments keys', async () => {
        const { dm } = await freshManager();
        const legacyPayload = JSON.stringify({
            custom_Adversaries: [makeAdversary({ name: 'Legacy Adv', id: 'LEG_A' })],
            custom_Environments: [makeEnvironment({ name: 'Legacy Env', id: 'LEG_E' })],
        });

        await dm.importData(legacyPayload);

        expect(dm.getAdversaries()[0].name).toBe('Legacy Adv');
        expect(dm.getEnvironments()[0].name).toBe('Legacy Env');
    });

    it('round-trips: export then import into a fresh manager produces identical data', async () => {
        const { dm: original } = await freshManager();
        await original.addAdversary(makeAdversary({ name: 'Round Trip Adv', id: 'RT_A' }));
        await original.addEnvironment(makeEnvironment({ name: 'Round Trip Env', id: 'RT_E' }));

        const exported = await original.exportData();

        // Fresh manager, import the exported JSON
        const { dm: restored } = await freshManager();
        await restored.importData(exported);

        expect(restored.getAdversaries()[0].name).toBe('Round Trip Adv');
        expect(restored.getAdversaries()[0].id).toBe('RT_A');
        expect(restored.getEnvironments()[0].name).toBe('Round Trip Env');
        expect(restored.getEnvironments()[0].id).toBe('RT_E');
    });
});

// ===========================================================================
// 6. Statistics
// ===========================================================================

describe('DataManager — statistics', () => {
    it('reports correct totals and source groupings', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'A1', id: 'a1', source: 'core' }));
        await dm.addAdversary(makeAdversary({ name: 'A2', id: 'a2', source: 'core' }));
        await dm.addAdversary(makeAdversary({ name: 'A3', id: 'a3', source: 'custom' }));
        await dm.addEnvironment(makeEnvironment({ name: 'E1', id: 'e1', source: 'void' }));

        const stats = dm.getStatistics();

        expect(stats.totalAdversaries).toBe(3);
        expect(stats.adversariesBySource['core']).toBe(2);
        expect(stats.adversariesBySource['custom']).toBe(1);
        expect(stats.totalEnvironments).toBe(1);
        expect(stats.environmentsBySource['void']).toBe(1);
    });

    it('returns zero totals on an empty store', async () => {
        const { dm } = await freshManager();
        const stats = dm.getStatistics();

        expect(stats.totalAdversaries).toBe(0);
        expect(stats.totalEnvironments).toBe(0);
    });
});

// ===========================================================================
// 7. Edge cases
// ===========================================================================

describe('DataManager — edge cases', () => {
    it('clearAllData removes everything', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Gone', id: 'g1' }));
        await dm.addEnvironment(makeEnvironment({ name: 'Also Gone', id: 'g2' }));

        await dm.clearAllData();

        expect(dm.getAdversaries()).toHaveLength(0);
        expect(dm.getEnvironments()).toHaveLength(0);
    });

    it('load() with null saved data leaves store empty without throwing', async () => {
        const plugin = createMockPlugin(null);
        const dm = new DataManager(plugin as any);

        // Should not throw
        await dm.load();

        expect(dm.getAdversaries()).toHaveLength(0);
        expect(dm.getEnvironments()).toHaveLength(0);
    });

    it('negative index on updateAdversary is a no-op', async () => {
        const { dm } = await freshManager();
        await dm.addAdversary(makeAdversary({ name: 'Safe', id: 's1' }));

        await dm.updateAdversary(-1, makeAdversary({ name: 'Intruder' }));

        expect(dm.getAdversaries()[0].name).toBe('Safe');
    });

    it('negative index on updateEnvironment is a no-op', async () => {
        const { dm } = await freshManager();
        await dm.addEnvironment(makeEnvironment({ name: 'Safe', id: 's1' }));

        await dm.updateEnvironment(-1, makeEnvironment({ name: 'Intruder' }));

        expect(dm.getEnvironments()[0].name).toBe('Safe');
    });
});
