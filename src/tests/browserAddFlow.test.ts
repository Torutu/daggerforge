/**
 * browserAddFlow.test.ts
 * 
 * Simple tests showing how the browser works.
 * Tests how adversaries and environments get added from the browser.
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

// Sample adversary from the browser
function browserAdversary(): AdvData {
    return {
        id: 'CA001',
        name: 'ACID BURROWER',
        tier: '1',
        type: 'Solo',
        desc: 'A horse-sized insect with digging claws',
        motives: 'Burrow, drag away, feed',
        difficulty: '14',
        thresholdMajor: '8',
        thresholdSevere: '15',
        hp: '8',
        stress: '3',
        atk: '+3',
        weaponName: 'Claws',
        weaponRange: 'Very Close',
        weaponDamage: '1d12+2 phy',
        xp: 'Tremor Sense +2',
        source: 'core',
        features: [
            { name: 'Relentless (3)', type: 'Passive', cost: '', desc: 'Can be spotlighted three times per GM turn' },
        ],
    };
}

// Sample environment from the browser
function browserEnvironment(): EnvironmentData {
    return {
        id: 'CE001',
        name: 'ABANDONED GROVE',
        tier: '1',
        type: 'Exploration',
        desc: 'A former druidic grove',
        impulse: 'Draw in the curious, echo the past',
        difficulty: '11',
        potentialAdversaries: 'Beasts (Bear, Dire Wolf)',
        source: 'core',
        features: [
            {
                name: 'Overgrown Battlefield',
                type: 'Passive',
                text: 'There has been a battle here',
                bullets: ['Traces of a battle litter the ground'],
                questions: ['Why did these groups come to blows?'],
            },
        ],
    };
}

describe('Adding from browser', () => {
    it('can add an adversary from the browser', async () => {
        const dm = await createManager();
        const adv = browserAdversary();
        
        await dm.addAdversary(adv);
        
        const all = dm.getAdversaries();
        expect(all).toHaveLength(1);
        expect(all[0].name).toBe('ACID BURROWER');
    });

    it('can add an environment from the browser', async () => {
        const dm = await createManager();
        const env = browserEnvironment();
        
        await dm.addEnvironment(env);
        
        const all = dm.getEnvironments();
        expect(all).toHaveLength(1);
        expect(all[0].name).toBe('ABANDONED GROVE');
    });
});

describe('Browser features', () => {
    it('keeps adversary features when added', async () => {
        const dm = await createManager();
        const adv = browserAdversary();
        
        await dm.addAdversary(adv);
        
        const saved = dm.getAdversaries()[0];
        expect(saved.features).toHaveLength(1);
        expect(saved.features[0].name).toBe('Relentless (3)');
    });

    it('keeps environment features when added', async () => {
        const dm = await createManager();
        const env = browserEnvironment();
        
        await dm.addEnvironment(env);
        
        const saved = dm.getEnvironments()[0];
        expect(saved.features).toHaveLength(1);
        expect(saved.features[0].name).toBe('Overgrown Battlefield');
    });
});

describe('Creating custom items', () => {
    it('can create a custom adversary', async () => {
        const dm = await createManager();
        const custom: AdvData = {
            id: '',
            name: 'My Custom Goblin',
            tier: '2',
            type: 'Leader',
            desc: 'A cunning goblin',
            motives: 'Power, survival',
            difficulty: '13',
            thresholdMajor: '7',
            thresholdSevere: '14',
            hp: '10',
            stress: '4',
            atk: '+3',
            weaponName: 'War Scimitar',
            weaponRange: 'Very Close',
            weaponDamage: '1d10+2 phy',
            xp: '',
            source: 'custom',
            features: [],
        };
        
        await dm.addAdversary(custom);
        
        const saved = dm.getAdversaries()[0];
        expect(saved.name).toBe('My Custom Goblin');
        expect(saved.source).toBe('custom');
    });

    it('can create a custom environment', async () => {
        const dm = await createManager();
        const custom: EnvironmentData = {
            id: '',
            name: 'Cursed Lighthouse',
            tier: '2',
            type: 'Exploration',
            desc: 'A lighthouse that pulses with eerie light',
            impulse: 'Lure in, unsettle',
            difficulty: '14',
            potentialAdversaries: 'Spectral Sailor',
            source: 'custom',
            features: [],
        };
        
        await dm.addEnvironment(custom);
        
        const saved = dm.getEnvironments()[0];
        expect(saved.name).toBe('Cursed Lighthouse');
        expect(saved.source).toBe('custom');
    });
});
