export type FormInputs = Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

export type FeatureElements = {
	nameEl: HTMLInputElement;
	typeEl: HTMLSelectElement;
	costEl?: HTMLSelectElement;
	textEl: HTMLTextAreaElement;
	bulletEls: HTMLTextAreaElement[];
	questionEls: HTMLTextAreaElement[];
};

export type SavedFeatureState = {
	name: string;
	type: string;
	cost?: string;
	text: string;
	bullets: string[];
	questions: string[];
};

export type EnvironmentData = {
    name: string;
    tier: number;
    type: string;
    desc: string;
    impulse: string;
    difficulty: string;
    potentialAdversaries: string;
    features: EnvironmentFeature[];
}

type EnvironmentFeature = {
    name: string;
    type: string;
    text: string;
    cost?: string;
    bullets: string[];
    questions: string[];
}
