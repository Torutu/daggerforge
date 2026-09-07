/** @jest-environment jsdom */

import React, { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { setLanguage } from "../i18n";
import { useLocalizedSrd } from "../data/useLocalizedSrd";

describe("live language switching", () => {
	afterEach(() => setLanguage("en"));

	test("updates localized SRD text without remounting the component", () => {
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
			.IS_REACT_ACT_ENVIRONMENT = true;
		const container = document.createElement("div");
		const root = createRoot(container);
		let mounts = 0;

		function Probe() {
			const { classes } = useLocalizedSrd();
			useEffect(() => {
				mounts += 1;
			}, []);
			return React.createElement(
				"span",
				null,
				classes.find((item) => item.id === "class-bard")?.name,
			);
		}

		act(() => root.render(React.createElement(Probe)));
		expect(container.textContent).toBe("Bard");

		act(() => setLanguage("de"));
		expect(container.textContent).toBe("Bard*in");

		act(() => setLanguage("en"));
		expect(container.textContent).toBe("Bard");
		expect(mounts).toBe(1);

		act(() => root.unmount());
	});
});
