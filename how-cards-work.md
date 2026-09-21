# How the cards work

## The old problem

Inserting a card used to paste its full HTML straight into the note's text.
It looked like a clean card sitting there, right up until you touched it.
Tick an HP box, click to expand a feature, anything, and Obsidian would drop
out of the rendered view and show you the raw HTML underneath: tags,
classes, all of it, right in the middle of a session. The illusion broke
the moment you interacted with it. On top of that, every pasted copy was
frozen (fixing a typo in a monster fixed nothing already pasted), and
editing meant scraping HTML back out of the note by hand.

## The fix: store a reference, not the card

A card is just data (name, tier, HP, features). The HTML is only how that
data looks. So now the note stores a tiny pointer instead:

````
```daggerforge-adversary
id: VA013
```
````

## The four functions that make it work

Using the adversary card as the example (`src/features/adversaries/AdversaryEmbed.ts`):

**1. `registerAdversaryEmbed(plugin)` - "claims" the block name**

Runs once when the plugin starts. It tells Obsidian: *"whenever you see a
code block written as `daggerforge-adversary`, don't show it as text, give
it to me instead."* This is the one line that does that:

```ts
plugin.registerMarkdownCodeBlockProcessor("daggerforge-adversary", callback)
```

**2. `parseEmbedParams(source)` - reads the `id: VA013` line**

Every time that block appears, Obsidian calls the callback with the raw text
inside the fence (`id: VA013`). This function just reads that text and pulls
out the id (and a couple of other small settings, like `count:`).

**3. `findAdversaryById(plugin, id)` - looks up the real data**

Takes the id (`VA013`) and finds the matching adversary: checks your custom
adversaries first, then the built-in list. Returns the full data (name,
HP, features, everything) or nothing if it doesn't exist.

**4. `buildCardHTML(data)` - draws the card**

Takes that data and turns it into HTML, right there in memory. That HTML is
inserted into the note's view. `styles.css` then makes it look like a card.

## Putting the four together

```
Obsidian sees the block
        │
        ▼
registerAdversaryEmbed  →  "this is mine, don't just print the text"
        │
        ▼
parseEmbedParams        →  reads "id: VA013" out of the block
        │
        ▼
findAdversaryById        →  looks up VA013, returns its data
        │
        ▼
buildCardHTML             →  turns that data into HTML on screen
```

The HTML from step 4 never gets saved back into the note. It's redrawn
every time the block is shown. That's why editing an adversary instantly
updates every card that uses its id, and why the note itself stays three
short lines instead of a wall of HTML.

## Why touching the card no longer breaks the illusion

The old cards broke because the HTML was sitting directly in the note's
text. Click on it, and you're clicking on text, so Obsidian shows you that
text.

The new cards aren't text sitting in the note. `registerAdversaryEmbed`
tells Obsidian to treat that block as its own separate little widget,
disconnected from the note's source. When you tick a box or click a
button, you're clicking on that widget, not on the note itself, so there's
no HTML underneath for Obsidian to fall back to. You can tick, click, and
interact with it freely and it just stays a card.

## Two small extras

- **Copies don't share HP.** Each insert also gets a random `instance:`
  line. Tick marks are saved under that instance, so two cards of the same
  goblin track damage separately even though they share one id.
- **The `code:` line is a backup copy of the data itself**, folded into one
  safe-to-paste line (used for your own custom cards, since they live only
  on your device). If the id can't be found, the plugin unfolds `code:`
  back into data and draws the card from that instead.
