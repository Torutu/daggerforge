import { getAdversaries } from "../data/adversaries";
import { getEnvironments } from "../data/environments";

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
});
