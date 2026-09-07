import { buildCharacterFromChoices } from "../features/characters/creationTemplate";
import {
	ALL_GEAR,
	SRD_ANCESTRIES,
	SRD_CLASSES,
	SRD_COMMUNITIES,
	SRD_DOMAIN_CARDS,
	SRD_TRANSFORMATIONS,
	getSrdClasses,
	getSrdAncestries,
	getSrdCommunities,
	getSrdEquipment,
	getSrdItems,
	getSrdConsumables,
	getBeastforms,
	getSrdDomainCards,
	getSrdTransformations,
	localizeDamageDie,
} from "../data/srd";
import { setLanguage } from "../i18n";
import {
	localizedArmor,
	localizedClassFeature,
	localizedClassSubclass,
	localizedDomainCard,
	localizedHeritageCard,
	localizedHopeFeature,
	localizedWeapon,
} from "../features/characters/localizedCharacter";

describe("ALL_GEAR", () => {
	test("every entry has a unique id and a name", () => {
		const ids = new Set(ALL_GEAR.map((g) => g.id));
		expect(ids.size).toBe(ALL_GEAR.length);
		expect(ALL_GEAR.every((g) => g.name.length > 0)).toBe(true);
		// 192 weapons + 34 armor + 12 wheelchairs + 60 items + 60 consumables
		// 312 weapons + 70 armor + 12 wheelchairs + 121 items + 121 consumables
		expect(ALL_GEAR.length).toBe(636);
	});
});

describe("stable SRD ids", () => {
	test("bundles the complete SRD 2.0 player options", () => {
		expect(SRD_CLASSES).toHaveLength(13);
		expect(SRD_ANCESTRIES).toHaveLength(24);
		expect(SRD_COMMUNITIES).toHaveLength(15);
		expect(SRD_DOMAIN_CARDS).toHaveLength(210);
		expect(SRD_TRANSFORMATIONS).toHaveLength(6);
	});

	test("classes, subclasses, heritages, and domain cards have unique ids", () => {
		const entities = [
			...SRD_CLASSES,
			...SRD_CLASSES.flatMap((item) => item.subclasses),
			...SRD_ANCESTRIES,
			...SRD_COMMUNITIES,
			...SRD_DOMAIN_CARDS,
		];
		const ids = entities.map((item) => item.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test("known ids do not depend on display labels", () => {
		expect(SRD_CLASSES.find((item) => item.name === "Bard")?.id).toBe("class-bard");
		expect(SRD_ANCESTRIES.find((item) => item.name === "Faun")?.id).toBe("ancestry-faun");
		expect(SRD_DOMAIN_CARDS.find((item) => item.name === "Rune Ward")?.id).toBe(
			"domain-card-arcana-1-rune-ward",
		);
	});
});

describe("German SRD data", () => {
	afterEach(() => setLanguage("en"));

	test("localizes Hope & Fear classes, Dread cards, and transformations without changing ids", () => {
		expect(getSrdClasses("de").find((item) => item.id === "class-warlock")?.name).toBe("Paktmagier");
		expect(getSrdDomainCards("de").find((item) => item.id === "domain-card-dread-1-blighting-strike")?.name).toBe("Verheerender Schlag");
		expect(getSrdTransformations("de").find((item) => item.id === "transformation-demigod")?.name).toBe("Halbgott");
	});

	test("localizes every core player-data record without changing ids or mechanical values", () => {
		const sameIds = (english: Array<{ id: string }>, german: Array<{ id: string }>) =>
			expect(german.map((item) => item.id)).toEqual(english.map((item) => item.id));

		sameIds(SRD_ANCESTRIES, getSrdAncestries("de"));
		sameIds(SRD_COMMUNITIES, getSrdCommunities("de"));
		sameIds(getSrdItems("en"), getSrdItems("de"));
		sameIds(getSrdConsumables("en"), getSrdConsumables("de"));

		const enEquipment = getSrdEquipment("en");
		const deEquipment = getSrdEquipment("de");
		for (const group of ["weapons", "armor", "wheelchairs"] as const) {
			sameIds(enEquipment[group], deEquipment[group]);
		}
		expect(deEquipment.weapons.map(({ tier, trait, range, damage, damageType, burden }) =>
			({ tier, trait, range, damage, damageType, burden }))).toEqual(
			enEquipment.weapons.map(({ tier, trait, range, damage, damageType, burden }) =>
				({ tier, trait, range, damage, damageType, burden })),
		);
		expect(deEquipment.armor.map(({ tier, minor, major, score }) =>
			({ tier, minor, major, score }))).toEqual(
			enEquipment.armor.map(({ tier, minor, major, score }) =>
				({ tier, minor, major, score })),
		);

		const enForms = getBeastforms("en");
		const deForms = getBeastforms("de");
		expect(deForms).toHaveLength(enForms.length);
		expect(deForms.map(({ tier, traitMod, evasionMod, attackMod, attackDamage }) => ({
			tier, traitMod, evasionMod, attackMod,
			attackDamage: attackDamage ? attackDamage.replace(/^W/, "d") : null,
		}))).toEqual(enForms.map(({ tier, traitMod, evasionMod, attackMod, attackDamage }) =>
			({ tier, traitMod, evasionMod, attackMod, attackDamage })));

		const enClasses = getSrdClasses("en").slice(0, 9);
		const deClasses = getSrdClasses("de").slice(0, 9);
		sameIds(enClasses, deClasses);
		expect(deClasses.map(({ id, stats, subclasses }) => ({
			id, evasion: stats.evasion, hp: stats.hp,
			subclassIds: subclasses.map((subclass) => subclass.id),
		}))).toEqual(enClasses.map(({ id, stats, subclasses }) => ({
			id, evasion: stats.evasion, hp: stats.hp,
			subclassIds: subclasses.map((subclass) => subclass.id),
		})));
	});

	test("creates a German core character with localized starting equipment", () => {
		setLanguage("de");
		const char = buildCharacterFromChoices({ classId: "class-bard" }, "CHR_core_de");
		expect(char.classSubclass).toBe("Bard*in");
		expect(char.primaryWeapon.name).toBe("Rapier");
		expect(char.primaryWeapon.id).toBe("WP069");
		expect(char.primaryWeapon.traitRange).toBe("Präsenz - Unmittelbar");
		expect(char.primaryWeapon.damageDice).toBe("W8 phy");
		expect(char.activeArmor.name).toBe("Textilrüstung");
		expect(char.activeArmor.id).toBe("AR001");
	});

	test("localizes every dice prefix without changing the stored mechanic", () => {
		expect(localizeDamageDie("2d8+2 phy", "de")).toBe("2W8+2 phy");
		expect(localizeDamageDie("2d8+2 phy", "en")).toBe("2d8+2 phy");
	});

	test("creates a German Hope & Fear character with a transformation snapshot", () => {
		setLanguage("de");
		const char = buildCharacterFromChoices({
			classId: "class-warlock",
			subclassId: "subclass-warlock-pact-of-the-endless",
			transformationId: "transformation-demigod",
			domainCardIds: ["domain-card-dread-1-blighting-strike"],
		}, "CHR_de");
		expect(char.classSubclass).toContain("Paktmagier");
		expect(char.transformationCard?.name).toBe("Halbgott");
		expect(char.domainCards[0]?.name).toBe("Verheerender Schlag");
	});

	test("resolves an English character in German without mutating its stored snapshots", () => {
		setLanguage("en");
		const char = buildCharacterFromChoices(
			{
				classId: "class-bard",
				subclassId: "subclass-bard-troubadour",
				ancestryId: "ancestry-faun",
				communityId: "community-wildborne",
				domainCardIds: ["domain-card-arcana-1-rune-ward"],
			},
			"CHR_live_language",
		);
		const stored = structuredClone(char);

		expect(localizedClassSubclass(char, "de")).not.toBe(char.classSubclass);
		expect(localizedHopeFeature(char, "de")).not.toBe(char.hopeFeature);
		expect(localizedClassFeature(char, "de")).not.toBe(char.classFeature);
		expect(
			localizedHeritageCard(char.ancestryCard, "ancestry", "de")?.features,
		).not.toBe(char.ancestryCard?.features);
		expect(localizedDomainCard(char.domainCards[0], "de").name).not.toBe(
			char.domainCards[0].name,
		);
		expect(localizedWeapon(char.primaryWeapon, "de").id).toBe(char.primaryWeapon.id);
		expect(localizedArmor(char.activeArmor, "de").id).toBe(char.activeArmor.id);
		expect(char).toEqual(stored);
	});

	test("keeps user-authored and legacy snapshots static", () => {
		const char = buildCharacterFromChoices({ classId: "class-bard" }, "CHR_custom_text");
		char.classFeature = "My custom feature";
		char.customSrdFields.classFeature = true;
		char.primaryWeapon = {
			name: "My custom weapon",
			traitRange: "Special",
			damageDice: "X",
			feature: "Custom",
		};
		expect(localizedClassFeature(char, "de")).toBe("My custom feature");
		expect(localizedWeapon(char.primaryWeapon, "de")).toBe(char.primaryWeapon);
	});
});

describe("buildCharacterFromChoices", () => {
	test("full Bard/Troubadour build autofills the sheet from SRD data", () => {
		const char = buildCharacterFromChoices(
			{
				classId: "class-bard",
				subclassId: "subclass-bard-troubadour",
				ancestryId: "ancestry-faun",
				communityId: "community-wildborne",
				experiences: ["Raised by wolves", "Herbalist's apprentice"],
				domainCardIds: [
					"domain-card-arcana-1-rune-ward",
					"domain-card-sage-1-gifted-tracker",
				],
			},
			"CHR_test",
		);

		expect(char.id).toBe("CHR_test");
		expect(char.level).toBe("1");
		expect(char.classSubclass).toBe("Bard - Troubadour");
		expect(char.classId).toBe("class-bard");
		expect(char.subclassId).toBe("subclass-bard-troubadour");
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

		// Rapier: Presence - Melee, d8 phy, one-handed; Small Dagger secondary
		expect(char.primaryWeapon.name).toBe("Rapier");
		expect(char.primaryWeapon.traitRange).toBe("Presence - Melee");
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
		const char = buildCharacterFromChoices({ classId: "class-warrior" }, "CHR_w");
		expect(char.classSubclass).toBe("Warrior");
		expect(char.evasion).not.toBe("");
		expect(char.classFeature).not.toContain("foundation");
	});

	test("mixed ancestry combines first feature of one with second feature of the other", () => {
		const char = buildCharacterFromChoices(
			{ ancestryId: "ancestry-clank", ancestryId2: "ancestry-faun", communityId: "community-wildborne" },
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

	test("empty second ancestry id falls back to single ancestry", () => {
		const char = buildCharacterFromChoices(
			{ ancestryId: "ancestry-faun", ancestryId2: "" },
			"CHR_single",
		);
		expect(char.ancestryCard?.name).toBe("Faun");
	});

	test("unknown ids are ignored gracefully", () => {
		const char = buildCharacterFromChoices(
			{ classId: "class-nonsense", ancestryId: "ancestry-nope", domainCardIds: ["domain-card-missing"] },
			"CHR_x",
		);
		expect(char.classSubclass).toBe("");
		expect(char.ancestryCard).toBeNull();
		expect(char.domainCards).toEqual([]);
	});
});
