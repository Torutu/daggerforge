import {
	getLanguage,
	setLanguage,
	subscribeLanguage,
	translate,
} from "../i18n";
import { en } from "../i18n/locales/en";
import { de } from "../i18n/locales/de";
import { gameTerm } from "../i18n/gameTerms";

describe("i18n", () => {
	afterEach(() => setLanguage("en"));

	test("English and German have exactly the same nonempty keys and interpolation parameters", () => {
		expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
		const parameters = (text: string) => [...text.matchAll(/\{([a-zA-Z]\w*)\}/g)].map(m => m[1]).sort();
		for (const key of Object.keys(en) as Array<keyof typeof en>) {
			expect(de[key].trim().length).toBeGreaterThan(0);
			expect(parameters(de[key])).toEqual(parameters(en[key]));
		}
	});

	test("game labels change with the language but unknown custom names stay unchanged", () => {
		setLanguage("de");
		expect(gameTerm("Leader")).toBe("Anführer");
		expect(gameTerm("Very Close")).toBe("Sehr kurz");
		expect(gameTerm("Horde (5/HP)")).toBe("Horde (5/HP)");
		expect(gameTerm("My custom creature")).toBe("My custom creature");
		setLanguage("en");
		expect(gameTerm("Leader")).toBe("Leader");
	});

	test("uses English by default", () => {
		expect(getLanguage()).toBe("en");
		expect(translate("wizard.next")).toBe("Next");
	});

	test("switches to German", () => {
		setLanguage("de");
		expect(translate("wizard.next")).toBe("Weiter");
		expect(translate("wizard.title")).toBe("Geführte Charaktererstellung");
	});

	test("interpolates named values", () => {
		setLanguage("de");
		expect(translate("wizard.class.meta", { evasion: 10, hp: 6 })).toBe(
			"Ausweichen 10 · TP 6",
		);
	});

	test("notifies subscribers only when the language changes", () => {
		const listener = jest.fn();
		const unsubscribe = subscribeLanguage(listener);

		setLanguage("en");
		setLanguage("de");
		setLanguage("de");
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		setLanguage("en");
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
