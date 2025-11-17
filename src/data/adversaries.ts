import advCore from "adv/advcore.json";
import advInc from "adv/advinc.json";
import advVoid from "adv/advvoid.json";

export const ADVERSARIES = [
	...advCore,
	...advInc,
	...advVoid,
];

export type AdversaryData = (typeof advCore)[0];