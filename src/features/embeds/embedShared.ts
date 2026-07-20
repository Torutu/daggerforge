import { EmbedParams } from "./blockParams";

/**
 * Bits shared by the adversary and environment card embeds.
 */

/** Stable identity key for one placed embed - drives all localStorage card
 *  state (ticks/collapse/wide/countdowns). Prefixed so it can never collide
 *  with the random UUIDs baked into legacy inline HTML cards. */
export function embedStateKey(params: EmbedParams): string {
	return "df-embed-" + (params.instance ?? params.id ?? "unknown");
}

/** Placeholder shown when an embed's id doesn't resolve to any stored record. */
export function renderMissingEmbed(el: HTMLElement, kind: string, id: string | null): void {
	const box = el.createDiv({ cls: "df-cs-missing" });
	box.createEl("p", { text: `${kind} not found`, cls: "df-cs-missing-title" });
	if (id) box.createEl("code", { text: id, cls: "df-cs-missing-id" });
	box.createEl("p", {
		text: `It may have been deleted, or this vault doesn't have it. Check the id against the content browser.`,
		cls: "df-cs-missing-hint",
	});
}

/**
 * Rewrites the `id:` line of one specific embed block inside file content.
 * The block is located textually by its fence language, old id, and (when
 * present) instance token - precise enough to touch exactly one block.
 * Returns the updated content, or null when the block wasn't found.
 */
export function repointEmbedBlock(
	content: string,
	language: string,
	oldId: string,
	instance: string | null,
	newId: string,
): string | null {
	const fence = new RegExp(
		"```" + language + "\\r?\\n([\\s\\S]*?)```",
		"g",
	);
	let result: string | null = null;

	const updated = content.replace(fence, (whole, body: string) => {
		if (result !== null) return whole; // only repoint the first match
		const idLine = new RegExp("(^|\\n)(\\s*id\\s*:\\s*)" + escapeRegExp(oldId) + "(\\s*)(?=\\r?\\n|$)");
		if (!idLine.test(body)) return whole;
		if (instance && !new RegExp("(^|\\n)\\s*instance\\s*:\\s*" + escapeRegExp(instance) + "\\s*(\\r?\\n|$)").test(body)) {
			return whole;
		}
		const newBody = body.replace(idLine, `$1$2${newId}$3`);
		result = "found";
		return "```" + language + "\n" + newBody + "```";
	});

	return result ? updated : null;
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
