import { embedStateKey, repointEmbedBlock } from "../features/embeds/embedShared";
import { addTextNodeToCanvasJson } from "../features/embeds/insertDestination";

describe("embedStateKey", () => {
	test("prefers the instance token, falls back to the id", () => {
		expect(embedStateKey({ id: "VA013", instance: "abc", count: null })).toBe("df-embed-abc");
		expect(embedStateKey({ id: "VA013", instance: null, count: null })).toBe("df-embed-VA013");
	});
});

describe("repointEmbedBlock", () => {
	const note = [
		"# Session notes",
		"```daggerforge-adversary",
		"id: VA013",
		"instance: aaa111",
		"```",
		"some text",
		"```daggerforge-adversary",
		"id: VA013",
		"instance: bbb222",
		"```",
	].join("\n");

	test("repoints only the block with the matching instance", () => {
		const updated = repointEmbedBlock(note, "daggerforge-adversary", "VA013", "bbb222", "CUA_9_x");
		expect(updated).not.toBeNull();
		expect(updated).toContain("instance: aaa111");
		expect(updated).toContain("id: VA013"); // first block untouched
		expect(updated).toContain("id: CUA_9_x");
		expect((updated!.match(/id: CUA_9_x/g) ?? []).length).toBe(1);
	});

	test("without instance, repoints the first matching block", () => {
		const updated = repointEmbedBlock(note, "daggerforge-adversary", "VA013", null, "CUA_9_x");
		const firstBlock = updated!.indexOf("CUA_9_x");
		const secondId = updated!.indexOf("VA013");
		expect(firstBlock).toBeGreaterThan(-1);
		expect(secondId).toBeGreaterThan(firstBlock);
	});

	test("returns null when nothing matches", () => {
		expect(repointEmbedBlock(note, "daggerforge-adversary", "CA999", null, "CUA_9_x")).toBeNull();
		expect(repointEmbedBlock(note, "daggerforge-environment", "VA013", null, "CUA_9_x")).toBeNull();
		expect(repointEmbedBlock(note, "daggerforge-adversary", "VA013", "zzz", "CUA_9_x")).toBeNull();
	});

	test("does not touch other params or surrounding text", () => {
		const updated = repointEmbedBlock(note, "daggerforge-adversary", "VA013", "aaa111", "CUA_1_y")!;
		expect(updated).toContain("# Session notes");
		expect(updated).toContain("some text");
		expect(updated).toContain("instance: aaa111");
		expect(updated).toContain("instance: bbb222");
	});
});

describe("addTextNodeToCanvasJson", () => {
	test("creates a node in an empty or blank canvas", () => {
		const result = JSON.parse(addTextNodeToCanvasJson("", "hello", { width: 400, height: 300 }));
		expect(result.nodes).toHaveLength(1);
		expect(result.edges).toEqual([]);
		expect(result.nodes[0]).toMatchObject({ type: "text", text: "hello", x: 0, y: 0, width: 400, height: 300 });
		expect(result.nodes[0].id).toMatch(/^[0-9a-f]{16}$/);
	});

	test("positions the new node below existing nodes", () => {
		const existing = JSON.stringify({
			nodes: [
				{ id: "a", type: "text", text: "x", x: 100, y: 50, width: 200, height: 100 },
				{ id: "b", type: "text", text: "y", x: -20, y: 300, width: 200, height: 120 },
			],
			edges: [],
		});
		const result = JSON.parse(addTextNodeToCanvasJson(existing, "new", { width: 460, height: 620 }));
		expect(result.nodes).toHaveLength(3);
		const added = result.nodes[2];
		expect(added.x).toBe(-20); // left-aligned with the leftmost node
		expect(added.y).toBe(300 + 120 + 40); // below the lowest node + gap
	});

	test("tolerates invalid JSON by starting fresh", () => {
		const result = JSON.parse(addTextNodeToCanvasJson("{oops", "hello", { width: 10, height: 10 }));
		expect(result.nodes).toHaveLength(1);
	});
});
