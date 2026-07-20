/**
 * Shared helpers for DaggerForge embed code blocks. Every embed language
 * (daggerforge-character / -adversary / -environment) uses the same
 * `key: value` line format inside the fence:
 *
 *   ```daggerforge-adversary
 *   id: VA013
 *   instance: k3x9f2
 *   count: 3
 *   ```
 *
 * `id` - the stored record's id (bare ids are also accepted for hand-written
 * blocks). `instance` - random token stamped at insert time so multiple
 * embeds of the same record keep independent tick/collapse state. `count` -
 * adversary-only, renders that many HP/stress rows (battle groups). `code` -
 * serialized snapshot of a custom record (see embedCode.ts) so the card
 * renders even in vaults whose plugin data doesn't contain the record.
 */

export interface EmbedParams {
	id: string | null;
	instance: string | null;
	count: number | null;
	code: string | null;
}

export function parseEmbedParams(source: string): EmbedParams {
	const params: EmbedParams = { id: null, instance: null, count: null, code: null };

	for (const line of source.split("\n")) {
		const keyed = line.match(/^\s*(id|instance|count|code)\s*:\s*(\S+)\s*$/);
		if (keyed) {
			const [, key, value] = keyed;
			if (key === "id" && params.id === null) params.id = value;
			else if (key === "instance" && params.instance === null) params.instance = value;
			else if (key === "code" && params.code === null) params.code = value;
			else if (key === "count" && params.count === null) {
				const n = Number(value);
				if (Number.isInteger(n) && n > 0) params.count = n;
			}
			continue;
		}
		// Tolerate a bare id line for hand-written blocks. Real id schemes only:
		// CHR_/CUA_/CUE_/CUI_ customs, or bundled codes like VA013 / IT007.
		const bare = line.match(/^\s*((?:CHR|CUA|CUE|CUI)_\S+|[A-Z]{2}\d{3})\s*$/);
		if (bare && params.id === null) params.id = bare[1];
	}

	return params;
}

export function buildEmbedBlock(
	language: string,
	params: { id: string; instance?: string; count?: number; code?: string },
): string {
	let body = `id: ${params.id}\n`;
	if (params.instance) body += `instance: ${params.instance}\n`;
	if (params.count && params.count > 1) body += `count: ${params.count}\n`;
	if (params.code) body += `code: ${params.code}\n`;
	return "```" + language + "\n" + body + "```\n";
}

/** Short random token identifying one placed embed instance. */
export function generateInstanceToken(): string {
	return Math.random().toString(36).slice(2, 10);
}
