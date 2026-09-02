import {
	getLanguage,
	setLanguage,
	subscribeLanguage,
	translate,
} from "../i18n";

describe("i18n", () => {
	afterEach(() => setLanguage("en"));

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
