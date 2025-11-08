import coreAdv from "adversaries/coreAdv.json";

export const ADVERSARIES = [
	...coreAdv
];

export type AdversaryData = (typeof coreAdv)[0];