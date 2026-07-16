import { decodeCharacterCode, encodeCharacterCode } from "../features/characters/characterCode";
import {
	ARMOR_SLOTS,
	createEmptyCharacter,
	EXPERIENCE_ROWS,
	HOPE_SLOTS,
	HP_SLOTS,
	normalizeCharacter,
	STRESS_SLOTS,
} from "../types/character";

describe("character codes", () => {
	function sampleCharacter() {
		const char = createEmptyCharacter("CHR_test_1");
		char.name = "Théa of the Sablewood";
		char.pronouns = "she/her";
		char.classSubclass = "Druid — Warden of the Elements";
		char.level = "3";
		char.traits.agility = { value: "+2", marked: true };
		char.hp[0] = true;
		char.hp[3] = true;
		char.hope = [true, true, false, false, false, false];
		char.goldChest = true;
		char.primaryWeapon = {
			name: "Shortstaff",
			traitRange: "Instinct — Close",
			damageDice: "d8+1 mag",
			feature: "Reliable: +1 to attack rolls",
		};
		char.notes = "Owes the innkeeper 3 gold.\nAfraid of deep water.";
		char.ancestryCard = {
			name: "Faun",
			description: "Fauns resemble humanoid goats…",
			features: "Caprine Leap: You can leap anywhere within Close range.",
		};
		char.communityCard = {
			name: "Wildborne",
			description: "Wildborne communities live deep within the forest.",
			features: "Lightfoot: Your movement is naturally silent.",
		};
		char.domainCards = [
			{
				name: "Rune Ward",
				domain: "Arcana",
				level: 1,
				type: "Spell",
				recallCost: 0,
				text: "You have a deeply personal trinket…",
				inVault: false,
			},
			{
				name: "Wall Walk",
				domain: "Arcana",
				level: 1,
				type: "Spell",
				recallCost: 1,
				text: "**Spend a Hope** to allow a creature you can touch to climb walls.",
				inVault: true,
			},
		];
		return char;
	}

	test("round-trips a character through encode/decode", async () => {
		const original = sampleCharacter();
		const code = await encodeCharacterCode(original);
		const decoded = await decodeCharacterCode(code, "CHR_fallback");
		expect(decoded).toEqual(original);
	});

	test("codes are copy-paste safe (single token, base64url charset)", async () => {
		const code = await encodeCharacterCode(sampleCharacter());
		expect(code).toMatch(/^DHC[01]\.[A-Za-z0-9_-]+$/);
	});

	test("decode tolerates surrounding whitespace", async () => {
		const code = await encodeCharacterCode(sampleCharacter());
		const decoded = await decodeCharacterCode(`  ${code}\n`, "CHR_fallback");
		expect(decoded.name).toBe("Théa of the Sablewood");
	});

	test("rejects text that is not a character code", async () => {
		await expect(decodeCharacterCode("hello world", "CHR_x")).rejects.toThrow(
			"Not a DaggerForge character code.",
		);
	});

	test("rejects a corrupted payload", async () => {
		const code = await encodeCharacterCode(sampleCharacter());
		await expect(
			decodeCharacterCode(code.slice(0, 12) + "!!corrupted!!", "CHR_x"),
		).rejects.toThrow();
	});
});

describe("normalizeCharacter", () => {
	test("fills defaults for missing fields and keeps the id", () => {
		const result = normalizeCharacter({ id: "CHR_keep", name: "Bram" }, "CHR_fallback");
		expect(result.id).toBe("CHR_keep");
		expect(result.name).toBe("Bram");
		expect(result.hp).toHaveLength(HP_SLOTS);
		expect(result.stress).toHaveLength(STRESS_SLOTS);
		expect(result.hope).toHaveLength(HOPE_SLOTS);
		expect(result.armorSlots).toHaveLength(ARMOR_SLOTS);
		expect(result.experiences).toHaveLength(EXPERIENCE_ROWS);
		expect(result.inventoryWeapons).toHaveLength(2);
		expect(result.notes).toBe("");
	});

	test("uses the fallback id when none is present", () => {
		expect(normalizeCharacter({}, "CHR_fallback").id).toBe("CHR_fallback");
	});

	test("defaults sheet settings when missing and clamps junk values", () => {
		const missing = normalizeCharacter({}, "CHR_x").sheetSettings;
		expect(missing).toEqual({
			massiveDamage: false,
			maxHp: 5,
			maxStress: 6,
			maxHope: 6,
			experienceRows: 5,
			goldMode: "standard",
			goldLabel: "Gold",
			currencies: [],
			layoutMode: "auto",
		});
		expect(
			normalizeCharacter({ sheetSettings: { layoutMode: "sideways" } }, "CHR_x").sheetSettings.layoutMode,
		).toBe("auto");
		expect(
			normalizeCharacter({ sheetSettings: { layoutMode: "wide" } }, "CHR_x").sheetSettings.layoutMode,
		).toBe("wide");

		const junk = normalizeCharacter(
			{
				sheetSettings: {
					massiveDamage: "yes",
					maxHp: 99,
					maxStress: 0,
					maxHope: "x",
					experienceRows: 2,
					goldMode: "weird",
					goldLabel: "",
					currencies: [{ name: "Credits", amount: 5 }, { name: "", amount: "" }, "junk"],
				},
			},
			"CHR_x",
		).sheetSettings;
		expect(junk.massiveDamage).toBe(false);
		expect(junk.maxHp).toBe(12);
		expect(junk.maxStress).toBe(1);
		expect(junk.maxHope).toBe(6);
		expect(junk.experienceRows).toBe(5);
		expect(junk.goldMode).toBe("standard");
		expect(junk.goldLabel).toBe("Gold");
		expect(junk.currencies).toEqual([{ name: "Credits", amount: "" }]);
	});

	test("max hope above 6 pads the hope slots to full strips of 6", () => {
		const result = normalizeCharacter(
			{ sheetSettings: { maxHope: 8 }, hope: [true, true, true] },
			"CHR_x",
		);
		expect(result.sheetSettings.maxHope).toBe(8);
		expect(result.hope).toHaveLength(12); // two strips of 6
		expect(result.hope.slice(0, 3)).toEqual([true, true, true]);
		// clamp cap
		expect(normalizeCharacter({ sheetSettings: { maxHope: 99 } }, "CHR_x").sheetSettings.maxHope).toBe(24);
	});

	test("experience rows setting drives the experiences array length", () => {
		const result = normalizeCharacter(
			{
				sheetSettings: { experienceRows: 8 },
				experiences: [{ text: "kept", modifier: "+2" }],
			},
			"CHR_x",
		);
		expect(result.experiences).toHaveLength(8);
		expect(result.experiences[0]).toEqual({ text: "kept", modifier: "+2" });
		expect(result.experiences[7]).toEqual({ text: "", modifier: "" });
	});

	test("defaults heritage and domain cards when missing", () => {
		const result = normalizeCharacter({ id: "CHR_old" }, "CHR_fallback");
		expect(result.ancestryCard).toBeNull();
		expect(result.communityCard).toBeNull();
		expect(result.domainCards).toEqual([]);
	});

	test("coerces junk domain cards and drops nameless ones", () => {
		const result = normalizeCharacter(
			{
				ancestryCard: { name: "Faun", description: 5, features: null },
				communityCard: { description: "no name, dropped" },
				domainCards: [
					{ name: "Rune Ward", domain: "Arcana", level: "x", recallCost: "y", inVault: "yes" },
					{ text: "nameless, dropped" },
					"not an object",
				],
			},
			"CHR_fallback",
		);
		expect(result.ancestryCard).toEqual({ name: "Faun", description: "", features: "" });
		expect(result.communityCard).toBeNull();
		expect(result.domainCards).toEqual([
			{ name: "Rune Ward", domain: "Arcana", level: 1, type: "", recallCost: 0, text: "", inVault: false },
		]);
	});

	test("truncates oversized arrays and coerces junk values", () => {
		const result = normalizeCharacter(
			{
				hp: new Array(40).fill(true),
				hope: ["yes", 1, true],
				level: 5,
				traits: { agility: { value: 2, marked: "yes" } },
			},
			"CHR_fallback",
		);
		expect(result.hp).toHaveLength(HP_SLOTS);
		expect(result.hp.every((v) => v === true)).toBe(true);
		expect(result.hope).toEqual([false, false, true, false, false, false]);
		expect(result.level).toBe("");
		expect(result.traits.agility).toEqual({ value: "", marked: false });
	});
});
