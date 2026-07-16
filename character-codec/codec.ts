import { CharacterData, normalizeCharacter } from "./types";

/**
 * Character codes — a character serialized into a copy-paste friendly string.
 * A player copies the code from their sheet and sends it to their GM, who
 * imports it to get an identical character. The code carries the character's
 * id, so re-importing an updated code refreshes the same character instead of
 * duplicating it.
 *
 * Format: prefix + base64url payload.
 *   DHC1. — gzip-compressed JSON (normal case)
 *   DHC0. — plain JSON (fallback when CompressionStream is unavailable)
 *
 * Uses only standard browser APIs (TextEncoder/Decoder, CompressionStream,
 * Blob/Response, btoa/atob) — no Obsidian or Node-specific dependency, so it
 * runs as-is in any modern browser (React, plain HTML/TS, etc). Codes
 * produced by one runtime decode correctly in the other.
 */
const COMPRESSED_PREFIX = "DHC1.";
const PLAIN_PREFIX = "DHC0.";

export async function encodeCharacterCode(character: CharacterData): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(character));
	if (typeof CompressionStream === "undefined") {
		return PLAIN_PREFIX + bytesToBase64Url(bytes);
	}
	const compressed = await transformBytes(bytes, new CompressionStream("gzip"));
	return COMPRESSED_PREFIX + bytesToBase64Url(compressed);
}

export async function decodeCharacterCode(code: string, fallbackId: string): Promise<CharacterData> {
	const trimmed = code.trim();
	let json: string;

	if (trimmed.startsWith(COMPRESSED_PREFIX)) {
		if (typeof DecompressionStream === "undefined") {
			throw new Error("This platform cannot read compressed character codes.");
		}
		const bytes = base64UrlToBytes(trimmed.slice(COMPRESSED_PREFIX.length));
		json = new TextDecoder().decode(await transformBytes(bytes, new DecompressionStream("gzip")));
	} else if (trimmed.startsWith(PLAIN_PREFIX)) {
		json = new TextDecoder().decode(base64UrlToBytes(trimmed.slice(PLAIN_PREFIX.length)));
	} else {
		throw new Error("Not a DaggerForge character code.");
	}

	return normalizeCharacter(JSON.parse(json), fallbackId);
}

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
