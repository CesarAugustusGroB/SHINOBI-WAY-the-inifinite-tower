# Ubiquitous Language Glossary

This document defines the canonical terms used throughout the SHINOBI WAY codebase. Each concept has ONE standard name to ensure consistency and reduce cognitive load.

## Core Domain Terms

| Term | Definition | Type/Interface | Notes |
|------|------------|----------------|-------|
| **Region** | Themed area containing multiple locations | `Region` | Land of Waves, Chunin Exams, etc. |
| **Location** | A specific area within a region with danger level | `Location` | Contains 10-room diamond pattern |
| **Room** | An explorable space within a location | `BranchingRoom` | Uses branching structure |
| **Activity** | An action or encounter within a room | `RoomActivities` | Processed in `ACTIVITY_ORDER` |
| **Guardian** | Elite enemy at room 10 (Intel Mission) | `Enemy` with `tier='Guardian'` | Rewards path choice |
| **Player** | The player character entity | `Player` | "character" only in UI labels |
| **Level** | Player's character progression level | `player.level` | Distinct from "danger level" |
| **Exp** | Experience points toward next level | `player.exp` | Short for "experience" |
| **Skill** | A learnable ability/jutsu | `Skill` | |
| **Item** | Equipment, component, or artifact | `Item` | |
| **Component** | Crafting material for synthesis | `ComponentId` | Basic items for crafting |
| **Artifact** | Crafted item with passive effects | `Item` with `recipe` | Created via synthesis |
| **Ryo** | In-game currency | `player.ryo` | |
| **Clan** | Player's ninja clan (affects stats) | `Clan` | Uzumaki, Uchiha, Hyuga, Lee, Yamanaka |
| **Arc** | Story chapter | `arc: string` | Academy, Waves, Exams, Rogue, War |
| **Danger Level** | Difficulty scaling (1-7) | `dangerLevel` | Replaces floors for scaling |

## Region Exploration System (Region → Location → Room)

### Hierarchy

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **Region** | Themed area (10-15 locations) connected by paths | `Region` |
| **Location** | Specific area with x-room diamond exploration | `Location` |
| **LocationType** | Category of location (settlement, wilderness, stronghold, landmark, secret, boss) | `LocationType` |
| **Path** | Connection between locations | `LocationPath` |
| **PathType** | Type of path (forward, branch, loop, secret) | `PathType` |
| **Intel Mission** | Elite fight at room 10 for path choice reward | Room 10 activity |

### Location Card System

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **Location Card** | Card representing a location choice | `LocationCard` |
| **Location Deck** | Weighted deck of available locations | `LocationDeck` |
| **Intel Level** | How much info is revealed on cards (NONE, PARTIAL, FULL) | `IntelRevealLevel` |
| **Wealth Level** | Loot tier of a location (1-7) | `wealthLevel` |
| **Danger Tier** | Grouping of danger levels: low (1-2), mid (3-4), high (5-7) | `DangerTier` |

### Room Structure

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **Depth** | True distance from location start | `room.depth` |
| **Tier** | Visual display tier (0, 1, 2) | `room.tier: RoomTier` |
| **Accessible** | Room can be entered | `room.isAccessible` |
| **Cleared** | All activities in room completed | `room.isCleared` |
| **Exit** | Final room (room 10) | `room.isExit` |

## Combat Terms

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **Combat** | Turn-based battle sequence | `GameState.COMBAT` |
| **Turn** | Single action opportunity | Turn order system |
| **Approach** | Pre-combat positioning choice | `ApproachType` |
| **Terrain** | Environmental combat modifiers | `TerrainType` |
| **Element** | Damage element (Fire, Water, etc.) | `ElementType` |
| **Damage Type** | Physical/Elemental/Mental/True | `DamageType` |
| **Damage Property** | Normal/Piercing/ArmorBreak/True | `DamageProperty` |
| **Attack Method** | Melee/Ranged/Auto | `AttackMethod` |

### Action Type System

| Term | Definition | Usage |
|------|------------|-------|
| **MAIN** | Primary action, ends turn | Attacks, main jutsu |
| **TOGGLE** | Activate once, pay upkeep each turn | Sharingan, Byakugan |
| **SIDE** | Free action before Main (max 2/turn) | Buffs, positioning |
| **PASSIVE** | Always active, no action required | Clan traits |

## Treasure & Synthesis System

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **Treasure** | Loot collection activity | `TreasureActivity` |
| **Locked Chest** | Pick blind or reveal with chakra | `TreasureType.LOCKED_CHEST` |
| **Treasure Hunter** | Combat/dice for map pieces | `TreasureType.TREASURE_HUNTER` |
| **Treasure Hunt** | Multi-room map piece collection | `TreasureHunt` |
| **Map Piece** | Collectible for treasure hunt reward | `collectedPieces` |
| **Treasure Quality** | Tier of items from treasure (BROKEN, COMMON, RARE) | `TreasureQuality` |
| **Synthesis** | Combining components into artifacts | `LootSystem.synthesize()` |
| **Disassemble** | Breaking artifact into components | `LootSystem.disassemble()` |
| **Bag** | 12-slot inventory for components/artifacts | `player.bag` |

## Activity Types (Canonical Order)

Activities are processed in this order within each room:

1. `combat` - Fight room enemy
2. `eliteChallenge` - Optional artifact guardian fight
3. `merchant` - Buy items
4. `event` - Story/choice event
5. `scrollDiscovery` - Learn new jutsu
6. `rest` - Heal HP/chakra
7. `training` - Spend resources for stats
8. `treasure` - Collect components/ryo
9. `infoGathering` - Gain intel (+25%)

## Game States

```typescript
enum GameState {
  MENU,               // Main menu
  CHAR_SELECT,        // Character selection
  EXPLORE,            // Branching room exploration (legacy)
  ELITE_CHALLENGE,    // Elite challenge fight vs escape choice
  COMBAT,             // Combat sequence
  LOOT,               // Loot distribution
  MERCHANT,           // Shop/trading
  EVENT,              // Story event
  TRAINING,           // Stat training scene
  SCROLL_DISCOVERY,   // Jutsu scroll discovery
  GAME_OVER,          // Game over screen
  GUIDE,              // Help/guide screen
  ASSET_COMPANION,    // AI asset generation tool
  REGION_MAP,         // Region overview - card-based location selection
  LOCATION_EXPLORE,   // Inside a location (10-room diamond exploration)
  TREASURE,           // Treasure choice screen
  TREASURE_HUNT_REWARD // Map completion reward screen
}
```

## Rarity System

```typescript
enum Rarity {
  BROKEN,     // Lowest - drops from treasure/enemies
  COMMON,     // Upgraded from 2x Broken (same type)
  RARE,       // Synthesized from 2x Common (any types)
  EPIC,       // Upgraded from 2x Rare Artifact (same)
  LEGENDARY,  // Special rewards
  CURSED      // High risk/reward items
}
```

## Skill Tier System

| Tier | Rank | INT Required | Description |
|------|------|--------------|-------------|
| BASIC | E-D | 0-6 | Academy fundamentals |
| ADVANCED | C-B | 8-12 | Chunin-level techniques |
| HIDDEN | B-A | 14-18 | Jonin/Clan secrets |
| FORBIDDEN | A-S | 16-20 | Dangerous techniques |
| KINJUTSU | S+ | 20-24 | Ultimate forbidden |

## Event System Types

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **GameEvent** | A narrative event with choices | `GameEvent` |
| **EventChoice** | A player response option | `EventChoice` |
| **EventOutcome** | Weighted result of a choice | `EventOutcome` |
| **RiskLevel** | Danger indicator for choices (SAFE, LOW, MEDIUM, HIGH, EXTREME) | `RiskLevel` |

## Intel System

| Term | Definition | Type/Interface |
|------|------------|----------------|
| **Intel** | Information gathered through exploration | `currentIntel` |
| **Intel Pool** | Accumulated intel from activities | `IntelPool` |
| **Intel Reveal** | What's shown on location cards | `IntelRevealLevel` |

## Naming Conventions

### Do Use

- `region` for themed areas
- `location` for specific areas within regions
- `dangerLevel` for difficulty (1-7)
- `room` for explorable spaces
- `activity` for room actions
- `combat` for battles (never "battle" or "fight")
- `player` for the character entity
- `Guardian` for room 10 enemies

### Don't Use
- ~~`node`~~ - Legacy term, use `room`
- ~~`floor`~~ - Use `dangerLevel` for scaling
- ~~`BRANCHING_EXPLORE`~~ - Renamed to `EXPLORE`
- ~~`EXPLORE_MAP`~~ - Deleted (legacy)
- ~~`EnhancedGameEventDefinition`~~ - Renamed to `GameEvent`
- ~~`EnhancedEventChoice`~~ - Renamed to `EventChoice`
- ~~`ENHANCED_EVENTS`~~ - Renamed to `EVENTS`
- ~~`generateSemiBoss`~~ - Renamed to `generateGuardian`

## State Terminology

| Context | Term | Meaning |
|---------|------|---------|
| Location | `completed` | All rooms cleared (room 10 done) |
| Room | `cleared` | All activities completed |
| Activity | `completed` | Single activity done |
| Treasure | `collected` | Treasure picked up |
| Path | `revealed` | Hidden path discovered |
| Path | `used` | Loop path consumed |

## Combat Modifiers

| Modifier | Effect |
|----------|--------|
| NONE | No special modifier |
| AMBUSH | Enemy goes first |
| PREPARED | Player +20% damage first turn |
| SANCTUARY | Player healed 20% before fight |
| CORRUPTED | Both take poison damage per turn |
| TERRAIN_SWAMP | -10 Speed for all |
| TERRAIN_FOREST | +15% evasion |
| TERRAIN_CLIFF | Miss = 10% fall damage |

## Effect Types

| Effect | Description |
|--------|-------------|
| STUN | Skip turn |
| DOT | Damage over time |
| BUFF | Stat increase |
| DEBUFF | Stat decrease |
| BLEED | Physical DOT |
| BURN | Fire DOT |
| POISON | Ignores some defense |
| SHIELD | Absorbs damage (temporary HP) |
| INVULN | Takes 0 damage |
| CURSE | Increases damage taken |
| REFLECT | Returns % of damage |
| REGEN | HP restore per turn |
