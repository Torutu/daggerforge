const { suspiciousText, audit } = require("../../scripts/check-localization.cjs");

describe("localization review heuristics", () => {
	test("bundled translations contain none of the known suspicious phrases", () => {
		expect(audit()).toEqual([]);
	});
	test("reports English rule phrases and known extraction artifacts", () => {
		expect(suspiciousText("On a success, you can mark a Stress.")).toContain("English rule phrase");
		expect(suspiciousText("Markieren Sie 1 Stress.")).toContain("inconsistent formal imperative");
		expect(suspiciousText("Karte ZXQ123")).toContain("damaged text or translation artifact");
	});
	test("does not flag product names or isolated English proper names", () => {
		for (const text of ["Hope & Fear", "Daggerheart", "Storm", "Markiere 1 Stress und verursache 2W6+3 Schaden."]) {
			expect(suspiciousText(text)).toEqual([]);
		}
	});
});
