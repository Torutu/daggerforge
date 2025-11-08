import coreAdv from "adversaries/coreAdv.json";

// Combine all adversaries into one flat array
export const ADVERSARIES = [
	...coreAdv
];

export type AdversaryData = (typeof coreAdv)[0];