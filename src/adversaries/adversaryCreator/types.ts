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