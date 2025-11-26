# SHINOBI WAY: THE INFINITE TOWER - MISSING SKILLS DOCUMENTATION

## Overview

This document catalogs all missing skill categories and provides detailed specifications for skills that should be added to expand combat variety and build diversity.

**Current Status**: 28 skills implemented | **Recommended**: 95-130 total | **Gap**: 67-102 skills

---

## Table of Contents

1. [Currently Implemented Skills](#currently-implemented-skills)
2. [Missing Skill Categories](#missing-skill-categories)
3. [Missing Skills by Category](#missing-skills-by-category)
4. [Implementation Priority](#implementation-priority)
5. [Skill Templates](#skill-templates)

---

## Currently Implemented Skills

### Total: 28 Skills

#### COMMON TIER (4)
- `BASIC_ATTACK` - Basic Taijutsu punch
- `SHURIKEN` - Projectile weapon attack
- `MUD_WALL` - Earth defensive barrier (uses SHIELD effect)
- `PHOENIX_FLOWER` - Fire multi-projectile

#### RARE TIER (7)
- `RASENGAN` - Wind spiral energy attack
- `FIREBALL` - Fire ninjutsu
- `GENTLE_FIST` - Hyuga clan martial art
- `SHARINGAN_2TOMOE` - Uchiha eye toggle (uses BUFF effect)
- `WATER_PRISON` - Water trapping technique
- `HELL_VIEWING` - Genjutsu mental attack
- `MIND_DESTRUCTION` - Mind body disturbance

#### EPIC TIER (8)
- `SHADOW_CLONE` - Clone summoning
- `PRIMARY_LOTUS` - Lee gate-opening technique
- `CHIDORI` - Lightning spear attack
- `CHIDORI_STREAM` - Lightning stream variant
- `SAND_COFFIN` - Earth crushing technique
- `WATER_DRAGON` - Water dragon manifestation
- `ICE_MIRRORS` - Ice mirror reflection
- `FALSE_SURROUNDINGS` - Genjutsu illusion
- `TEMPLE_NIRVANA` - Genjutsu sleep technique

#### LEGENDARY TIER (2)
- `DEMON_SLASH` - Weapon slash attack
- `BONE_DRILL` - Skeleton dance attack
- `POISON_FOG` - Poison cloud technique
- `TSUKUYOMI` - Genjutsu ultimate illusion

#### FORBIDDEN TIER (7)
- `C4_KARURA` - Explosive clay birds
- `RASENSHURIKEN` - Wind spiral star attack
- `AMATERASU` - Black fire blaze
- `KIRIN` - Lightning dragon strike
- `SHINRA_TENSEI` - Repulsion sphere
- `KAMUI_IMPACT` - Space-time warping
- `TENGAI_SHINSEI` - Meteor strike

---

## Missing Skill Categories

### 1. **TAIJUTSU (MELEE PHYSICAL)** ⚠️ SEVERELY UNDERREPRESENTED
**Current**: 3 skills | **Should be**: 8-10 | **Gap**: 5-7

**Problem**: Only one progression path for hand-to-hand combat
**Impact**: Lee disciples and strength-focused builds have limited options

#### Missing Taijutsu Skills

| Skill Name | Tier | Effect | Cost | Description |
|---|---|---|---|---|
| Eight Inner Gates: Gate 1 | COMMON | BUFF (Strength +0.5) | 5 HP | Opens first gate for speed burst |
| Leaf Whirlwind | COMMON | Spinning kick combo, hits twice | 10 Chakra | Basic spinning attack |
| Eight Inner Gates: Gate 2 | RARE | BUFF (Strength +0.8, Speed +0.6) | 15 HP | Opens second gate for power |
| Leaf Hurricane | RARE | Tornado kick with knockback effect | 15 Chakra | Circular spin attack |
| Eight Inner Gates: Gate 3 | RARE | BUFF (all physical +1.0) | 25 HP | Opens third gate |
| Drunken Fist | EPIC | BUFF (Evasion +0.5), next attack +50% damage | 20 Chakra | Unpredictable striking style |
| Eight Inner Gates: Gate 4 | EPIC | BUFF (Strength +1.5, Speed +1.0) | 40 HP | Fourth gate opens |
| Eight Inner Gates: Gate 5 | EPIC | BUFF (Physical +1.8, adds REGEN) | 60 HP | Fifth gate power surge |
| Eight Inner Gates: Gate 6 | FORBIDDEN | BUFF (Strength +2.5, Speed +2.0) | 80 HP | Sixth gate ultimate form |
| Eight Inner Gates: Gate 7 | FORBIDDEN | Massive damage variant, adds CURSE | 100 HP | Seventh gate danger |

---

### 2. **WEAPON SKILLS** ⚠️ COMPLETELY MISSING
**Current**: 2 skills (Shuriken, Demon Slash) | **Should be**: 7-8 | **Gap**: 5-6

**Problem**: No distinct weapon progression; weapons aren't differentiated from taijutsu
**Impact**: No dedicated weapon builds

#### Missing Weapon Skills

| Skill Name | Tier | Type | Scaling | Description |
|---|---|---|---|---|
| Kunai Strike | COMMON | MELEE | Strength | Basic knife throw, single target |
| War Fan Sweep | COMMON | MELEE | Strength | Broad weapon attack, high accuracy |
| Shrapnel Burst | RARE | RANGED | Accuracy | Exploding projectiles, creates debris field |
| Kusanagi Slash | RARE | MELEE | Strength | Enhanced sword technique, piercing |
| Chain Whip | RARE | MELEE | Dexterity | Restraining weapon, applies slow |
| Executioner Blade | EPIC | MELEE | Strength | Two-handed blade beheading strike (HIGH DAMAGE) |
| Samehada Feeding | EPIC | MELEE | Spirit | Weapon absorbs enemy chakra, heals user |
| Reaper Scythe | EPIC | MELEE | Strength | Curved blade with DOT effect |
| Blade of Totsuka | FORBIDDEN | MELEE | Spirit | Sealing weapon strike, applies seal debuff |
| Mugenuma Chain | FORBIDDEN | MELEE | Dexterity | Infinite chain binding, restricts movement |

---

### 3. **ELEMENTAL NINJUTSU - MISSING TIERS** ⚠️ MEDIUM-HIGH PRIORITY
**Current**: 16 skills (incomplete progression) | **Should be**: 25-30 | **Gap**: 9-14

**Problem**: Elements only have Rare→Forbidden jumps; no intermediate progression
**Impact**: No power curve; players leap from mid-tier to endgame with no steps between

#### FIRE ELEMENT - Missing Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Flame Bullet | COMMON | Single small fireball | Spirit | 8 Chakra |
| Flame Thrower | COMMON | Fire stream, continuous damage | Spirit | 12 Chakra |
| **Phoenix Flower** | **RARE** | **Existing** | **Spirit** | **15 Chakra** |
| **Fireball** | **RARE** | **Existing** | **Spirit** | **15 Chakra** |
| Great Fireball | EPIC | Larger fireball, AoE damage | Spirit | 25 Chakra |
| Flame Vortex | EPIC | Fire tornado, spinning attack | Spirit | 28 Chakra |
| Inferno Dragon | EPIC | Fire dragon variant of Water Dragon | Spirit | 30 Chakra |
| **Amaterasu** | **FORBIDDEN** | **Existing - Black flames** | **Spirit** | **50 Chakra** |
| Eternal Flame | FORBIDDEN | Amaterasu variant, spreading fire | Spirit | 60 Chakra |

#### WIND ELEMENT - Missing Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Wind Blade | COMMON | Cutting wind projectile | Spirit | 8 Chakra |
| Wind Barrier | COMMON | Defensive wind wall, SHIELD effect | Spirit | 10 Chakra |
| **Rasengan** | **RARE** | **Existing** | **Strength** | **15 Chakra** |
| Air Bullets | RARE | Multiple wind projectiles | Accuracy | 12 Chakra |
| Wind Scythe | EPIC | Larger cutting wind attack | Spirit | 25 Chakra |
| Vacuum Wave | EPIC | Pressure wave that knockbacks | Spirit | 28 Chakra |
| Wind Dragon | EPIC | Wind dragon manifestation | Spirit | 30 Chakra |
| **Rasenshuriken** | **FORBIDDEN** | **Existing** | **Strength** | **40 Chakra** |
| **Shinra Tensei** | **FORBIDDEN** | **Existing - Repulsion** | **Spirit** | **50 Chakra** |
| Ultimate Wind Severance | FORBIDDEN | Massive wind cutter, ignores defense | Spirit | 60 Chakra |

#### LIGHTNING ELEMENT - Missing Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Lightning Bolt | COMMON | Single shock attack | Spirit | 8 Chakra |
| Static Charge | COMMON | Paralyze chance buff, next attack stuns | Spirit | 10 Chakra |
| **Chidori** | **RARE** | **Existing** | **Spirit** | **20 Chakra** |
| **Chidori Stream** | **RARE** | **Existing** | **Spirit** | **25 Chakra** |
| Electric Whip | EPIC | Lightning whip continuous damage | Spirit | 25 Chakra |
| Limelight Armor | EPIC | Lightning body armor, reflects damage | Spirit | 28 Chakra |
| False Darkness | EPIC | Lightning flash technique, evasion buff | Speed | 20 Chakra |
| **Kirin** | **FORBIDDEN** | **Existing - Storm bolt** | **Spirit** | **50 Chakra** |
| Endless Lightning | FORBIDDEN | Chain lightning between enemies | Spirit | 55 Chakra |

#### EARTH ELEMENT - Missing Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Rock Throw | COMMON | Basic earth projectile | Strength | 8 Chakra |
| **Mud Wall** | **COMMON** | **Existing - SHIELD effect** | **Spirit** | **15 Chakra** |
| Stone Armor | RARE | Earth defense buff, reduces damage | Spirit | 12 Chakra |
| Rock Fists | RARE | Enlarged stone fists, melee damage boost | Strength | 15 Chakra |
| **Sand Coffin** | **EPIC** | **Existing** | **Spirit** | **40 Chakra** |
| **C4 Karura** | **EPIC** | **Existing** | **Intelligence** | **35 Chakra** |
| Earth Dragon | EPIC | Earth dragon variant | Spirit | 30 Chakra |
| Quicksand Pit | EPIC | Sinking sand, immobilizes enemy | Spirit | 32 Chakra |
| **Tengai Shinsei** | **FORBIDDEN** | **Existing - Meteor strike** | **Spirit** | **60 Chakra** |
| Complete Susanoo Body | FORBIDDEN | Ultimate earth form protection | Spirit | 70 Chakra |

#### WATER ELEMENT - Missing Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Water Bullet | COMMON | Basic water projectile | Spirit | 8 Chakra |
| **Mud Wall** | **COMMON** | **Existing** | **Spirit** | **15 Chakra** |
| **Water Prison** | **RARE** | **Existing** | **Spirit** | **30 Chakra** |
| Water Clone | RARE | Water clone summoning | Intelligence | 15 Chakra |
| **Water Dragon** | **EPIC** | **Existing** | **Spirit** | **30 Chakra** |
| **Ice Mirrors** | **EPIC** | **Existing** | **Calmness** | **28 Chakra** |
| Water Wall | EPIC | Defensive water barrier, SHIELD effect | Spirit | 25 Chakra |
| Tidal Wave | EPIC | Flooding water attack, area damage | Spirit | 32 Chakra |
| Water Shark | EPIC | Shark variant water attack | Spirit | 30 Chakra |
| Eternal Blizzard | FORBIDDEN | Permanent ice field, slow effect | Calmness | 55 Chakra |

---

### 4. **GENJUTSU (MENTAL/ILLUSION)** ⚠️ UNDERREPRESENTED
**Current**: 5 skills | **Should be**: 10-12 | **Gap**: 5-7

**Problem**: Limited illusion variety; mostly high-tier moves
**Impact**: Genjutsu specialists lack mid-tier progression

#### Missing Genjutsu Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Mist Clone | COMMON | Create fake duplicates for confusion | Intelligence | 8 Chakra |
| Dizzying Illusion | COMMON | Minor confusion, reduces accuracy | Calmness | 10 Chakra |
| **Hell Viewing** | **RARE** | **Existing** | **Intelligence** | **25 Chakra** |
| **Mind Destruction** | **RARE** | **Existing** | **Calmness** | **20 Chakra** |
| Mind Rending | RARE | Chakra drain genjutsu variant | Intelligence | 22 Chakra |
| Paralyzing Sight | RARE | Vision-based paralysis, slows speed | Calmness | 18 Chakra |
| **False Surroundings** | **EPIC** | **Existing** | **Intelligence** | **30 Chakra** |
| **Temple of Nirvana** | **EPIC** | **Existing** | **Calmness** | **28 Chakra** |
| Infinite Tsukuyomi (Weak) | EPIC | Mass illusion, affects both combatants | Calmness | 40 Chakra |
| Black Flames Illusion | EPIC | Amaterasu visual hallucination | Intelligence | 38 Chakra |
| **Tsukuyomi** | **FORBIDDEN** | **Existing - Ultimate illusion** | **Calmness** | **60 Chakra** |
| Izanami Loop | FORBIDDEN | Time loop genjutsu, forces surrender | Intelligence | 70 Chakra |

---

### 5. **CLONE / SUMMONING JUTSU** ⚠️ CRITICAL GAP
**Current**: 1 skill (Shadow Clone only) | **Should be**: 7-8 | **Gap**: 6-7

**Problem**: Clone jutsu severely underdeveloped; no summon techniques
**Impact**: Summoning is iconic Naruto mechanic; completely missing

#### Missing Clone & Summoning Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Clone Technique | COMMON | Create basic clone, distracts enemy | Intelligence | 5 Chakra |
| Harem Technique | COMMON | Multiple beautiful clones (Uzumaki specialty) | Intelligence | 8 Chakra |
| **Shadow Clone** | **RARE** | **Existing - Tactical clones** | **Intelligence** | **15 Chakra** |
| Multiple Shadow Clones | RARE | Create 3 clones instead of 1 | Intelligence | 20 Chakra |
| Chakra Clone | RARE | Temporary life force duplicates | Chakra Stat | 18 Chakra |
| Summon: Giant Toad | EPIC | Summon toad companion to attack | Intelligence | 30 Chakra |
| Summon: Giant Snake | EPIC | Summon snake for serpent strikes | Intelligence | 30 Chakra |
| **Multi-Shadow Clone** | **FORBIDDEN** | **Missing - Dozens of clones** | **Intelligence** | **45 Chakra** |
| Summon: Nine-Tailed Beast | FORBIDDEN | Ultimate summon manifestation | Chakra Stat | 70 Chakra |
| Impure World Resurrection | FORBIDDEN | Summon undead fighters | Intelligence | 60 Chakra |

---

### 6. **DEFENSIVE / SUPPORT JUTSU** ⚠️ MEDIUM PRIORITY
**Current**: 2 skills (Mud Wall, Sharingan toggle) | **Should be**: 8-10 | **Gap**: 6-8

**Problem**: Very limited defensive/support options; tank/support builds weak
**Impact**: Game encourages damage-focused builds only

#### Missing Defense & Support Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Chakra Shield | COMMON | Basic defense boost, flat damage reduction | Willpower | 8 Chakra |
| **Mud Wall** | **COMMON** | **Existing - SHIELD effect** | **Spirit** | **15 Chakra** |
| **Sharingan (2-Tomoe)** | **RARE** | **Existing - Toggle buff** | **Intelligence** | **10 Chakra** |
| Barrier Formation | RARE | Stationary defense barrier, absorbs damage | Spirit | 15 Chakra |
| **Water Wall** | **EPIC** | **NEW - Added, SHIELD effect** | **Spirit** | **25 Chakra** |
| Chakra Armor | EPIC | Spirit-based full body protection | Spirit | 28 Chakra |
| 8 Trigrams Rotation | EPIC | Hyuga defensive spin, REFLECTION effect | Calmness | 25 Chakra |
| Healing Light | EPIC | Restore HP and apply REGEN buff | Intelligence | 30 Chakra |
| Diamond Chakra Body | FORBIDDEN | Hardened defense form, very high reduction | Willpower | 50 Chakra |
| Perfect Susanoo | FORBIDDEN | Ultimate defense manifestation, near invulnerability | Spirit | 70 Chakra |

---

### 7. **CROWD CONTROL / DEBUFF** ⚠️ MEDIUM PRIORITY
**Current**: 5 effects exist but skills need expansion | **Should be**: 8-10 dedicated skills | **Gap**: 3-5

**Problem**: Limited debuff variety beyond existing STUN/BURN/POISON effects
**Impact**: Enemy control relies on luck-based status resistance

#### Missing CC/Debuff Skills

| Skill Name | Tier | Effect Type | Scaling | Cost |
|---|---|---|---|---|
| Paralysis Shock | RARE | STUN variant, reduces speed | Spirit | 15 Chakra |
| Silencing Seal | RARE | SILENCE - prevents skill use | Intelligence | 18 Chakra |
| **Existing**: STUN, BURN, POISON, BLEED, CONFUSION, CHAKRA_DRAIN | - | - | - | - |
| Chakra Suppression | EPIC | Reduces enemy max chakra temporarily | Intelligence | 25 Chakra |
| Petrification Gaze | EPIC | DEBUFF (Speed -0.7), enemy moves slowly | Calmness | 22 Chakra |
| Binding Formula | EPIC | Restraint effect, can't move or attack | Intelligence | 28 Chakra |
| Curse Application | EPIC | CURSE effect - amplifies incoming damage | Calmness | 24 Chakra |
| Five Element Sealing | FORBIDDEN | Locks 3+ stats simultaneously | Intelligence | 50 Chakra |
| Ultimate Binding | FORBIDDEN | Complete immobilization for 2 turns | Intelligence | 60 Chakra |

---

### 8. **SPACE-TIME NINJUTSU** ⚠️ MEDIUM PRIORITY
**Current**: 2 Forbidden tier only | **Should be**: 5-6 | **Gap**: 3-4

**Problem**: No entry-level or mid-tier space-time techniques
**Impact**: Space-time is exotic but only available as late-game power

#### Missing Space-Time Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Short Teleport | RARE | Dodge mechanism, reposition | Speed | 12 Chakra |
| Spatial Distortion | RARE | Create dimensional pocket, miss/dodge | Intelligence | 15 Chakra |
| **Kamui (Partial)** | **EPIC** | **Missing variant - lower damage Kamui** | **Intelligence** | **35 Chakra** |
| Warp Strike | EPIC | Teleport behind enemy + attack | Dexterity | 30 Chakra |
| **Kamui** | **FORBIDDEN** | **Existing - Full warp** | **Intelligence** | **50 Chakra** |
| **Tsukuyomi** | **FORBIDDEN** | **Existing - Time warping illusion** | **Calmness** | **60 Chakra** |
| Time Rewind | FORBIDDEN | Negate last 2 turns of damage | Intelligence | 70 Chakra |
| Dimension Prison | FORBIDDEN | Lock enemy in alternate space | Intelligence | 65 Chakra |

---

### 9. **SAGE / NATURE JUTSU** ⚠️ LOW PRIORITY (NEW ARCHETYPE)
**Current**: 0 skills | **Should be**: 4-5 | **Gap**: 4-5

**Problem**: Sage Mode is major late-game power in canon; completely missing
**Impact**: Nature energy mechanics unavailable; no Sage Mode progression

#### Missing Sage Jutsu Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Nature Sense | RARE | Locate enemies, gain stat buff | Spirit | 15 Chakra |
| Sage Art: Fire Release | EPIC | Enhanced fire jutsu with nature energy | Spirit | 32 Chakra |
| Sage Art: Wood Release | EPIC | Nature-based wood creation | Spirit | 30 Chakra |
| Sage Art: Stone Golem | EPIC | Create stone guardian summon | Spirit | 35 Chakra |
| Sage Mode Activation | FORBIDDEN | Ultimate nature power form | Spirit | 60 Chakra |
| Perfect Sage Transformation | FORBIDDEN | Perfected sage mode with all benefits | Spirit | 75 Chakra |

---

### 10. **CURSE MARK / DARK CHAKRA** ⚠️ LOW PRIORITY (NEW ARCHETYPE)
**Current**: 0 skills | **Should be**: 3-4 | **Gap**: 3-4

**Problem**: Curse mark is canon mechanic; zero representation
**Impact**: Dark/corruption playstyle unavailable; no cursed seal progression

#### Missing Curse Mark Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Curse Mark Activation | RARE | BUFF with recoil (self-damage), high stat boost | Calmness | 12 Chakra + 5 HP/turn |
| Dark Chakra Release | EPIC | True damage variant, increases self damage taken | Spirit | 28 Chakra + 10 HP/turn |
| Level 2 Curse Mark | EPIC | Enhanced curse form, wings spawn | Calmness | 35 Chakra + 8 HP/turn |
| Complete Curse Form | FORBIDDEN | Ultimate dark power form, massive stats but constant drain | Calmness | 50 Chakra + 15 HP/turn |

---

### 11. **CLAN-SPECIFIC TECHNIQUES** ⚠️ MEDIUM-HIGH PRIORITY
**Current**: 1 dedicated clan skill (Gentle Fist for Hyuga) | **Should be**: 8-10 | **Gap**: 7-9

**Problem**: Only Hyuga has unique technique; Uchiha, Uzumaki, Yamanaka, Lee disciples underrepresented
**Impact**: Clan selection doesn't meaningfully affect available moves

#### Missing Byakugan Techniques (Hyuga)

| Skill Name | Tier | Effect | Cost |
|---|---|---|---|
| **Gentle Fist** | **RARE** | **Existing - should move to COMMON** | **15 Chakra** |
| 8 Trigrams: 32 Palms | RARE | Multi-hit gentle fist combo, 4 strikes | 18 Chakra |
| 8 Trigrams: 64 Palms | EPIC | Extended combo, 8 strikes | 28 Chakra |
| Byakugan Vision | EPIC | Toggle all-seeing eye buff | 12 Chakra + 3/turn |
| 8 Trigrams: 128 Palms | FORBIDDEN | Ultimate Hyuga technique, 16 strikes | 50 Chakra |

#### Missing Sharingan Techniques (Uchiha)

| Skill Name | Tier | Effect | Cost |
|---|---|---|---|
| **Sharingan (2-Tomoe)** | **RARE** | **Existing - toggle buff** | **10 Chakra** |
| Sharingan (3-Tomoe) | RARE | Enhanced vision, 40% accuracy buff | 12 Chakra + 4/turn |
| Sharingan (6-Tomoe) | EPIC | Massive 3-Tomoe, all perception stats +60% | 18 Chakra + 6/turn |
| Amaterasu | FORBIDDEN | **Existing** | **50 Chakra** |
| **Tsukuyomi** | **FORBIDDEN** | **Existing** | **60 Chakra** |
| Mangekyo Sharingan | FORBIDDEN | Ultimate eye form, unlocks both Amaterasu & Tsukuyomi in battle | 40 Chakra |
| Susanoo (Humanoid) | FORBIDDEN | Ethereal warrior form, massive defense | 65 Chakra + 10/turn |
| Susanoo (Complete) | FORBIDDEN | Perfect form, near-invincible | 80 Chakra + 15/turn |

#### Missing Uzumaki Techniques (Uzumaki)

| Skill Name | Tier | Effect | Cost |
|---|---|---|---|
| Chakra Chain | COMMON | Summon chakra-linked chains | 8 Chakra |
| Nine-Tail Chakra Burst | RARE | Chakra stat boost, summon tails visualization | 15 Chakra |
| Sealing Chains | EPIC | Chakra chains + seal debuff | 28 Chakra |
| Tailed Beast Cloak | EPIC | Partial beast form, stat boosts | 35 Chakra + 5/turn |
| Tailed Beast Transformation | FORBIDDEN | Full beast form (limited tails) | 60 Chakra + 12/turn |

#### Missing Mind Body Jutsu (Yamanaka)

| Skill Name | Tier | Effect | Cost |
|---|---|---|---|
| Mind Body Transfer | RARE | Possess enemy, paralyze them | 15 Chakra |
| Mind Disturbance | **RARE** | **Existing - similar to Mind Destruction** | **20 Chakra** |
| Telepathic Communication | EPIC | Link minds, gain enemy stat info | 20 Chakra |
| Mind Crush | EPIC | Mental damage with confusion effect | 28 Chakra |
| Ultimate Mind Control | FORBIDDEN | Full possession with stat theft | 50 Chakra |

#### Missing Lee Disciple Techniques (Lee)

| Skill Name | Tier | Effect | Cost |
|---|---|---|---|
| Hard Work Punch | COMMON | Basic punch, damage based on training | 8 Chakra |
| **Primary Lotus** | **EPIC** | **Existing - 1st gate** | **0 Chakra + 30 HP** |
| Secondary Lotus | EPIC | 2nd-3rd gates opening | 0 Chakra + 40 HP |
| Tertiary Lotus | FORBIDDEN | 4th-6th gates opening | 0 Chakra + 60 HP |
| Forbidden Lotus | FORBIDDEN | 7th-8th gates (self-destructive) | 0 Chakra + 100 HP |

---

### 12. **MEDICAL NINJUTSU** ⚠️ LOW PRIORITY (NEW ARCHETYPE)
**Current**: 0 combat skills (only event-based healing) | **Should be**: 4-5 | **Gap**: 4-5

**Problem**: Medical ninja archetype unavailable; no healing skill progression
**Impact**: Support/healer builds impossible; all combat healing random

#### Missing Medical Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Basic Heal Wound | COMMON | Restore own HP | Intelligence | 8 Chakra |
| Healing Touch | RARE | Restore moderate HP | Intelligence | 15 Chakra |
| Cellular Regeneration | RARE | Apply REGEN buff (5 HP/turn, 3 turns) | Intelligence | 18 Chakra |
| Mitotic Regeneration | EPIC | Full healing + stat buff | Intelligence | 35 Chakra |
| Chakra Healing | EPIC | Restore chakra instead of HP | Intelligence | 25 Chakra |
| Immortal Body | FORBIDDEN | Apply permanent REGEN during combat | Intelligence | 50 Chakra |

---

### 13. **SEALING JUTSU** ⚠️ LOW PRIORITY (NEW ARCHETYPE)
**Current**: 0 skills | **Should be**: 3-4 | **Gap**: 3-4

**Problem**: Sealing is important lore mechanic; completely absent
**Impact**: Tactical seal-based control unavailable

#### Missing Sealing Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| Chakra Seal | RARE | Block enemy high-cost skills (15+ Chakra) for 2 turns | Intelligence | 18 Chakra |
| Binding Formula | EPIC | Restraint effect, immobilize for 1 turn | Intelligence | 28 Chakra |
| Five-Element Seal | EPIC | Seal multiple stats simultaneously | Intelligence | 32 Chakra |
| Reaper Death Seal | FORBIDDEN | Permanent stat lock with massive HP cost | Intelligence | 60 Chakra + 50 HP |

---

### 14. **AWAKENING / FORM-CHANGE JUTSU** ⚠️ MEDIUM PRIORITY
**Current**: 1 (Sharingan toggle) | **Should be**: 6-8 | **Gap**: 5-7

**Problem**: Limited transformation options; power-up forms are rare
**Impact**: Character progression feels flat; no dramatic power escalations

#### Missing Awakening Skills

| Skill Name | Tier | Effect | Scaling | Cost |
|---|---|---|---|---|
| **Sharingan (3-Tomoe)** | **EPIC** | **Missing variant - stronger than 2-Tomoe** | **Intelligence** | **15 Chakra + 5/turn** |
| Rinnegan Awakening | EPIC | All-seeing eye form, stat boost to all | Intelligence | 40 Chakra + 10/turn |
| **Mangekyo Sharingan** | **FORBIDDEN** | **Missing - Ultimate eye** | **Intelligence** | **50 Chakra + 8/turn** |
| Tailed Beast Partial | EPIC | Partial beast transformation | Chakra Stat | 35 Chakra + 8/turn |
| Tailed Beast Full | FORBIDDEN | Full beast form | Chakra Stat | 60 Chakra + 15/turn |
| Sage Mode | FORBIDDEN | **Missing - Sage transformation** | **Spirit** | **50 Chakra + 10/turn** |
| Jinchuriki Release | FORBIDDEN | Power of tailed beast fully released | Chakra Stat | 70 Chakra + 20/turn |

---

## Implementation Priority

### TIER 1 - HIGH PRIORITY (Implement First)
These fill critical gaps and enable core playstyles:

1. **Taijutsu Progression** (Gate 1-8 series) - 8 skills
2. **Weapon Variety** (Kunai, War Fan, Kusanagi, etc.) - 7 skills
3. **Elemental Mid-Tier Skills** (Common and Rare progression) - 15 skills
4. **Clone/Summon Skills** (All missing summons) - 7 skills
5. **Defense/Support Skills** (Barriers, healing variants) - 6 skills

**Total Tier 1: ~43 skills** (Would bring total to 71, significant improvement)

### TIER 2 - MEDIUM PRIORITY (Implement Second)
These enable secondary builds and increase depth:

1. **Genjutsu Expansion** (Missing rare/epic variants) - 7 skills
2. **Crowd Control Skills** (Dedicated debuff moves) - 5 skills
3. **Space-Time Mid-Tier** (Teleport variants) - 3 skills
4. **Clan-Specific Moves** (Hyuga, Uchiha, Uzumaki, Yamanaka) - 15 skills
5. **Sealing Jutsu** (Complete category) - 4 skills

**Total Tier 2: ~34 skills** (Would bring total to 105)

### TIER 3 - LOW PRIORITY (Polish and Expand)
These add flavor and enable niche playstyles:

1. **Sage Jutsu** (Nature-based moves) - 4 skills
2. **Curse Mark/Dark Chakra** (Corruption mechanic) - 4 skills
3. **Medical Ninjutsu** (Healing specialist) - 5 skills
4. **Awakening Forms** (Power-ups and transformations) - 7 skills

**Total Tier 3: ~20 skills** (Would bring total to 125)

---

## Skill Templates

### Template: Standard Attack Skill

```typescript
SKILL_NAME: {
  id: 'skill_id',
  name: 'Skill Display Name',
  tier: SkillTier.RARE,
  description: 'Brief combat description of what the skill does.',

  // COSTS
  chakraCost: 15,
  hpCost: 0,

  // COOLDOWN
  cooldown: 3,
  currentCooldown: 0,

  // DAMAGE
  damageMult: 1.5,
  scalingStat: PrimaryStat.SPIRIT,
  damageType: DamageType.ELEMENTAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.RANGED,

  // ELEMENT
  element: ElementType.FIRE,

  // EFFECTS
  effects: [
    { type: EffectType.BURN, value: 5, duration: 3, chance: 0.7, damageType: DamageType.ELEMENTAL },
    { type: EffectType.BUFF, targetStat: PrimaryStat.SPIRIT, value: 0.2, duration: 2, chance: 1.0 }
  ],

  // REQUIREMENTS
  requirements: { intelligence: 12, level: 5 }
}
```

### Template: Toggle Buff Skill

```typescript
TOGGLE_SKILL: {
  id: 'toggle_id',
  name: 'Toggle Skill Name',
  tier: SkillTier.RARE,
  description: 'Activates a persistent buff. Toggle to enable/disable.',

  chakraCost: 10,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,

  damageMult: 0,
  scalingStat: PrimaryStat.SPIRIT,
  damageType: DamageType.PHYSICAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.AUTO,
  element: ElementType.PHYSICAL,

  // TOGGLE PROPERTIES
  isToggle: true,
  upkeepCost: 4, // Chakra per turn while active

  // BUFF EFFECTS
  effects: [
    { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: -1, chance: 1.0 },
    { type: EffectType.BUFF, targetStat: PrimaryStat.ACCURACY, value: 0.2, duration: -1, chance: 1.0 }
  ],

  requirements: { intelligence: 10, clan: Clan.UCHIHA }
}
```

### Template: Defensive Skill (with SHIELD)

```typescript
DEFENSIVE_SKILL: {
  id: 'defense_id',
  name: 'Defensive Skill',
  tier: SkillTier.EPIC,
  description: 'Creates a protective barrier that absorbs incoming damage.',

  chakraCost: 25,
  hpCost: 0,
  cooldown: 4,
  currentCooldown: 0,

  damageMult: 0,
  scalingStat: PrimaryStat.SPIRIT,
  damageType: DamageType.ELEMENTAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.AUTO,
  element: ElementType.EARTH,

  effects: [
    { type: EffectType.SHIELD, value: 60, duration: 2, chance: 1.0 },
    { type: EffectType.BUFF, targetStat: PrimaryStat.CALMNESS, value: 0.25, duration: 2, chance: 1.0 }
  ],

  requirements: { intelligence: 14 }
}
```

### Template: Multi-Effect Skill (with REFLECTION)

```typescript
COMPLEX_SKILL: {
  id: 'complex_id',
  name: 'Complex Skill',
  tier: SkillTier.EPIC,
  description: 'Defensive spin that reflects enemy damage back.',

  chakraCost: 25,
  hpCost: 0,
  cooldown: 4,
  currentCooldown: 0,

  damageMult: 0.5,
  scalingStat: PrimaryStat.CALMNESS,
  damageType: DamageType.ELEMENTAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.AUTO,
  element: ElementType.PHYSICAL,

  effects: [
    { type: EffectType.REFLECTION, value: 0.6, duration: 1, chance: 1.0 },
    { type: EffectType.SHIELD, value: 50, duration: 1, chance: 1.0 }
  ],

  requirements: { clan: Clan.HYUGA }
}
```

---

## Summary Statistics

| Metric | Current | Recommended | Gap |
|--------|---------|-------------|-----|
| **Total Skills** | 28 | 95-130 | 67-102 |
| **Taijutsu** | 3 | 8-10 | 5-7 |
| **Weapons** | 2 | 7-8 | 5-6 |
| **Elemental Ninjutsu** | 16 | 25-30 | 9-14 |
| **Genjutsu** | 5 | 10-12 | 5-7 |
| **Clone/Summon** | 1 | 7-8 | 6-7 |
| **Defense/Support** | 2 | 8-10 | 6-8 |
| **CC/Debuff** | 5 | 8-10 | 3-5 |
| **Space-Time** | 2 | 5-6 | 3-4 |
| **Sage Jutsu** | 0 | 4-5 | 4-5 |
| **Curse Mark** | 0 | 3-4 | 3-4 |
| **Clan-Specific** | 1 | 8-10 | 7-9 |
| **Medical** | 0 | 4-5 | 4-5 |
| **Sealing** | 0 | 3-4 | 3-4 |

---

## Next Steps

1. **Identify Priority Skills**: Start with Tier 1 skills that fill critical gaps
2. **Create Skill Balancing Spreadsheet**: Track damage scaling and balance across tiers
3. **Implement by Category**: Add related skills together (all Taijutsu, then all Fire element, etc.)
4. **Test Builds**: Ensure each clan/build path has viable progression
5. **Iterate**: Balance stats and cooldowns based on gameplay testing

---

**Document Last Updated**: November 27, 2025
**Status**: Ready for implementation
**Maintainer**: Shinobi Way Development Team
