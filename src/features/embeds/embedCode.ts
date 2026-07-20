import { AdvData, EnvironmentData, GearData } from "../../types/index";

/**
 * Self-contained payloads for embed blocks. Custom records live in this
 * vault's plugin data.json, which many sync setups don't carry - so on a
 * synced device the embed's id would resolve to nothing. Inserting a custom
 * record therefore stamps a `code:` line into the block: the record
 * serialized in the same copy-paste-safe format as character share codes
 * (gzip JSON + base64url behind a versioned prefix). Embed renderers fall
 * back to this snapshot when the id is missing locally; the stored record
 * always wins when present, and editing a snapshot-rendered card saves it
 * into the local vault.
 *
 * Prefixes: DFA (adversary), DFE (environment), DFG (gear/items),
 * DHC (characters - the same code the Copy code button produces).
 * "<prefix>1." = gzip-compressed, "<prefix>0." = plain JSON fallback.
 */

export async function encodeRecordCode(prefixBase: string, value: unknown): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(value));
	if (typeof CompressionStream === "undefined") {
		return prefixBase + "0." + bytesToBase64Url(bytes);
	}
	const compressed = await transformBytes(bytes, new CompressionStream("gzip"));
	return prefixBase + "1." + bytesToBase64Url(compressed);
}

export async function decodeRecordJson(prefixBase: string, code: string): Promise<unknown> {
	const trimmed = code.trim();
	let json: string;

	if (trimmed.startsWith(prefixBase + "1.")) {
		if (typeof DecompressionStream === "undefined") {
			throw new Error("This platform cannot read compressed codes.");
		}
		const bytes = base64UrlToBytes(trimmed.slice(prefixBase.length + 2));
		json = new TextDecoder().decode(await transformBytes(bytes, new DecompressionStream("gzip")));
	} else if (trimmed.startsWith(prefixBase + "0.")) {
		json = new TextDecoder().decode(base64UrlToBytes(trimmed.slice(prefixBase.length + 2)));
	} else {
		throw new Error(`Not a DaggerForge ${prefixBase} code.`);
	}

	return JSON.parse(json);
}

/** Encode that never throws - a failed snapshot just means no `code:` line. */
export async function tryEncodeRecordCode(prefixBase: string, value: unknown): Promise<string | undefined> {
	try {
		return await encodeRecordCode(prefixBase, value);
	} catch (error) {
		console.error("DaggerForge: failed to encode embed payload", error);
		return undefined;
	}
}

// ==================== TYPED WRAPPERS ====================

export const ADVERSARY_CODE_PREFIX = "DFA";
export const ENVIRONMENT_CODE_PREFIX = "DFE";
export const GEAR_CODE_PREFIX = "DFG";

export function encodeAdversaryCode(adv: AdvData): Promise<string | undefined> {
	return tryEncodeRecordCode(ADVERSARY_CODE_PREFIX, adv);
}

/** null on any failure - a bad snapshot falls through to the missing-embed placeholder. */
export async function decodeAdversaryCode(code: string): Promise<AdvData | null> {
	try {
		const raw = (await decodeRecordJson(ADVERSARY_CODE_PREFIX, code)) as Partial<AdvData>;
		if (!raw || typeof raw !== "object" || typeof raw.name !== "string" || !raw.name) return null;
		return {
			...raw,
			id: String(raw.id ?? ""),
			features: Array.isArray(raw.features) ? raw.features : [],
		} as AdvData;
	} catch {
		return null;
	}
}

export function encodeEnvironmentCode(env: EnvironmentData): Promise<string | undefined> {
	return tryEncodeRecordCode(ENVIRONMENT_CODE_PREFIX, env);
}

export async function decodeEnvironmentCode(code: string): Promise<EnvironmentData | null> {
	try {
		const raw = (await decodeRecordJson(ENVIRONMENT_CODE_PREFIX, code)) as Partial<EnvironmentData>;
		if (!raw || typeof raw !== "object" || typeof raw.name !== "string" || !raw.name) return null;
		return {
			...raw,
			id: String(raw.id ?? ""),
			features: Array.isArray(raw.features) ? raw.features : [],
		} as EnvironmentData;
	} catch {
		return null;
	}
}

export function encodeGearCode(gear: GearData): Promise<string | undefined> {
	return tryEncodeRecordCode(GEAR_CODE_PREFIX, gear);
}

export async function decodeGearCode(code: string): Promise<GearData | null> {
	try {
		const raw = (await decodeRecordJson(GEAR_CODE_PREFIX, code)) as Partial<GearData>;
		if (!raw || typeof raw !== "object" || typeof raw.name !== "string" || !raw.name) return null;
		return { ...raw, id: String(raw.id ?? "") } as GearData;
	} catch {
		return null;
	}
}

// ==================== BYTE HELPERS ====================

async function transformBytes(
	bytes: Uint8Array,
	transform: { readable: ReadableStream; writable: WritableStream },
): Promise<Uint8Array> {
	const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = "";
	// Chunked to stay under the argument-count limit of String.fromCharCode
	for (let i = 0; i < bytes.length; i += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(text: string): Uint8Array {
	const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
