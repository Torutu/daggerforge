export type AdvData = {
	id: string;
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
	count?: string;
	source?: string;
	features: Feature[];
};

export type FeatureElements = {
	nameEl: HTMLInputElement;
	typeEl: HTMLSelectElement;
	costEl: HTMLSelectElement;
	descEl: HTMLTextAreaElement;
};

export type Feature = {
	name: string;
	type: string;
	cost: string;
	desc: string;
};