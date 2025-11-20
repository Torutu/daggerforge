import type { FormInputs } from './shared';

export type FeatureElements = {
	nameEl: HTMLInputElement;
	typeEl: HTMLSelectElement;
	costEl?: HTMLSelectElement;
	textEl: HTMLTextAreaElement;
	bulletEls: HTMLInputElement[];
	afterTextEl: HTMLTextAreaElement;
	questionEls: HTMLTextAreaElement[];
};

export type SavedFeatureState = {
	name: string;
	type: string;
	cost?: string;
	text: string;
	bullets: string[] | null;
	textAfter?: string;
	questions: string[];
};

export type EnvironmentData = {
	id: string;
	name: string;
	tier: number;
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
	text: string;
	cost?: string;
	bullets: string[] | null;
	textAfter?: string;
	questions: string[];
};
