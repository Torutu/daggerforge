# DaggerForge

A toolkit for **Daggerheart**, the TTRPG, inside Obsidian. Drop adversaries, environments and items into your session notes, build your own, plan battles with the rulebook's Battle Guide, roll dice, and let players create and keep their characters in the same vault.

## Features

### Game Master tools

- **Content browser**: a sidebar with tabs for adversaries, environments, characters and items. Search, then filter by tier, source and type, with live counts on each filter.
- **Bundled content**: 160+ adversaries and 25+ environments from the SRD and the Void, Umbra and Sablewood sets, plus SRD items.
- **One-click insert**: add any card to the note or canvas you were last working in. In edit mode it goes at your cursor, in reading mode it is appended to the note, and on a canvas it becomes a card.
- **Battle calculator**: follows the Battle Guide. Set the party size, apply the difficulty adjustments, spend battle points on adversary slots, get suggestions filtered by tier and source, then insert the whole encounter at once.
- **Content creator**: build your own adversaries, environments and items with a rich-text feature editor. Edit them later straight from the card.

### Cards that work at the table

- **Trackers**: HP and stress boxes on adversary cards that are remembered between sessions. Use the `count` option to get one set of trackers per creature in a group.
- **Clickable dice**: any dice expression in a card's text (like `2d6+4`) becomes a button that rolls it and shows the result.
- **Countdowns**: environment countdowns can be ticked down and rolled directly from the card.
- **Potential adversaries**: click an adversary named on an environment card to insert its card right below the environment.
- **Keyword highlighting**: game terms such as hope, fear, hp and stress are colored. You can turn this off in the settings.
- **Collapse and wide mode**: collapse a card to save space, or switch it to a wide layout.

### Player characters

- **Character sheet** based on the official fillable PDF, with tracks, inventory, notes and customizable sections. Open it as a sidebar or embed it in a note or canvas.
- **Guided creation**: Class, Subclass, Ancestry, Community, Experiences, Domain Cards and Review, using the SRD classes, ancestries, communities and domain cards.
- **Character codes**: copy a code from the sheet and send it to your GM. The GM imports it to get an identical character, and importing an updated code refreshes the same character instead of duplicating it.
- **Guide pages** built into the sheet: Background and Connections, the Level Up Guide, Druid Beastforms and Ranger Companion management.

### Dice roller

Queue up any mix of dice, roll them all at once, and review the roll history. Open it from the ribbon menu or the command palette.

## Installation

To install a release by hand:

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Torutu/daggerforge/releases/latest).
2. Put them in a folder named `daggerforge` inside your vault's `.obsidian/plugins/` folder.
3. Reload Obsidian and enable **DaggerForge** under Settings, Community plugins.

It requires Obsidian 1.8.10 or newer and works on desktop and mobile.

## How to use

Once you enable the plugin, click the scroll icon in the left ribbon to open the DaggerForge menu.

<img width="207" height="428" alt="The DaggerForge icon in Obsidian's left ribbon" src="https://github.com/user-attachments/assets/94d840a5-f73a-4939-8de5-fd34f096baba" />

You can also press `ctrl + p` and search for `daggerforge`. The available commands are:

| Command | What it does |
| --- | --- |
| Open content browser | Browse everything in one sidebar |
| Open adversary / environment / character / item browser | Jump straight to one tab |
| Open content creator | Choose what to create |
| Adversary creator, Environment creator, Item creator | Open a creator directly |
| Open character sheet | Open your character in the sidebar |
| Insert character sheet into note or canvas | Embed a character |
| Open dice roller | Roll dice with a history log |
| Open battle calculator | Plan an encounter |
| Import data from JSON file | Merge adversaries and environments from a file |
| Delete data file | Remove your saved custom content (asks first) |

### Embeds

Cards are stored in your notes as code blocks, so they render live and keep their own tracker state. You can also write them by hand:

````
```daggerforge-adversary
id: VA013
count: 3
```
````

The languages are `daggerforge-adversary`, `daggerforge-environment`, `daggerforge-item` and `daggerforge-character`. Custom cards carry a snapshot of their data, so a note shared to another vault still renders.

### Settings

Under Settings, DaggerForge you can turn keyword highlighting on or off and choose how long a roll result stays visible.

### Your data

Custom adversaries, environments, items and characters are saved in the plugin's `data.json` in your vault, so they sync like any other vault file. Use **Import data from JSON file** to merge in adversaries and environments, and character codes to share characters.

## What's new in 3.0

A complete Daggerheart character system including creation, sharing, embeds, items, GM tools, and guide pages. See the [releases](https://github.com/Torutu/daggerforge/releases) for the full change list.

## Feedback

Have an idea or found a bug? Open an issue at [github.com/Torutu/daggerforge/issues](https://github.com/Torutu/daggerforge/issues).

## Supporters ❤️

❤️ **Loony_Dragon** / **not_actually_mean** / **bposa** / **cesoide** / **Jan Hartmann** / **linksaussen** / **Rusty Thorsell** / **Nicki Nilla** / **Amberic** / **radiant_moon** ❤️

A huge thank you to everyone who supports this project! Your encouragement and feedback keep this plugin growing and improving.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U7U01IE229)

## Daggerheart License & Attribution

This product includes materials from the
Daggerheart System Reference Document 1.0, ©
Critical Role, LLC. under the terms of the
Darrington Press Community Gaming (DPCGL)
License. More information can be found at
https://www.daggerheart.com. There are no
previous modifications by others.
