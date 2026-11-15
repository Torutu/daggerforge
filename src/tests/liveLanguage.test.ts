import { getLanguage, Language, setLanguage, subscribeLanguage } from "../i18n";
import { getSrdClasses } from "../data/srd";

// Tests must not render UI (see CLAUDE.md), so this covers the two pieces the
// live switch is built from: the language store that useLocalizedSrd subscribes
// to, and the localized getters it re-reads when that store changes.
describe("live language switching", () => {
	afterEach(() => setLanguage("en"));

	test("notifies subscribers once per actual language change", () => {
		const seen: Language[] = [];
		const unsubscribe = subscribeLanguage(() => seen.push(getLanguage()));

		setLanguage("de");
		setLanguage("de");
		setLanguage("en");
		unsubscribe();
		setLanguage("de");

		expect(seen).toEqual(["de", "en"]);
	});

	test("localized SRD getters follow the language while ids stay stable", () => {
		const bardName = (language: Language) =>
			getSrdClasses(language).find((item) => item.id === "class-bard")?.name;

		expect(bardName("en")).toBe("Bard");
		expect(bardName("de")).toBe("Bard*in");
		expect(bardName("en")).toBe("Bard");
	});
});
