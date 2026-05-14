export type EnvFeatureElements = {
	nameEl: HTMLInputElement;
	typeEl: HTMLSelectElement;
	costEl?: HTMLSelectElement;
	richEditor: { getHTML(): string; destroy(): void };
	questionEls: HTMLTextAreaElement[];
};

export type EnvSavedFeatureState = {
	name: string;
	type: string;
	cost?: string;
	richContent: string;
	questions: string[];
};

export type EnvironmentData = {
	id: string;
	name: string;
	tier: string;
	type: string;
	desc: string;
	impulse: string;
	difficulty: string;
	potentialAdversaries: string;
	source?: string;
	features: EnvironmentFeature[];
};

type EnvironmentFeature = {
	name: string;
	type: string;
	cost?: string;
	richContent: string;
	questions: string[];
};
