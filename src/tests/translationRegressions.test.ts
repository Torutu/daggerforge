import { getAdversaries } from "../data/adversaries";
import { getEnvironments } from "../data/environments";
import { getSrdAncestries, getSrdClasses, getSrdCommunities, getSrdDomainCards } from "../data/srd";

describe("German rule translation regressions", () => {
	const adversary = (id: string, feature: number) => getAdversaries("de").find(a => a.id === id)!.features[feature].richContent;
	test("restores previously omitted effects, costs, damage and recovery", () => {
		expect(adversary("SA007", 2)).toContain("Sobald das Ziel freikommt, muss es 1 Stress markieren");
		expect(adversary("CA003", 3)).toContain("2W6+3 direkten physischen Schaden");
		expect(adversary("CA006", 1)).toContain("kritischen Schaden");
		expect(adversary("HF-A042", 4)).toContain("Markiere 1 Stress, um einen Marker");
		expect(adversary("HF-A075", 1)).toContain("Heile ebenso viele TP");
		expect(adversary("UA015", 5)).toContain("2W10+8 physischen Schaden");
	});
	test("Gobstalker retains all ten ray effects", () => {
		const text = adversary("VA006", 2);
		for (let i = 1; i <= 10; i++) expect(text).toContain(`${i}. `);
		expect(text).toContain("verdopple den Schaden");
		expect(text).toContain("schlafähnliche Trance");
		expect(text).toContain("eine Rast beendet");
	});
	test("siege countdown decreases on assault and increases on Major damage", () => {
		const text = getEnvironments("de").find(e => e.id === "CE017")!.features[4].richContent;
		expect(text).toContain("verringere den Countdown um 1");
		expect(text).toContain("schweren oder höheren Schaden, erhöhe den Countdown um 1");
	});

	test("Hope & Fear heritages include the complete SRD 2.0 background text", () => {
		const aetheris = getSrdAncestries("de").find(item => item.id === "ancestry-aetheris")!;
		const reborne = getSrdCommunities("de").find(item => item.id === "community-reborne")!;
		expect(aetheris.description).toHaveLength(2);
		expect(aetheris.description.join(" ")).toContain("Himmlischen Hallen");
		expect(reborne.description).toHaveLength(4);
		expect(reborne.description.join(" ")).toContain("jenseits des Schleiers");
	});

	test("uses the corrected final English Hope & Fear rules", () => {
		const warlock = getSrdClasses("en").find(item => item.id === "class-warlock")!;
		const brawler = getSrdClasses("en").find(item => item.id === "class-brawler")!;
		const witch = getSrdClasses("en").find(item => item.id === "class-witch")!;
		expect(warlock.classFeatures.find(feature => feature.name === "Favor")!.description).toContain("maximum Favor");
		expect(brawler.subclasses.find(item => item.name === "Martial Artist")!.foundation[0].description).not.toContain("implementation");
		expect(witch.subclasses.find(item => item.name === "Moon")!.mastery[0].description).toContain("Roll | Phase | Effect");
		expect(getSrdDomainCards("en").find(item => item.name === "Avatar of Terror")!.type).toBe("Spell");
	});
});
