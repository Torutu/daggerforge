# daggerheart-character-codec

Encode/decode Daggerheart character sheets into shareable text codes - the
same format used by [DaggerForge](https://github.com/Torutu/daggerforge)'s
Obsidian character sheet. A code produced by the plugin decodes correctly
here, and vice versa, since it's the exact same logic.

Zero dependencies. Only standard browser APIs (`TextEncoder`/`TextDecoder`,
`CompressionStream`, `Blob`/`Response`, `btoa`/`atob`) - no Obsidian, no
Node-specific APIs. Drops straight into a React, plain HTML/TS, or any other
browser-based project.

## Files

- `types.ts` - the `CharacterData` shape (name, traits, HP/stress/hope,
  weapons, armor, inventory, notes, …), slot-count constants, and
  `normalizeCharacter()` for safely coercing untrusted/imported data.
- `codec.ts` - `encodeCharacterCode()` / `decodeCharacterCode()`.
- `index.ts` - re-exports both.

## Install

There's no build step - just copy this folder into your project (e.g.
`src/lib/character-codec/`) and import from it directly. Any bundler that
handles `.ts` files (Vite, webpack, Next.js, CRA) will pick it up as-is.

```ts
import { encodeCharacterCode, decodeCharacterCode, createEmptyCharacter } from "./lib/character-codec";
```

## Usage

### Encode - "Copy code" button

```tsx
import { useState } from "react";
import { encodeCharacterCode, type CharacterData } from "./lib/character-codec";

function CopyCodeButton({ character }: { character: CharacterData }) {
	const [copied, setCopied] = useState(false);

	const handleClick = async () => {
		const code = await encodeCharacterCode(character);
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return <button onClick={handleClick}>{copied ? "Copied!" : "Copy code"}</button>;
}
```

### Decode - "Import code" form

```tsx
import { useState } from "react";
import { decodeCharacterCode, type CharacterData } from "./lib/character-codec";

function ImportCodeForm({ onImport }: { onImport: (character: CharacterData) => void }) {
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleImport = async () => {
		try {
			// Any string works as the fallback id - it's only used if the
			// code itself doesn't carry one (it always does in practice).
			const character = await decodeCharacterCode(code, crypto.randomUUID());
			onImport(character);
			setError(null);
		} catch {
			setError("That doesn't look like a valid character code.");
		}
	};

	return (
		<div>
			<textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste a character code (DHC1.…)" />
			<button onClick={handleImport} disabled={!code.trim()}>Import</button>
			{error && <p>{error}</p>}
		</div>
	);
}
```

### Starting a blank character

```ts
import { createEmptyCharacter } from "./lib/character-codec";

const character = createEmptyCharacter(crypto.randomUUID());
character.name = "Théa Bramblefoot";
character.traits.agility.value = "+1";
```

## Notes

- **Ids and re-imports**: every `CharacterData` has an `id`. Importing a code
  whose id matches a character you already have should be treated as an
  *update* to that character, not a new one - that's what lets a player send
  an updated code and have it refresh in place rather than duplicate.
- **Browser support**: `CompressionStream`/`DecompressionStream` are
  available in all current browsers (Chrome 80+, Firefox 113+, Safari
  16.4+). If unavailable, `encodeCharacterCode` automatically falls back to
  an uncompressed `DHC0.` code - `decodeCharacterCode` handles both prefixes
  transparently, so you don't need to branch on it yourself.
- **Untrusted input**: always decode through `decodeCharacterCode` (which
  calls `normalizeCharacter` internally) rather than `JSON.parse`-ing a code
  yourself - it fills in defaults for missing fields and clamps array
  lengths to the sheet's slot counts, so a malformed or hand-edited code
  can't produce a broken character shape.
- **Keeping in sync**: this is a copy of the same code used in the
  DaggerForge plugin (`src/types/character.ts` and
  `src/features/characters/characterCode.ts`). If the sheet's fields ever
  change in one place, mirror the change here too so codes stay compatible
  both ways.
- **Format history**: DaggerForge 2.5.0 added `ancestryCard`,
  `communityCard`, and `domainCards` to `CharacterData` (mirrored here).
  Old codes still decode - the fields default to empty - and codes made
  with these fields simply lose them when decoded by an older reader.
