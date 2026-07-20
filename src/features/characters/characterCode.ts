import { CharacterData, normalizeCharacter } from "../../types/character";
import { decodeRecordJson, encodeRecordCode } from "../embeds/embedCode";

/**
 * Character codes - a character serialized into a copy-paste friendly string.
 * A player copies the code from their sheet and sends it to their GM, who
 * imports it to get an identical character. The code carries the character's
 * id, so re-importing an updated code refreshes the same character instead of
 * duplicating it.
 *
 * Format: prefix + base64url payload (shared codec in embeds/embedCode.ts).
 *   DHC1. - gzip-compressed JSON (normal case)
 *   DHC0. - plain JSON (fallback when CompressionStream is unavailable)
 *
 * The standalone character-codec/ package mirrors this file for the author's
 * website - keep the wire format in sync.
 */
const CHARACTER_CODE_PREFIX = "DHC";

export async function encodeCharacterCode(character: CharacterData): Promise<string> {
	return encodeRecordCode(CHARACTER_CODE_PREFIX, character);
}

export async function decodeCharacterCode(code: string, fallbackId: string): Promise<CharacterData> {
	const trimmed = code.trim();
	if (!trimmed.startsWith(CHARACTER_CODE_PREFIX + "1.") && !trimmed.startsWith(CHARACTER_CODE_PREFIX + "0.")) {
		throw new Error("Not a DaggerForge character code.");
	}
	return normalizeCharacter(await decodeRecordJson(CHARACTER_CODE_PREFIX, trimmed), fallbackId);
}
