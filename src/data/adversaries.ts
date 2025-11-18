import advCore from "./adv/advcore.json";
import advVoid from "./adv/advvoid.json";

export const ADVERSARIES = [
	...advCore,
	...advVoid,
];

export type AdversaryData = (typeof advCore)[0];