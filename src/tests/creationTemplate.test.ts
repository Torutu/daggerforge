import { buildCharacterFromChoices } from "../features/characters/creationTemplate";
import { ALL_GEAR } from "../data/srd";

describe("ALL_GEAR", () => {
	test("every entry has a unique id and a name", () => {
		const ids = new Set(ALL_GEAR.map((g) => g.id));
		expect(ids.size).toBe(ALL_GEAR.length);
		expect(ALL_GEAR.every((g) => g.name.length > 0)).toBe(true);
		// 192 weapons + 34 armor + 12 wheelchairs + 60 items + 60 consumables
		expect(ALL_GEAR.length).toBe(358);
	});
});

describe("buildCharacterFromChoices", () => {
	test("full Bard/Troubadour build autofills the sheet from SRD data", () => {
		const char = buildCharacterFromChoices(
			{
				className: "Bard",
				subclassName: "Troubadour",
				ancestryName: "Faun",
				communityName: "Wildborne",
				experiences: ["Raised by wolves", "Herbalist's apprentice"],
				domainCardNames: ["Rune Ward", "Gifted Tracker"],
			},
			"CHR_test",
		);

		expect(char.id).toBe("CHR_test");
		expect(char.level).toBe("1");
		expect(char.classSubclass).toBe("Bard — Troubadour");
		expect(char.heritage).toBe("Faun Wildborne");
		expect(char.evasion).toBe("10");

		// Suggested traits "0, -1, +1, 0, +2, +1" in printed order
		expect(char.traits.agility.value).toBe("0");
		expect(char.traits.strength.value).toBe("-1");
		expect(char.traits.finesse.value).toBe("+1");
		expect(char.traits.instinct.value).toBe("0");
		expect(char.traits.presence.value).toBe("+2");
		expect(char.traits.knowledge.value).toBe("+1");

		// 2 starting Hope, 1 handful of gold
		expect(char.hope).toEqual([true, true, false, false, false, false]);
		expect(char.goldHandfuls.filter(Boolean)).toHaveLength(1);

		expect(char.hopeFeature).toContain("Make a Scene");
		expect(char.classFeature).toContain("Rally:");
		expect(char.classFeature).toContain("Spellcast Trait: Presence");
		expect(char.classFeature).toContain("(Troubadour foundation)");
		expect(char.notes).toBe("Max HP: 5 (Bard)");
		expect(char.inventory).toContain("Torch");
		expect(char.inventory).toContain("Class items:");

		// Rapier: Presence — Melee, d8 phy, one-handed; Small Dagger secondary
		expect(char.primaryWeapon.name).toBe("Rapier");
		expect(char.primaryWeapon.traitRange).toBe("Presence — Melee");
		expect(char.primaryWeapon.damageDice).toBe("d8 phy");
		expect(char.weaponHandOne).toBe(true);
		expect(char.secondaryWeapon.name).toBe("Small Dagger");
		expect(char.weaponHandTwo).toBe(true);

		// Gambeson Armor: 5/11 base, score 3 → thresholds 6/12 at level 1
		expect(char.activeArmor.name).toBe("Gambeson Armor");
		expect(char.activeArmor.baseThresholds).toBe("5 / 11");
		expect(char.armorScore).toBe("3");
		expect(char.majorThreshold).toBe("6");
		expect(char.severeThreshold).toBe("12");

		expect(char.ancestryCard?.name).toBe("Faun");
		expect(char.communityCard?.name).toBe("Wildborne");
		expect(char.domainCards.map((c) => c.name)).toEqual(["Rune Ward", "Gifted Tracker"]);
		expect(char.domainCards.every((c) => !c.inVault)).toBe(true);

		expect(char.experiences[0]).toEqual({ text: "Raised by wolves", modifier: "+2" });
		expect(char.experiences[1]).toEqual({ text: "Herbalist's apprentice", modifier: "+2" });
		expect(char.experiences[2]).toEqual({ text: "", modifier: "" });
	});

	test("skipped steps leave those parts blank", () => {
		const char = buildCharacterFromChoices({}, "CHR_blankish");
		expect(char.level).toBe("1");
		expect(char.classSubclass).toBe("");
		expect(char.heritage).toBe("");
		expect(char.ancestryCard).toBeNull();
		expect(char.domainCards).toEqual([]);
		expect(char.hope).toEqual([true, true, false, false, false, false]);
	});

	test("class without subclass still applies class stats", () => {
		const char = buildCharacterFromChoices({ className: "Warrior" }, "CHR_w");
		expect(char.classSubclass).toBe("Warrior");
		expect(char.evasion).not.toBe("");
		expect(char.classFeature).not.toContain("foundation");
	});

	test("mixed ancestry combines first feature of one with second feature of the other", () => {
		const char = buildCharacterFromChoices(
			{ ancestryName: "Clank", ancestryName2: "Faun", communityName: "Wildborne" },
			"CHR_mix",
		);
		expect(char.ancestryCard?.name).toBe("Clank / Faun");
		// Clank's first feature + Faun's second feature
		expect(char.ancestryCard?.features).toContain("Purposeful Design");
		expect(char.ancestryCard?.features).not.toContain("Efficient");
		const faunSecond = char.ancestryCard?.features.split("\n\n")[1] ?? "";
		expect(faunSecond).not.toContain("Caprine Leap");
		expect(char.heritage).toBe("Clank / Faun Wildborne");
	});

	test("empty second ancestry name falls back to single ancestry", () => {
		const char = buildCharacterFromChoices(
			{ ancestryName: "Faun", ancestryName2: "" },
			"CHR_single",
		);
		expect(char.ancestryCard?.name).toBe("Faun");
	});

	test("unknown names are ignored gracefully", () => {
		const char = buildCharacterFromChoices(
			{ className: "Nonsense", ancestryName: "Nope", domainCardNames: ["Missing Card"] },
			"CHR_x",
		);
		expect(char.classSubclass).toBe("");
		expect(char.ancestryCard).toBeNull();
		expect(char.domainCards).toEqual([]);
	});
});
