import {
	buildCharacterEmbedBlock,
	parseCharacterEmbedId,
} from "../features/characters/CharacterSheetEmbed";

describe("character embed blocks", () => {
	test("build → parse round-trips the id", () => {
		const block = buildCharacterEmbedBlock("CHR_123_abc");
		// The processor receives the source without the fence lines
		const source = block.split("\n").slice(1, -2).join("\n");
		expect(parseCharacterEmbedId(source)).toBe("CHR_123_abc");
	});

	test("parses id line with extra whitespace", () => {
		expect(parseCharacterEmbedId("  id :  CHR_x9  ")).toBe("CHR_x9");
	});

	test("parses a bare character id", () => {
		expect(parseCharacterEmbedId("CHR_1699999999_ab12cd34")).toBe("CHR_1699999999_ab12cd34");
	});

	test("ignores unknown lines and returns the first id", () => {
		expect(parseCharacterEmbedId("title: whatever\nid: CHR_first\nid: CHR_second")).toBe("CHR_first");
	});

	test("returns null when no id is present", () => {
		expect(parseCharacterEmbedId("")).toBeNull();
		expect(parseCharacterEmbedId("just some text")).toBeNull();
	});
});
