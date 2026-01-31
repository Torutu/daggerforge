/**
 * browserAddFlow.test.ts
 * 
 * Integration tests that simulate the full "add from browser" and
 * "create custom" flows end-to-end — from raw static data through
 * DataManager persistence to retrieval and search.
 * 
 * WHY this file exists:
 *   The Adversary Browser and Environment Browser do several things before
 *   an item reaches DataManager:
 *     1. Load static JSON data (the ADVERSARIES / ENVIRONMENTS arrays)
 *     2. Normalise it (handle missing fields, coerce types, assign IDs)
 *     3. Call DataManager.addAdversary() / addEnvironment()
 *   This file replicates that exact pipeline in test code so we can verify
 *   the full chain without needing a running Obsidian instance.
 * 
 * Sections:
 *   1. Add adversary from static list   — mirrors clicking a card in AdvSearch
 *   2. Add environment from static list — mirrors clicking a card in EnvSearch
 *   3. Create custom adversary          — mirrors the AdvModal submit flow
 *   4. Create custom environment        — mirrors the EnvModal submit flow
 *   5. Browser refresh after add        — verifies new items appear in search
 * 
 * Normalisation helpers in this file mirror the logic inside AdvSearch and
 * EnvSearch.  They are intentionally kept here (not imported from the view
 * classes) because the views extend ItemView and can't be instantiated
 * outside Obsidian.
 */

import { DataManager } from '../data/DataManager';
import { SearchEngine } from '../utils/searchEngine';
import { generateAdvUniqueId, generateEnvUniqueId } from '../utils/idGenerator';
import type { AdvData } from '../types/adversary';
import type { EnvironmentData } from '../types/environment';

// ---------------------------------------------------------------------------
// Mock Plugin (same minimal pattern as DataManager.test.ts)
// ---------------------------------------------------------------------------

function createMockPlugin(initialData: any = null) {
    const plugin = {
        _store: initialData,
        async loadData() { return plugin._store; },
        async saveData(data: any) { plugin._store = data; },
    };
    return plugin;
}

async function freshManager() {
    const plugin = createMockPlugin(null);
    const dm = new DataManager(plugin as any);
    await dm.load();
    return dm;
}

// ---------------------------------------------------------------------------
// Normalisation helpers — replicate AdvSearch.normalizeAdversary() and
// EnvSearch.loadEnvironmentData() logic so we can test the same pipeline.
// ---------------------------------------------------------------------------

/**
 * Extracts the base type from a full type string.
 * e.g. "Leader (Umbra-Touched)" → "Leader"
 * 
 * This mirrors AdvSearch.extractBaseType().  We use indexOf + substring
 * instead of the regex in the original because our project convention
 * is to avoid regex (see regex-removal refactor).
 */
function extractBaseType(fullType: string): string {
    const parenIndex = fullType.indexOf('(');
    return parenIndex === -1 ? fullType.trim() : fullType.substring(0, parenIndex).trim();
}

/**
 * Normalises a raw adversary object the same way AdvSearch does before
 * rendering or inserting.  Handles missing fields, type coercion, and
 * ID generation.
 */
interface NormalisedAdversary {
    id: string;
    name: string;
    type: string;
    displayType?: string;
    tier: number;
    desc: string;
    motives: string;
    difficulty: string;
    thresholdMajor: string;
    thresholdSevere: string;
    hp: string;
    stress: string;
    atk: string;
    weaponName: string;
    weaponRange: string;
    weaponDamage: string;
    xp: string;
    features: { name: string; type: string; cost: string; desc: string }[];
    source: string;
    isCustom: boolean;
}

function normaliseAdversary(raw: any): NormalisedAdversary {
    const fullType = raw.type || '';
    const baseType = extractBaseType(fullType);

    return {
        id: raw.id || generateAdvUniqueId(),
        name: raw.name || '',
        type: baseType,
        displayType: fullType !== baseType ? fullType : undefined,
        tier: typeof raw.tier === 'string' ? parseInt(raw.tier, 10) : (raw.tier || 1),
        desc: raw.desc || '',
        motives: raw.motives || '',
        difficulty: raw.difficulty || '',
        thresholdMajor: raw.thresholdMajor || '',
        thresholdSevere: raw.thresholdSevere || '',
        hp: raw.hp || '',
        stress: raw.stress || '0',
        atk: raw.atk || '',
        weaponName: raw.weaponName || '',
        weaponRange: raw.weaponRange || '',
        weaponDamage: raw.weaponDamage || '',
        xp: raw.xp || '',
        features: (raw.features || []).map((f: any) => ({
            name: f.name || '',
            type: f.type || '',
            cost: f.cost || '',
            desc: f.desc || '',
        })),
        source: raw.source || 'core',
        isCustom: raw.isCustom || false,
    };
}

function normaliseEnvironment(raw: any) {
    return {
        id: raw.id || generateEnvUniqueId(),
        name: raw.name || '',
        tier: typeof raw.tier === 'number' ? raw.tier : parseInt(raw.tier, 10),
        type: raw.type || '',
        desc: raw.desc || '',
        impulse: raw.impulse || '',
        difficulty: raw.difficulty || '',
        potentialAdversaries: raw.potentialAdversaries || '',
        source: raw.source || 'core',
        isCustom: raw.isCustom || false,
        features: raw.features || [],
    };
}

// ---------------------------------------------------------------------------
// Static data samples — real entries from the JSON files, copied verbatim
// so these tests break if the data format ever changes.
// ---------------------------------------------------------------------------

const SAMPLE_ADVERSARY_RAW = {
    id: 'CA001',
    name: 'ACID BURROWER',
    tier: '1',
    type: 'Solo',
    desc: 'A horse-sized insect with digging claws and acidic blood.',
    motives: 'Burrow, drag away, feed, reposition',
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
        { name: 'Relentless (3)', type: 'Passive', cost: '', desc: 'The Burrower can be spotlighted up to three times per GM turn.' },
        { name: 'Spit Acid',      type: 'Action',  cost: '', desc: 'Make an attack against all targets in front within Close range.' },
    ],
};

const SAMPLE_ADVERSARY_UMBRA = {
    id: 'UA001',
    name: 'UMBRA WARLORD',
    tier: '3',
    type: 'Leader (Umbra-Touched)',
    desc: 'A warlord twisted by umbral energies.',
    motives: 'Conquer, corrupt',
    difficulty: '18',
    thresholdMajor: '12',
    thresholdSevere: '22',
    hp: '18',
    stress: '8',
    atk: '+5',
    weaponName: 'Shadow Blade',
    weaponRange: 'Close',
    weaponDamage: '2d8+4 phy',
    xp: 'Shadow Step',
    source: 'umbra',
    features: [
        { name: 'Umbral Aura', type: 'Passive', cost: '', desc: 'All allies within Close range gain +1 to attacks.' },
    ],
};

const SAMPLE_ENVIRONMENT_RAW = {
    id: 'CE001',
    name: 'ABANDONED GROVE',
    tier: 1,
    type: 'Exploration',
    desc: 'A former druidic grove lying fallow and fully reclaimed by nature.',
    impulse: 'Draw in the curious, echo the past',
    difficulty: '11',
    potentialAdversaries: 'Beasts (Bear, Dire Wolf)',
    source: 'core',
    features: [
        {
            name: 'Overgrown Battlefield',
            type: 'Passive',
            text: 'There has been a battle here.',
            bullets: ['Traces of a battle litter the ground.', 'A moss-covered trunk is a corpse.'],
            questions: ['Why did these groups come to blows?'],
        },
        {
            name: 'Barbed Vines',
            type: 'Action',
            text: 'Pick a point within the grove. All targets must roll or take damage.',
            bullets: null,
            questions: ['How many vines are there?'],
        },
    ],
};

// ===========================================================================
// 1. Add adversary from static list (browser click simulation)
// ===========================================================================

describe('Browser flow — add adversary from static list', () => {
    it('normalises and stores a core adversary, retrievable by ID', async () => {
        const dm = await freshManager();

        // Step 1: normalise (what AdvSearch does before rendering)
        const normalised = normaliseAdversary(SAMPLE_ADVERSARY_RAW);

        // Step 2: convert to AdvData shape for DataManager
        const advData: AdvData = {
            id: normalised.id,
            name: normalised.name,
            tier: String(normalised.tier),
            type: normalised.displayType || normalised.type,
            desc: normalised.desc,
            motives: normalised.motives,
            difficulty: normalised.difficulty,
            thresholdMajor: normalised.thresholdMajor,
            thresholdSevere: normalised.thresholdSevere,
            hp: normalised.hp,
            stress: normalised.stress,
            atk: normalised.atk,
            weaponName: normalised.weaponName,
            weaponRange: normalised.weaponRange,
            weaponDamage: normalised.weaponDamage,
            xp: normalised.xp,
            source: normalised.source,
            features: normalised.features,
        };

        // Step 3: persist
        await dm.addAdversary(advData);

        // Verify
        const stored = dm.getAdversaries();
        expect(stored).toHaveLength(1);
        expect(stored[0].name).toBe('ACID BURROWER');
        expect(stored[0].id).toBe('CA001');
        expect(stored[0].source).toBe('core');
        expect(stored[0].features).toHaveLength(2);
    });

    it('normalises tier from string to number correctly', () => {
        const normalised = normaliseAdversary(SAMPLE_ADVERSARY_RAW);
        expect(normalised.tier).toBe(1);
        expect(typeof normalised.tier).toBe('number');
    });

    it('splits displayType from base type on Umbra-Touched adversaries', () => {
        const normalised = normaliseAdversary(SAMPLE_ADVERSARY_UMBRA);

        expect(normalised.type).toBe('Leader');
        expect(normalised.displayType).toBe('Leader (Umbra-Touched)');
    });

    it('stores the Umbra adversary with full displayType in the type field for DataManager', async () => {
        const dm = await freshManager();
        const normalised = normaliseAdversary(SAMPLE_ADVERSARY_UMBRA);

        const advData: AdvData = {
            id: normalised.id,
            name: normalised.name,
            tier: String(normalised.tier),
            type: normalised.displayType || normalised.type,  // AdvSearch passes displayType to buildCardHTML
            desc: normalised.desc,
            motives: normalised.motives,
            difficulty: normalised.difficulty,
            thresholdMajor: normalised.thresholdMajor,
            thresholdSevere: normalised.thresholdSevere,
            hp: normalised.hp,
            stress: normalised.stress,
            atk: normalised.atk,
            weaponName: normalised.weaponName,
            weaponRange: normalised.weaponRange,
            weaponDamage: normalised.weaponDamage,
            xp: normalised.xp,
            source: normalised.source,
            features: normalised.features,
        };

        await dm.addAdversary(advData);

        const stored = dm.getAdversaries()[0];
        expect(stored.type).toBe('Leader (Umbra-Touched)');
        expect(stored.source).toBe('umbra');
    });

    it('is findable via searchAdversaries after being added', async () => {
        const dm = await freshManager();
        const normalised = normaliseAdversary(SAMPLE_ADVERSARY_RAW);

        await dm.addAdversary({
            ...normalised,
            tier: String(normalised.tier),
            type: normalised.displayType || normalised.type,
        } as AdvData);

        const results = dm.searchAdversaries('acid');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('ACID BURROWER');
    });
});

// ===========================================================================
// 2. Add environment from static list (browser click simulation)
// ===========================================================================

describe('Browser flow — add environment from static list', () => {
    it('normalises and stores a core environment, retrievable by ID', async () => {
        const dm = await freshManager();
        const normalised = normaliseEnvironment(SAMPLE_ENVIRONMENT_RAW);

        const envData: EnvironmentData = {
            id: normalised.id,
            name: normalised.name,
            tier: normalised.tier,
            type: normalised.type,
            desc: normalised.desc,
            impulse: normalised.impulse,
            difficulty: normalised.difficulty,
            potentialAdversaries: normalised.potentialAdversaries,
            source: normalised.source,
            features: normalised.features,
        };

        await dm.addEnvironment(envData);

        const stored = dm.getEnvironments();
        expect(stored).toHaveLength(1);
        expect(stored[0].name).toBe('ABANDONED GROVE');
        expect(stored[0].id).toBe('CE001');
        expect(stored[0].source).toBe('core');
        expect(stored[0].features).toHaveLength(2);
    });

    it('preserves feature structure including bullets and questions', async () => {
        const dm = await freshManager();
        const normalised = normaliseEnvironment(SAMPLE_ENVIRONMENT_RAW);

        await dm.addEnvironment({
            ...normalised,
        } as EnvironmentData);

        const feature = dm.getEnvironments()[0].features[0];
        expect(feature.name).toBe('Overgrown Battlefield');
        expect(feature.bullets).toHaveLength(2);
        expect(feature.questions).toHaveLength(1);
    });

    it('handles features with null bullets gracefully', async () => {
        const dm = await freshManager();
        const normalised = normaliseEnvironment(SAMPLE_ENVIRONMENT_RAW);

        await dm.addEnvironment({ ...normalised } as EnvironmentData);

        // Second feature has bullets: null
        const feature = dm.getEnvironments()[0].features[1];
        expect(feature.name).toBe('Barbed Vines');
        expect(feature.bullets).toBeNull();
    });

    it('is findable via searchEnvironments after being added', async () => {
        const dm = await freshManager();
        const normalised = normaliseEnvironment(SAMPLE_ENVIRONMENT_RAW);

        await dm.addEnvironment({ ...normalised } as EnvironmentData);

        const results = dm.searchEnvironments('grove');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('ABANDONED GROVE');
    });
});

// ===========================================================================
// 3. Create custom adversary (AdvModal submit flow)
// ===========================================================================

describe('Browser flow — create custom adversary', () => {
    it('saves a custom adversary and assigns a CUA_ id', async () => {
        const dm = await freshManager();

        // This is what buildCustomAdversary() constructs from modal inputs
        const customAdv: AdvData = {
            id: '',
            name: 'My Goblin Chief',
            tier: '2',
            type: 'Leader',
            desc: 'A cunning goblin who commands the tribe.',
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
            features: [
                { name: 'Rally', type: 'Action', cost: 'Mark a Stress', desc: 'All goblin allies gain advantage on their next attack.' },
                { name: 'Cunning', type: 'Passive', cost: '', desc: 'The Chief cannot be surprised.' },
            ],
        };

        await dm.addAdversary(customAdv);

        const stored = dm.getAdversaries()[0];
        expect(stored.id).toMatch(/^CUA_/);
        expect(stored.name).toBe('My Goblin Chief');
        expect(stored.source).toBe('custom');
        expect(stored.features).toHaveLength(2);
    });

    it('custom adversary appears in search immediately after creation', async () => {
        const dm = await freshManager();

        await dm.addAdversary({
            id: '',
            name: 'Shadow Serpent',
            tier: '3',
            type: 'Solo',
            desc: 'A serpent born from darkness.',
            motives: 'Hunt, consume',
            difficulty: '16',
            thresholdMajor: '10',
            thresholdSevere: '20',
            hp: '15',
            stress: '6',
            atk: '+4',
            weaponName: 'Fangs',
            weaponRange: 'Very Close',
            weaponDamage: '2d6+3 phy',
            xp: '',
            source: 'custom',
            features: [],
        });

        expect(dm.searchAdversaries('shadow serpent')).toHaveLength(1);
        expect(dm.searchAdversaries('serpent')).toHaveLength(1);
    });

    it('custom adversary can be updated after creation', async () => {
        const dm = await freshManager();

        const original: AdvData = {
            id: 'CUSTOM_UPDATE_TEST',
            name: 'Draft Creature',
            tier: '1',
            type: 'Standard',
            desc: 'Work in progress.',
            motives: '',
            difficulty: '8',
            thresholdMajor: '4',
            thresholdSevere: '10',
            hp: '5',
            stress: '2',
            atk: '+1',
            weaponName: 'Fists',
            weaponRange: 'Very Close',
            weaponDamage: '1d4 phy',
            xp: '',
            source: 'custom',
            features: [],
        };

        await dm.addAdversary(original);

        // Simulate user editing and saving
        const updated = { ...original, name: 'Finished Creature', desc: 'Fully designed.' };
        await dm.updateAdversary(0, updated);

        const stored = dm.getAdversaries()[0];
        expect(stored.name).toBe('Finished Creature');
        expect(stored.desc).toBe('Fully designed.');
    });

    it('custom adversary can be deleted after creation', async () => {
        const dm = await freshManager();

        await dm.addAdversary({
            id: 'TO_DELETE',
            name: 'Temporary Foe',
            tier: '1',
            type: 'Minion',
            desc: '',
            motives: '',
            difficulty: '6',
            thresholdMajor: '3',
            thresholdSevere: '8',
            hp: '3',
            stress: '1',
            atk: '+1',
            weaponName: 'Claws',
            weaponRange: 'Very Close',
            weaponDamage: '1d4 phy',
            xp: '',
            source: 'custom',
            features: [],
        });

        expect(dm.getAdversaries()).toHaveLength(1);

        await dm.deleteAdversaryById('TO_DELETE');

        expect(dm.getAdversaries()).toHaveLength(0);
    });
});

// ===========================================================================
// 4. Create custom environment (EnvModal submit flow)
// ===========================================================================

describe('Browser flow — create custom environment', () => {
    it('saves a custom environment and assigns a CUE_ id', async () => {
        const dm = await freshManager();

        // This mirrors what EnvModal constructs from its form inputs
        const customEnv: EnvironmentData = {
            id: '',
            name: 'Cursed Lighthouse',
            tier: 2,
            type: 'Exploration',
            desc: 'A lighthouse on a rocky shore that pulses with eerie light.',
            impulse: 'Lure in, unsettle',
            difficulty: '14',
            potentialAdversaries: 'Spectral Sailor, Drowned Wraith',
            source: 'custom',
            features: [
                {
                    name: 'Flickering Beam',
                    type: 'Action',
                    text: 'The lighthouse beam sweeps across the shore. All targets in its path must react or be blinded.',
                    bullets: ['The beam rotates every 30 seconds.', 'Blinded targets take -2 to all rolls.'],
                    questions: ['What causes the beam to flicker?', 'Is there something inside the lighthouse?'],
                },
                {
                    name: 'Salt-Worn Stairs',
                    type: 'Passive',
                    text: 'The spiral staircase inside is slick with sea spray.',
                    bullets: null,
                    questions: ['How many stairs are there?'],
                },
            ],
        };

        await dm.addEnvironment(customEnv);

        const stored = dm.getEnvironments()[0];
        expect(stored.id).toMatch(/^CUE_/);
        expect(stored.name).toBe('Cursed Lighthouse');
        expect(stored.source).toBe('custom');
        expect(stored.features).toHaveLength(2);
    });

    it('custom environment features preserve full structure', async () => {
        const dm = await freshManager();

        await dm.addEnvironment({
            id: '',
            name: 'Structure Test Env',
            tier: 1,
            type: 'Social',
            desc: 'Test.',
            impulse: 'Test',
            difficulty: '10',
            potentialAdversaries: 'None',
            source: 'custom',
            features: [
                {
                    name: 'Complex Feature',
                    type: 'Action',
                    cost: 'Spend a Fear',
                    text: 'Primary description.',
                    bullets: ['Bullet one.', 'Bullet two.', 'Bullet three.'],
                    textAfter: 'Additional context after bullets.',
                    questions: ['Question A?', 'Question B?'],
                },
            ],
        });

        const feature = dm.getEnvironments()[0].features[0];
        expect(feature.name).toBe('Complex Feature');
        expect(feature.cost).toBe('Spend a Fear');
        expect(feature.bullets).toHaveLength(3);
        expect(feature.textAfter).toBe('Additional context after bullets.');
        expect(feature.questions).toHaveLength(2);
    });

    it('custom environment appears in search immediately after creation', async () => {
        const dm = await freshManager();

        await dm.addEnvironment({
            id: '',
            name: 'Crystal Cavern',
            tier: 3,
            type: 'Exploration',
            desc: 'A cavern filled with gemstone formations.',
            impulse: 'Mesmerise, conceal',
            difficulty: '15',
            potentialAdversaries: 'Cave Wyrm',
            source: 'custom',
            features: [],
        });

        expect(dm.searchEnvironments('crystal')).toHaveLength(1);
        expect(dm.searchEnvironments('cavern')).toHaveLength(1);
    });

    it('custom environment can be updated after creation', async () => {
        const dm = await freshManager();

        await dm.addEnvironment({
            id: 'ENV_UPDATE',
            name: 'Draft Location',
            tier: 1,
            type: 'Traversal',
            desc: 'Placeholder.',
            impulse: '',
            difficulty: '8',
            potentialAdversaries: '',
            source: 'custom',
            features: [],
        });

        const updated: EnvironmentData = {
            id: 'ENV_UPDATE',
            name: 'Finished Location',
            tier: 2,
            type: 'Social',
            desc: 'Fully designed village.',
            impulse: 'Engage, inform',
            difficulty: '12',
            potentialAdversaries: 'Bandits',
            source: 'custom',
            features: [],
        };

        await dm.updateEnvironment(0, updated);

        const stored = dm.getEnvironments()[0];
        expect(stored.name).toBe('Finished Location');
        expect(stored.tier).toBe(2);
        expect(stored.type).toBe('Social');
    });

    it('custom environment can be deleted after creation', async () => {
        const dm = await freshManager();

        await dm.addEnvironment({
            id: 'ENV_DEL',
            name: 'Temporary Location',
            tier: 1,
            type: 'Event',
            desc: '',
            impulse: '',
            difficulty: '6',
            potentialAdversaries: '',
            source: 'custom',
            features: [],
        });

        expect(dm.getEnvironments()).toHaveLength(1);

        await dm.deleteEnvironmentById('ENV_DEL');

        expect(dm.getEnvironments()).toHaveLength(0);
    });
});

// ===========================================================================
// 5. Browser refresh — SearchEngine sees new items after DataManager add
// ===========================================================================

describe('Browser flow — search sees items after add', () => {
    it('SearchEngine finds a freshly added adversary when items are refreshed', async () => {
        const dm = await freshManager();
        const engine = new SearchEngine();

        // Initial state: engine is empty (simulates browser before data loads)
        engine.setItems([]);
        expect(engine.search()).toHaveLength(0);

        // User creates a custom adversary
        await dm.addAdversary({
            id: '',
            name: 'Newly Created Beast',
            tier: '2',
            type: 'Solo',
            desc: 'Just appeared.',
            motives: 'Survive',
            difficulty: '12',
            thresholdMajor: '6',
            thresholdSevere: '16',
            hp: '10',
            stress: '4',
            atk: '+3',
            weaponName: 'Claws',
            weaponRange: 'Close',
            weaponDamage: '1d8+2 phy',
            xp: '',
            source: 'custom',
            features: [],
        });

        // Browser refresh: reload items from DataManager into SearchEngine
        engine.setItems(dm.getAdversaries() as any);
        engine.setFilters({ query: 'newly created' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Newly Created Beast');
    });

    it('SearchEngine finds a freshly added environment when items are refreshed', async () => {
        const dm = await freshManager();
        const engine = new SearchEngine();

        engine.setItems([]);
        expect(engine.search()).toHaveLength(0);

        await dm.addEnvironment({
            id: '',
            name: 'Newly Created Marsh',
            tier: 1,
            type: 'Exploration',
            desc: 'A fresh wetland.',
            impulse: 'Explore',
            difficulty: '10',
            potentialAdversaries: '',
            source: 'custom',
            features: [],
        });

        // Browser refresh
        engine.setItems(dm.getEnvironments() as any);
        engine.setFilters({ query: 'marsh' });

        const results = engine.search();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Newly Created Marsh');
    });

    it('SearchEngine excludes deleted items after refresh', async () => {
        const dm = await freshManager();
        const engine = new SearchEngine();

        await dm.addAdversary({
            id: 'WILL_BE_DELETED',
            name: 'Doomed Creature',
            tier: '1',
            type: 'Minion',
            desc: '',
            motives: '',
            difficulty: '6',
            thresholdMajor: '3',
            thresholdSevere: '8',
            hp: '3',
            stress: '1',
            atk: '+1',
            weaponName: 'Bite',
            weaponRange: 'Very Close',
            weaponDamage: '1d4 phy',
            xp: '',
            source: 'custom',
            features: [],
        });

        // First refresh — creature is visible
        engine.setItems(dm.getAdversaries() as any);
        expect(engine.search()).toHaveLength(1);

        // Delete from DataManager
        await dm.deleteAdversaryById('WILL_BE_DELETED');

        // Second refresh — creature is gone
        engine.setItems(dm.getAdversaries() as any);
        expect(engine.search()).toHaveLength(0);
    });

    it('filter state persists across refresh (mirrors AdvSearch.refresh behaviour)', async () => {
        const dm = await freshManager();
        const engine = new SearchEngine();

        // Add two adversaries with different tiers
        await dm.addAdversary({
            id: 'TIER1', name: 'Tier One Guy', tier: '1', type: 'Minion',
            desc: '', motives: '', difficulty: '6', thresholdMajor: '3',
            thresholdSevere: '8', hp: '3', stress: '1', atk: '+1',
            weaponName: 'Fists', weaponRange: 'Very Close', weaponDamage: '1d4 phy',
            xp: '', source: 'custom', features: [],
        });
        await dm.addAdversary({
            id: 'TIER2', name: 'Tier Two Guy', tier: '2', type: 'Solo',
            desc: '', motives: '', difficulty: '12', thresholdMajor: '7',
            thresholdSevere: '15', hp: '10', stress: '4', atk: '+3',
            weaponName: 'Sword', weaponRange: 'Close', weaponDamage: '1d8+2 phy',
            xp: '', source: 'custom', features: [],
        });

        // Coerce tier to number before loading into the engine.
        // This is what AdvSearch.loadAdversaryData() does before handing
        // items to SearchEngine — AdvData stores tier as a string, but
        // matchesTier uses strict equality against the numeric filter value.
        const coerced = dm.getAdversaries().map(a => ({
            ...a,
            tier: Number(a.tier),
        }));

        engine.setItems(coerced as any);
        engine.setFilters({ tier: 1 });

        const beforeRefresh = engine.getFilters();
        expect(engine.search()).toHaveLength(1);

        // Simulate refresh: reload items (coerced again), re-apply saved filters
        engine.setItems(coerced as any);
        engine.setFilters(beforeRefresh);   // restore filters (what AdvSearch.refresh() does)

        expect(engine.search()).toHaveLength(1);
        expect(engine.search()[0].name).toBe('Tier One Guy');
    });
});
