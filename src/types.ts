export interface CardData {
    name: string;
    tier: string;
    type: string;
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
    features: Feature[];
}

export type Feature = {
    name: string;
    type: string;
    cost: string;
    desc: string;
};

export type FormInputs = {
    [key: string]: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
};

export type FeatureElements = {
    nameEl: HTMLInputElement;
    typeEl: HTMLSelectElement;
    costEl: HTMLSelectElement;
    descEl: HTMLTextAreaElement;
};

export type SavedFeatureState = {
    featureName: string;
    featureType: string;
    featureCost: string;
    featureDesc: string;
};