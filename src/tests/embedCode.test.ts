import {
	decodeAdversaryCode,
	decodeEnvironmentCode,
	decodeGearCode,
	encodeAdversaryCode,
	encodeEnvironmentCode,
	encodeGearCode,
} from "../features/embeds/embedCode";
import { AdvData, EnvironmentData, GearData } from "../types/index";

const adversary: AdvData = {
	id: "CUA_1700_ab12",
	name: "Rotfang Alpha",
	tier: "2",
	type: "Bruiser",
	desc: "A scarred pack leader.",
	motives: "Protect the den, drag off stragglers",
	difficulty: "14",
	thresholdMajor: "9",
	thresholdSevere: "19",
	hp: "6",
	stress: "4",
	atk: "+2",
	weaponName: "Jaws",
	weaponRange: "Melee",
	weaponDamage: "2d8+3 phy",
	xp: "",
	count: "5",
	source: "custom",
	features: [
		{ name: "Pack Tactics", type: "Passive", cost: "", richContent: "<p>+2 when allies are close.</p>" },
	],
};

const environment: EnvironmentData = {
	id: "CUE_1700_cd34",
	name: "Collapsing Mine",
	tier: "1",
	type: "Event",
	desc: "The supports groan.",
	impulses: "Bury, separate, entomb",
	difficulty: "12",
	potentialAdversaries: "Rockmaws",
	source: "custom",
	features: [
		{ name: "Cave-in", type: "Action", richContent: "<p>Countdown (4).</p>", questions: [] },
	],
} as unknown as EnvironmentData;

const gear: GearData = {
	id: "CUI_1700_ef56",
	kind: "item",
	name: "Glowstone Pendant",
	tier: null,
	rarity: "Rare",
	meta: "Relic",
	text: "Sheds light in Close range.",
	source: "custom",
};

describe("embed codes", () => {
	test("adversary round-trips and keeps count", async () => {
		const code = await encodeAdversaryCode(adversary);
		expect(code).toMatch(/^DFA[01]\.[A-Za-z0-9_-]+$/);
		expect(await decodeAdversaryCode(code!)).toEqual(adversary);
	});

	test("environment round-trips", async () => {
		const code = await encodeEnvironmentCode(environment);
		expect(code).toMatch(/^DFE[01]\.[A-Za-z0-9_-]+$/);
		expect(await decodeEnvironmentCode(code!)).toEqual(environment);
	});

	test("gear round-trips", async () => {
		const code = await encodeGearCode(gear);
		expect(code).toMatch(/^DFG[01]\.[A-Za-z0-9_-]+$/);
		expect(await decodeGearCode(code!)).toEqual(gear);
	});

	test("decoding returns null for junk, corruption, and wrong prefixes", async () => {
		expect(await decodeAdversaryCode("hello world")).toBeNull();
		const advCode = await encodeAdversaryCode(adversary);
		expect(await decodeAdversaryCode(advCode!.slice(0, 10) + "!!bad!!")).toBeNull();
		// An environment code is not an adversary code
		const envCode = await encodeEnvironmentCode(environment);
		expect(await decodeAdversaryCode(envCode!)).toBeNull();
	});

	test("decoded records are coerced to a safe shape", async () => {
		const code = await encodeAdversaryCode({ name: "Bare", features: "junk" } as unknown as AdvData);
		const decoded = await decodeAdversaryCode(code!);
		expect(decoded?.id).toBe("");
		expect(decoded?.features).toEqual([]);
		const nameless = await encodeAdversaryCode({} as AdvData);
		expect(await decodeAdversaryCode(nameless!)).toBeNull();
	});
});
