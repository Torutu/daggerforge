# DaggerForge

**Obsidian plugin for tabletop RPG game masters**

Comprehensive adversary and environment management for tabletop campaigns. Create, edit, and organize game content with professional card builders, powerful search engines, and seamless Obsidian integration.

---

## Features

### Adversary Management

- **Complete stat tracking** - HP, stress, attack modifiers, difficulty thresholds
- **Weapon systems** - Name, range, damage with structured tracking
- **Dynamic features** - Actions, reactions, passive abilities with cost mechanics
- **Tier-based organization** - Tiers 1-4 with type classification
- **Multiple sources** - Core, Sablewood, Umbra, Void, and custom content

### Environment Design

- **Location creation** - Tier, type, and comprehensive descriptions
- **Impulse system** - GM guidance for environmental triggers
- **Feature mechanics** - Action/Reaction/Passive with cost system
- **Bullet points** - Organized feature details
- **GM prompts** - Built-in questions for improvisation

### Card Creation & Editing

- **Dual-mode modals** - Create new or edit existing cards
- **Form state persistence** - Resume work between sessions
- **Live editing** - Update cards in markdown or canvas
- **HTML generation** - Professional card rendering
- **ID tracking** - Unique identifiers for collision-free sharing

### Advanced Search & Filtering

- **Multi-criteria search** - Name, description, type, tier, source
- **Real-time filtering** - Instant results as you type
- **Browser interface** - Sidebar panels for easy access
- **Quick insert** - Click to add to active note or canvas

### Game Tools

- **Dice roller** - Full notation support (3d6, 2d8+5, etc.)
- **Encounter calculator** - Balance party difficulty against adversaries
- **Battle point system** - Strategic adversary budgeting
- **Floating windows** - Draggable, persistent tool panels

### Data Management

- **JSON import/export** - Backup and share your content
- **Format validation** - Ensures data integrity
- **Merge operations** - Combine with existing data
- **Persistent storage** - Automatic save to `.obsidian/plugins/daggerforge/data.json`

### Obsidian Integration

- **Canvas support** - Create cards directly on canvas
- **Markdown embedding** - HTML cards in notes
- **Smart positioning** - Auto-placement with offset tracking
- **View detection** - Adapts to canvas vs markdown context
- **Edit mode switching** - Automatic source mode for editing

---

## Getting Started

### Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "DaggerForge"
4. Click Install
5. Enable the plugin

### Quick Start

#### Create Your First Adversary

1. **Open Creator**
    - Click ribbon icon → "Adversary creator"
    - Or use command palette: `Adversary creator`

2. **Fill in Details**
    - Name, tier (1-4), type (Minion, Bruiser, etc.)
    - Description and motives
    - Stats: HP, stress, attack modifier
    - Difficulty and thresholds

3. **Add Features**
    - Click "+ Add feature"
    - Enter name, type (Action/Reaction/Passive)
    - Optional cost (e.g., "Spend a Fear")
    - Description

4. **Insert**
    - Click "Insert card"
    - Card appears in active note or canvas
    - Data saved automatically

#### Create an Environment

1. **Open Creator**
    - Ribbon icon → "Environment creator"
    - Or command: `Environment creator`

2. **Fill Basic Info**
    - Name, tier, type (Event, Exploration, Social, Traversal)
    - Description
    - Impulses for GM guidance

3. **Add Features**
    - Name and type
    - Description with markdown support
    - Bullet points for details
    - Optional continuation text
    - GM prompt questions

4. **Insert**
    - Card created in note/canvas
    - Auto-saved to data

#### Browse and Insert

1. **Open Browser**
    - Ribbon → "Adversary browser" or "Environment browser"
    - Sidebar panel opens

2. **Search and Filter**
    - Type in search box
    - Filter by tier, source, type
    - Results update instantly

3. **Insert**
    - Click any card
    - Inserted into active note/canvas

#### Edit Existing Cards

1. **Click Edit Button**
    - 📝 button on any card

2. **Modify in Modal**
    - All fields editable
    - Add/remove features

3. **Update**
    - Click "Update card"
    - Card and data both updated

---

## Usage Guide

### Card Types

**Adversaries**

- Combat encounters
- Social challengers
- Environmental threats
- Stats, weapons, features

**Environments**

- Locations and scenes
- Traversal challenges
- Social settings
- Features with cost mechanics

### Sources

- **Core** - Base game content
- **Sablewood** - Sablewood expansion
- **Umbra** - Umbra-touched adversaries
- **Void** - Void content
- **Custom** - Your creations

### Tier System

- **Tier 1** - Low level, beginner threats
- **Tier 2** - Moderate challenges
- **Tier 3** - Serious threats
- **Tier 4** - Epic encounters

### Tools

**Dice Roller**

- Queue multiple dice
- Roll history log
- Supports complex expressions
- Draggable window

**Encounter Calculator**

- Calculate base Battle Points from PC count
- Adjust for difficulty, composition
- Spend BP on adversaries
- Track remaining budget

---

## Data Management

### File Storage

**Location:** `.obsidian/plugins/daggerforge/data.json`

**Format:**

```json
{
  "version": "2.0",
  "adversaries": [...],
  "environments": [...],
  "lastUpdated": 1738425600000
}
```

### Import Data

1. Ribbon → "Import data"
2. Select JSON file
3. Data validates and merges
4. Browsers refresh automatically

### Export Data

Copy `data.json` from:
`.obsidian/plugins/daggerforge/`

### Delete All Data

1. Ribbon → "Delete data file"
2. Confirm deletion
3. All custom content removed
4. Built-in content remains

---

## Commands

| Command                    | Description                            |
| -------------------------- | -------------------------------------- |
| Open adversary browser     | Browse and search adversaries          |
| Open environment browser   | Browse and search environments         |
| Adversary creator          | Create new adversary card              |
| Environment creator        | Create new environment card            |
| Open dice roller           | Launch dice rolling tool               |
| Open battle calculator     | Launch encounter difficulty calculator |
| Import data from JSON file | Import adversaries and environments    |
| Delete data file           | Remove all saved data                  |

---

## Theming

DaggerForge uses Obsidian's CSS variables for seamless theme integration:

- Adapts to light/dark themes automatically
- Uses theme accent colors
- Respects font settings
- Custom prefix: `df-` for all classes

---

## Technical Details

### Architecture

- **Feature-based structure** - Organized by business domain
- **TypeScript** - Full type safety
- **Barrel exports** - Clean import structure
- **Obsidian API** - Native integration

### Data Format

**Adversary ID:** `CUA_timestamp_random8`  
**Environment ID:** `CUE_timestamp_random8`

Example: `CUA_1738425600000_7k3m9p2x`

### Canvas Integration

- Text nodes for cards
- Viewport-centered positioning
- Incremental offset (10px)
- Auto-save on creation

### Markdown Integration

- HTML sections
- Edit button with unique IDs
- Source mode switching
- File modification tracking

---

## Documentation

- **API Reference** - `/docs/API.md` - Complete API documentation
- **Implementation Guide** - `/docs/EXPLANATION.md` - Architecture and patterns
- **Structure Guide** - `/docs/STRUCTURE.md` - Project organization
- **Plugin Guidelines** - `/OBSIDIAN_PLUGIN_GUIDELINES.md` - Obsidian best practices

---

## Troubleshooting

### Cards Not Appearing

- Ensure you're in an active note or canvas
- For markdown: switch to edit mode
- For canvas: verify canvas is active view

### Edit Button Not Working

- Check console for errors (Ctrl+Shift+I)
- Verify card has unique ID attribute
- Ensure edit mode (markdown) or canvas

### Data Not Persisting

- Check file exists: `.obsidian/plugins/daggerforge/data.json`
- Verify write permissions
- Look for errors in console

### Import Fails

- Validate JSON format
- Ensure `adversaries` or `environments` array exists
- Check for syntax errors in file

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/daggerforge.git

# Install dependencies
npm install

# Build plugin
npm run build

# Watch for changes
npm run dev
```

### Project Structure

```
src/
├── features/         # Feature modules
├── data/            # Data layer
├── utils/           # Utilities
├── types/           # TypeScript types
└── main.ts          # Entry point
```

### Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- searchEngine.test.ts
```

---

## License

MIT License - See LICENSE file for details

---

## Credits

Built for tabletop RPG game masters who use Obsidian for campaign management.

---

## Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Documentation:** `/docs` folder

---

## Changelog

### v2.0.0 - Current

- Complete architecture overhaul
- Feature-based organization
- Improved data management
- Enhanced search and filtering
- Canvas positioning fixes
- Comprehensive documentation

### v1.0.0

- Initial release
- Basic adversary/environment creation
- Simple browser interface
- JSON import/export

---

**Happy gaming!**
