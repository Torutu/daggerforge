import {
	buildEmbedBlock,
	generateInstanceToken,
	parseEmbedParams,
} from "../features/embeds/blockParams";

describe("embed block params", () => {
	test("parses id, instance, and count lines", () => {
		expect(parseEmbedParams("id: VA013\ninstance: k3x9f2\ncount: 3")).toEqual({
			id: "VA013",
			instance: "k3x9f2",
			count: 3,
		});
	});

	test("parses with extra whitespace and missing optional lines", () => {
		expect(parseEmbedParams("  id :  CUE_123_ab  ")).toEqual({
			id: "CUE_123_ab",
			instance: null,
			count: null,
		});
	});

	test("accepts bare bundled and custom ids", () => {
		expect(parseEmbedParams("VA013").id).toBe("VA013");
		expect(parseEmbedParams("CHR_1699_ab12").id).toBe("CHR_1699_ab12");
		expect(parseEmbedParams("CUA_1699_ab12").id).toBe("CUA_1699_ab12");
	});

	test("ignores junk lines and invalid counts", () => {
		expect(parseEmbedParams("hello world\ncount: -2\ncount: x\nid: CE001")).toEqual({
			id: "CE001",
			instance: null,
			count: null,
		});
	});

	test("first occurrence wins for duplicates", () => {
		expect(parseEmbedParams("id: CA001\nid: CA002").id).toBe("CA001");
	});

	test("returns nulls for empty source", () => {
		expect(parseEmbedParams("")).toEqual({ id: null, instance: null, count: null });
	});

	test("build → parse round-trips", () => {
		const block = buildEmbedBlock("daggerforge-adversary", {
			id: "VA013",
			instance: "abc123",
			count: 3,
		});
		const source = block.split("\n").slice(1, -2).join("\n");
		expect(parseEmbedParams(source)).toEqual({ id: "VA013", instance: "abc123", count: 3 });
	});

	test("build omits count of 1 and missing instance", () => {
		const block = buildEmbedBlock("daggerforge-environment", { id: "CE001", count: 1 });
		expect(block).toBe("```daggerforge-environment\nid: CE001\n```\n");
	});

	test("instance tokens are short and unique-ish", () => {
		const a = generateInstanceToken();
		const b = generateInstanceToken();
		expect(a).toMatch(/^[a-z0-9]{4,10}$/);
		expect(a).not.toBe(b);
	});
});
