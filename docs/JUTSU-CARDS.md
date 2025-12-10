# SHINOBI WAY: JUTSU CARD SYSTEM
## Complete Skill Reference - Naruto Part 1 Era

---

# TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [TypeScript Implementation](#2-typescript-implementation)
3. [BASIC Tier Skills](#3-basic-tier-skills)
4. [ADVANCED Tier Skills](#4-advanced-tier-skills)
5. [HIDDEN Tier Skills](#5-hidden-tier-skills)
6. [FORBIDDEN Tier Skills](#6-forbidden-tier-skills)
7. [KINJUTSU Tier Skills](#7-kinjutsu-tier-skills)
8. [Clan Loadouts](#8-clan-loadouts)
9. [Balance Guidelines](#9-balance-guidelines)

---

# 1. SYSTEM OVERVIEW

## 1.1 Skill Tier System

| Tier | Rank | INT Req | Damage Mult | Description |
|------|------|---------|-------------|-------------|
| **BASIC** | E-D | 0-6 | 1.5-2.5x | Academy fundamentals |
| **ADVANCED** | C-B | 8-12 | 2.5-3.5x | Chunin-level techniques |
| **HIDDEN** | B-A | 14-18 | 3.5-5.0x | Jonin/Clan secrets |
| **FORBIDDEN** | A-S | 16-20 | 4.5-6.0x | Dangerous techniques |
| **KINJUTSU** | S+ | 20-24 | 5.0-10.0x | Ultimate forbidden |

## 1.2 Action Type System

| Type | Phase | Turn Cost | Rules |
|------|-------|-----------|-------|
| **PASSIVE** | Always | None | Permanent bonus, no action required |
| **TOGGLE** | Upkeep | Auto-pay | Activate once (ends turn), upkeep cost per turn |
| **SIDE** | Before MAIN | Free | Setup action, max 2 per turn, before MAIN |
| **MAIN** | Commit | Ends Turn | Primary action, 1 per turn |

## 1.3 Combat Turn Flow

```
TURN START
|
+---> UPKEEP PHASE (Automatic)
|     +---> Pay Toggle costs (e.g., Sharingan: -5 CP)
|     +---> Passive effects apply
|     +---> DoTs/Regens tick
|
+---> SIDE PHASE (Optional, before MAIN)
|     +---> Use up to 2 SIDE actions
|     +---> Buffs/Setup for MAIN action
|
+---> MAIN PHASE (Required, ends turn)
|     +---> Execute 1 MAIN action
|
+---> TURN END -> Enemy turn
```

## 1.4 Element Cycle

```
Fire -> Wind -> Lightning -> Earth -> Water -> Fire
       (beats)   (beats)     (beats)  (beats)

Super Effective: 1.5x damage
Not Effective: 0.5x damage
```

## 1.5 Damage Properties

| Property | Effect |
|----------|--------|
| **NORMAL** | Full flat + % defense applies |
| **PIERCING** | Ignores flat defense, only % applies |
| **ARMOR_BREAK** | Ignores % defense, only flat applies |
| **TRUE** | Bypasses ALL defense |

---

# 2. TYPESCRIPT IMPLEMENTATION

## 2.1 New Enums

```typescript
// Action Type enum - determines when/how skill can be used
export enum ActionType {
  MAIN = 'Main',       // Ends your turn
  TOGGLE = 'Toggle',   // Activate/deactivate, upkeep cost per turn
  SIDE = 'Side',       // Free action before MAIN, max 2/turn
  PASSIVE = 'Passive'  // Always active, no action needed
}

// Updated Skill Tier enum
export enum SkillTier {
  BASIC = 'Basic',
  ADVANCED = 'Advanced',
  HIDDEN = 'Hidden',
  FORBIDDEN = 'Forbidden',
  KINJUTSU = 'Kinjutsu'
}
```

## 2.2 Updated Skill Interface

```typescript
export interface Skill {
  // Identity
  id: string;
  name: string;
  tier: SkillTier;
  description: string;

  // ACTION TYPE (NEW)
  actionType: ActionType;
  sideActionLimit?: number;      // Max uses per turn (SIDE only, default 1)

  // Resource Costs
  chakraCost: number;
  hpCost: number;

  // Cooldown
  cooldown: number;
  currentCooldown: number;

  // Damage Calculation
  damageMult: number;
  scalingStat: PrimaryStat;
  damageType: DamageType;
  damageProperty: DamageProperty;
  attackMethod: AttackMethod;

  // Element
  element: ElementType;

  // Toggle Properties
  isToggle?: boolean;
  isActive?: boolean;
  upkeepCost?: number;           // CP or HP cost per turn while active

  // Effects
  effects?: EffectDefinition[];

  // Bonuses
  critBonus?: number;
  penetration?: number;

  // Requirements
  requirements?: SkillRequirements;

  // PASSIVE Properties (NEW)
  passiveEffect?: PassiveSkillEffect;

  // Progression
  level?: number;

  // Visual
  image?: string;
  icon?: string;                 // Emoji/icon for quick reference
}

export interface PassiveSkillEffect {
  statBonus?: Partial<PrimaryAttributes>;
  damageBonus?: number;          // % bonus to all damage
  defenseBonus?: number;         // % bonus to all defense
  regenBonus?: { hp?: number; chakra?: number };
  specialEffect?: string;        // Unique effect identifier
}
```

---

# 3. BASIC TIER SKILLS

## 3.1 TAIJUTSU (Physical Combat)

### MAIN Actions

| ID | Name | Cost | CD | Damage | Scaling | Effect |
|----|------|------|-----|--------|---------|--------|
| `taijutsu` | Taijutsu | 0 | 0 | 2.0x | STR | None - reliable fallback |
| `leaf_whirlwind` | Leaf Whirlwind | 0 | 2 | 2.2x | SPD | 30% chance: -15% ACC (2t) |
| `dynamic_entry` | Dynamic Entry | 0 | 3 | 2.5x | STR | Guaranteed first strike, +20% crit |
| `rising_wind` | Leaf Rising Wind | 0 | 2 | 1.8x | SPD | Next attack deals +25% damage |
| `strong_fist` | Strong Fist Combo | 0 | 1 | 1.5x (x2) | STR | Hits twice at 75% each |
| `sweeping_kick` | Sweeping Kick | 0 | 2 | 1.6x | SPD | 40% Stun (1t) |
| `elbow_strike` | Elbow Strike | 0 | 1 | 2.0x | STR | PIERCING property |
| `feint_strike` | Feint Strike | 0 | 2 | 1.5x | DEX | Cannot be evaded |
| `counter_stance` | Counter Stance | 5 | 4 | 2.0x | STR | Counter-attack if hit this turn |

### SIDE Actions

| ID | Name | Cost | CD | Effect |
|----|------|------|-----|--------|
| `dancing_leaf` | Shadow of Dancing Leaf | 5 | 3 | Next melee: +50% dmg, +30% crit |
| `focused_breathing` | Focused Breathing | 0 | 2 | +10 CP regeneration this turn |

---

## 3.2 WEAPONS (Ranged/Tools)

### MAIN Actions

| ID | Name | Cost | CD | Damage | Scaling | Effect |
|----|------|------|-----|--------|---------|--------|
| `shuriken` | Shuriken | 0 | 1 | 1.8x | ACC | +25% crit chance |
| `kunai_slash` | Kunai Slash | 0 | 1 | 1.9x | DEX | 25% Bleed (5 dmg, 2t) |
| `kunai_throw` | Kunai Throw | 0 | 1 | 1.7x | ACC | Basic ranged attack |
| `shuriken_barrage` | Shuriken Barrage | 5 | 2 | 1.2x (x3) | ACC | Three hits at 40% each |
| `windmill_shuriken` | Windmill Shuriken | 0 | 3 | 2.8x | ACC | Ignores shields, 20% armor pen |
| `senbon` | Senbon Needle | 0 | 1 | 1.2x | ACC | 50% Silence (1t) |
| `senbon_rain` | Senbon Rain | 10 | 3 | 0.8x (x5) | ACC | Five hits, 20% poison each |
| `explosive_tag` | Explosive Tag | 0 | 2 | 2.5x | DEX | Fire element |
| `explosive_barrage` | Explosive Barrage | 10 | 4 | 3.0x | DEX | -20% enemy evasion (2t) |
| `sword_slash` | Sword Slash | 0 | 1 | 2.2x | STR | 30% Bleed (7 dmg, 2t) |
| `iaido` | Iaido (Quick Draw) | 5 | 3 | 2.8x | SPD | +40% crit if first action |

### SIDE Actions

| ID | Name | Cost | CD | Effect |
|----|------|------|-----|--------|
| `wire_setup` | Wire Trap Setup | 5 | 4 | Next MAIN: +20% dmg, 40% Bleed |
| `poison_coat` | Poison Coat | 5 | 4 | Next weapon attack: Poison (8 dmg, 3t) |
| `explosive_plant` | Explosive Tag Plant | 0 | 3 | Next ranged: +30% damage |

---

## 3.3 ACADEMY JUTSU (Utility)

### MAIN Actions

| ID | Name | Cost | CD | Damage | Effect |
|----|------|------|-----|--------|--------|
| `sexy_jutsu` | Sexy Jutsu | 5 | 5 | 0 | 60% Stun + Confusion (humanoid only) |
| `harem_jutsu` | Harem Jutsu | 15 | 6 | 0 | 80% Stun 2t (humanoid only) |
| `substitution_counter` | Substitution Counter | 15 | 5 | 2.0x DEX | Negate hit + counter-attack |
| `basic_medical` | Basic Medical Jutsu | 20 | 5 | 0 | Heal 25 HP, remove Poison/Bleed |

### TOGGLE Actions

| ID | Name | Activate | Upkeep | Effect |
|----|------|----------|--------|--------|
| `focused_stance` | Focused Stance | 10 | 3/turn | +20% ACC, +15% Crit |
| `defensive_posture` | Defensive Posture | 10 | 3/turn | +25% all Defense, -15% Speed |
| `aggressive_stance` | Aggressive Stance | 10 | 5/turn | +30% STR, -20% Defense |

### SIDE Actions

| ID | Name | Cost | CD | Effect |
|----|------|------|-----|--------|
| `clone_jutsu` | Clone Jutsu | 5 | 3 | +20% Evasion (2t) |
| `transformation` | Transformation Jutsu | 5 | 4 | +25% DEX/Crit (2t) |
| `body_flicker` | Body Flicker | 15 | 3 | +40% Speed (2t) |
| `substitution` | Body Replacement | 10 | 4 | 30 Shield (absorbs first hit) |
| `smoke_bomb` | Smoke Bomb | 0 | 3 | +35% Evasion (2t), -20% enemy ACC |
| `flash_bomb` | Flash Bomb | 0 | 4 | 50% Blind (-40% ACC, 2t) |
| `analyze` | Analyze Enemy | 0 | 5 | Reveal stats, +15% dmg to target (3t) |
| `rope_escape` | Rope Escape | 5 | 3 | Remove Stun/Bind/movement debuffs |
| `kai` | Release (Kai) | 10 | 2 | +50% Calmness (3t), dispel Genjutsu |
| `chakra_control` | Chakra Control | 5 | 4 | +20% all stats (2t) |
| `cloak_invis` | Cloak of Invisibility | 10 | 4 | +60% Evasion (1t), next hit auto-crits |
| `brace` | Brace | 0 | 3 | +30% Defense until next turn |

### PASSIVE Abilities

| ID | Name | Effect | Requirement |
|----|------|--------|-------------|
| `academy_training` | Academy Training | +5% max HP, +5% max CP | Default (all players) |
| `weapon_proficiency` | Weapon Proficiency | +10% weapon damage | 10+ DEX |
| `taijutsu_training` | Taijutsu Training | +10% taijutsu damage | 10+ STR |
| `quick_reflexes` | Quick Reflexes | +5% Evasion | 15+ SPD |
| `iron_body` | Iron Body | +5% Physical Defense | 15+ STR |
| `chakra_reserves` | Chakra Reserves | +3 CP regen/turn | 15+ CHA |
| `mental_fortitude` | Mental Fortitude | +10% Genjutsu Resistance | 15+ CAL |
| `precision` | Precision | +5% Critical Chance | 15+ ACC |

---

# 4. ADVANCED TIER SKILLS

## 4.1 ELEMENTAL NINJUTSU

### MAIN Actions

| ID | Name | Cost | CD | Damage | Element | Effect |
|----|------|------|-----|--------|---------|--------|
| `fireball` | Fireball Jutsu | 25 | 3 | 3.5x SPI | Fire | 80% Burn (15 dmg, 3t) |
| `dragon_flame` | Dragon Flame Bomb | 30 | 3 | 3.2x SPI | Fire | 70% Burn (10 dmg, 3t) |
| `water_dragon` | Water Dragon Jutsu | 30 | 4 | 3.8x SPI | Water | High damage nuke |
| `hidden_mist` | Hidden Mist Jutsu | 20 | 5 | 0 | Water | +50% Evasion, -30% enemy ACC (3t) |
| `water_clone` | Water Clone Jutsu | 25 | 4 | 2.0x SPI | Water | +40% STR buff (2t) |
| `lightning_ball` | Lightning Ball | 22 | 3 | 2.8x SPI | Lightning | 40% Stun (1t) |
| `earth_decapitation` | Inner Decapitation | 20 | 3 | 2.5x DEX | Earth | 60% Stun (1t) |
| `great_breakthrough` | Great Breakthrough | 22 | 3 | 3.0x SPI | Wind | -25% enemy ACC (2t) |
| `air_bullet` | Air Bullet | 18 | 2 | 2.4x SPI | Wind | -15% enemy Defense (2t) |

### SIDE Actions

| ID | Name | Cost | CD | Effect |
|----|------|------|-----|--------|
| `phoenix_flower` | Phoenix Flower | 20 | 2 | 2.2x SPI damage, 50% Burn (exception: SIDE with damage) |
| `mud_wall` | Mud Wall | 15 | 4 | 40 Shield (3t) |
| `water_wall` | Water Wall | 25 | 4 | 60 Shield (2t), +30% Spirit |

---

## 4.2 CLAN TECHNIQUES

### MAIN Actions

| ID | Name | Cost | CD | Damage | Clan | Effect |
|----|------|------|-----|--------|------|--------|
| `fang_over_fang` | Fang Over Fang | 20 | 3 | 3.0x SPD | Inuzuka | Hits twice at 50% each |
| `mind_transfer` | Mind Transfer Jutsu | 40 | 6 | 0 | Yamanaka | 70% Stun (2t). Miss = self stun |
| `shadow_possession` | Shadow Possession | 30 | 5 | 0 | Nara | 80% Stun (2t), 30% Reflect |
| `bug_swarm` | Parasitic Insects | 25 | 4 | 1.5x INT | Aburame | Drain 25 CP, Poison (8, 3t) |
| `expansion` | Expansion Jutsu | 25 | 4 | 3.0x STR | Akimichi | +50% STR (2t) |

---

# 5. HIDDEN TIER SKILLS

## 5.1 SIGNATURE TECHNIQUES

### MAIN Actions

| ID | Name | Cost | CD | Damage | Property | Effect |
|----|------|------|-----|--------|----------|--------|
| `chidori` | Chidori | 35 | 4 | 4.5x SPD | PIERCING | +15% crit, 20% penetration |
| `rasengan` | Rasengan | 35 | 3 | 4.2x SPI | PIERCING | -25% enemy STR (3t) |
| `64_palms` | 8 Trigrams 64 Palms | 40 | 5 | 4.0x ACC | TRUE | Drain 40 CP, -30% all stats (3t) |
| `primary_lotus` | Primary Lotus | 30 HP | 4 | 5.0x STR | PIERCING | Self: -20% Defense (2t) |
| `sand_coffin` | Sand Coffin | 40 | 5 | 4.0x SPI | ARMOR_BREAK | 70% Stun (1t) |
| `sand_burial` | Sand Burial | 30 | 3 | 3.5x SPI | Normal | Execute: +100% dmg if <25% HP |
| `ice_mirrors` | Demonic Ice Mirrors | 45 | 5 | 3.8x SPD | PIERCING | 50% Stun, +30% Evasion (2t) |

### TOGGLE Actions

| ID | Name | Activate | Upkeep | Effect | Clan |
|----|------|----------|--------|--------|------|
| `sharingan_2` | Sharingan (2-Tomoe) | 10 | 5/turn | +30% SPD, +25% DEX | Uchiha |
| `byakugan` | Byakugan | 10 | 5/turn | +40% ACC, +30% DEX | Hyuga |
| `curse_mark_1` | Curse Mark Stage 1 | 15 HP | 5 HP/turn | +40% STR, +30% SPD | - |

### SIDE Actions

| ID | Name | Cost | CD | Effect | Clan |
|----|------|------|-----|--------|------|
| `rotation` | 8 Trigrams Rotation | 25 | 4 | 50 Shield, 60% damage Reflect (1t) | Hyuga |
| `sand_shield` | Sand Shield | 20 | 3 | 80 Shield (auto-activates) | - |
| `shadow_clone_buff` | Shadow Clone Jutsu | 50 | 6 | +60% STR, +40% SPD (3t) | - |
| `sharingan_predict` | Sharingan: Predict | 10 | 3 | See enemy's next move, +25% Evasion | Uchiha |
| `byakugan_scan` | Tenketsu Scan | 10 | 3 | Next MAIN ignores 30% defense | Hyuga |

### SUMMONING JUTSU

| ID | Name | Cost | CD | Damage | Effect |
|----|------|------|-----|--------|--------|
| `summon_gamabunta` | Summoning: Gamabunta | 60 | 8 | 4.5x CHA | +80 Shield (3t), Water attack |
| `summon_manda` | Summoning: Manda | 50+20HP | 7 | 5.0x SPI | Poison (15 TRUE, 4t) |
| `puppet_crow` | Puppet: Crow | 30 | 4 | 3.0x DEX | Poison + Bleed (10 each, 3t) |

---

# 6. FORBIDDEN TIER SKILLS

### MAIN Actions

| ID | Name | Cost | CD | Damage | Type | Effect |
|----|------|------|-----|--------|------|--------|
| `hidden_lotus` | Hidden Lotus | 50 HP | 6 | 7.0x STR | TRUE | Self Stun (1t) after use |
| `chidori_stream` | Chidori Stream | 40 | 4 | 2.5x SPI | AUTO | 80% Stun (1t), cannot evade |
| `water_vortex` | Giant Water Vortex | 45 | 5 | 4.2x SPI | Normal | -40% SPD (3t) |
| `clone_explosion` | Clone Great Explosion | 40+10HP | 5 | 4.5x CHA | AUTO | Cannot be evaded |
| `1000_years` | 1000 Years of Death | 5 | 5 | 1.0x STR | Normal | 100% Stun (1t), 60% Confuse |

### TOGGLE Actions

| ID | Name | Activate | Upkeep | Effect |
|----|------|----------|--------|--------|
| `gate_of_life` | Gate of Life (3rd Gate) | 25 HP | 10 HP/turn | +80% STR, +60% SPD |
| `curse_mark_2` | Curse Mark Stage 2 | 30 HP | 10 HP/turn | +80% STR/SPD/SPI |

### SIDE Actions

| ID | Name | Cost | CD | Effect |
|----|------|------|-----|--------|
| `curse_surge` | Curse Mark Surge | 10 HP | 4 | +30% damage on next MAIN |
| `gate_prep` | Gate Release Prep | 15 HP | 5 | Next Gate activation: -50% HP cost |
| `killing_intent` | Killing Intent | 0 | 6 | 30% Fear (enemy skips turn) |

---

# 7. KINJUTSU TIER SKILLS

### MAIN Actions

| ID | Name | Cost | CD | Damage | Type | Effect | INT Req |
|----|------|------|-----|--------|------|--------|---------|
| `reaper_death_seal` | Reaper Death Seal | ALL HP | 99 | 999x | TRUE | Both user and target die | 20 |
| `edo_tensei` | Edo Tensei | 100+30HP | 10 | 0 | - | Summon ally with 50% stats (5t) | 22 |
| `gate_of_limit` | Gate of Limit (5th) | 40 HP | 99 | 0 | - | +150% STR/SPD, Bleed 20/turn | 4 |
| `shukaku_arm` | Shukaku Arm | 50 | 6 | 6.0x SPI | ARMOR_BREAK | +100 Shield, 2x dmg if <30% HP | 18 |
| `copy_jutsu` | Sharingan: Copy | 30 | 8 | Varies | Varies | Copy enemy's last skill at 80% | 16 |

---

# 8. CLAN LOADOUTS

## Starting Skills by Clan

| Clan | MAIN (4) | SIDE (3) | TOGGLE (1) | PASSIVE (2) |
|------|----------|----------|------------|-------------|
| **Uzumaki** | Taijutsu, Rasengan, Shadow Clone, Basic Medical | Clone Jutsu, Body Flicker, Brace | - | Chakra Reserves, Academy Training |
| **Uchiha** | Taijutsu, Shuriken, Fireball, Phoenix Flower | Wire Setup, Smoke Bomb, Sharingan Predict | Sharingan (2-Tomoe) | Fire Affinity, Precision |
| **Hyuga** | Taijutsu, Gentle Fist, 64 Palms, Air Palm | Rotation, Byakugan Scan, Analyze | Byakugan | Precision, Taijutsu Training |
| **Lee** | Taijutsu, Leaf Whirlwind, Dynamic Entry, Primary Lotus | Dancing Leaf, Focused Breathing, Brace | - | Taijutsu Training, Iron Body |
| **Yamanaka** | Taijutsu, Shuriken, Mind Transfer, Hell Viewing | Clone Jutsu, Analyze, Kai | - | Mental Fortitude, Academy Training |

## Skill Slot Allocation

| Slot Type | Count | Purpose |
|-----------|-------|---------|
| MAIN | 4-5 | Core attacks and jutsu |
| SIDE | 3-4 | Setup and utility |
| TOGGLE | 1-2 | Stances and transformations |
| PASSIVE | 2-3 | Permanent bonuses |

---

# 9. BALANCE GUIDELINES

## 9.1 Damage Multiplier Ranges

| Tier | Zero-Cost | Low-Cost (5-15) | Medium (20-40) | High (50+) |
|------|-----------|-----------------|----------------|------------|
| BASIC | 1.5-2.2x | 2.0-2.5x | 2.5-3.0x | N/A |
| ADVANCED | N/A | 2.5-3.0x | 3.0-3.5x | 3.5-4.0x |
| HIDDEN | N/A | 3.0-3.5x | 3.5-4.5x | 4.5-5.0x |
| FORBIDDEN | N/A | N/A | 4.0-5.0x | 5.0-7.0x |
| KINJUTSU | N/A | N/A | 5.0-6.0x | 6.0-10.0x |

## 9.2 Cooldown Standards

| Skill Type | CD Range | Reason |
|------------|----------|--------|
| Basic attacks | 0-1 | Spammable fallback |
| Low utility | 2-3 | Frequent use |
| Strong damage | 3-4 | Moderate pacing |
| Powerful effects | 4-6 | Strategic timing |
| Ultimate skills | 6-10 | Once per fight |
| One-time use | 99 | Single use per battle |

## 9.3 SIDE Action Rules

1. **No direct damage** - Exception: Phoenix Flower (weak chip damage)
2. **Max 2 per turn** - Prevents infinite buff stacking
3. **Setup focus** - Designed to enhance MAIN actions
4. **Long cooldowns** (3-5 turns) - Can't spam same buff repeatedly

## 9.4 TOGGLE Balance

1. **Activation costs turn** - Opportunity cost to enable
2. **Meaningful upkeep** - 5-10 CP or HP per turn
3. **Counter-play exists** - Silence/Chakra Drain shuts them down
4. **Strong but unsustainable** - Resource drain forces decisions

## 9.5 Damage Type Strategy

| Damage Type | Best Against | Countered By |
|-------------|--------------|--------------|
| PHYSICAL | Low STR enemies | High STR defense |
| ELEMENTAL | Low SPI enemies | High SPI defense |
| MENTAL | Low CAL enemies | High CAL resistance |
| TRUE | Anyone | Nothing (use sparingly) |

## 9.6 Property Usage

| Property | When to Use | Trade-off |
|----------|-------------|-----------|
| NORMAL | Default, reliable | Full mitigation |
| PIERCING | High flat-armor enemies | % defense still applies |
| ARMOR_BREAK | High % defense enemies | Flat defense still applies |
| TRUE | Boss killers, ultimates | High cost/cooldown |

---

# APPENDIX: COMBO EXAMPLES

## Assassin Combo (Uchiha)
```
SIDE: Sharingan Predict (10 CP) -> See enemy move, +25% Evasion
SIDE: Cloak of Invisibility (10 CP) -> +60% Evasion, next hit crits
MAIN: Chidori (35 CP) -> 4.5x SPD, PIERCING, AUTO-CRIT
Total: 55 CP for devastating alpha strike
```

## Tank Setup (Hyuga)
```
SIDE: Rotation (25 CP) -> 50 Shield, 60% Reflect
SIDE: Brace (0 CP) -> +30% Defense
MAIN: Gentle Fist (15 CP) -> 2.5x ACC TRUE damage
Total: Defensive + reliable TRUE damage
```

## Burst Damage (Lee)
```
SIDE: Shadow Dancing Leaf (5 CP) -> +50% melee damage
SIDE: Focused Breathing (0 CP) -> +10 CP
MAIN: Primary Lotus (30 HP) -> 5.0x STR * 1.5 = 7.5x effective!
Total: Massive single hit, no chakra needed
```

## Control Setup (Yamanaka)
```
SIDE: Smoke Bomb (0 CP) -> Enemy -20% ACC
SIDE: Analyze Enemy (0 CP) -> +15% damage
MAIN: Mind Transfer (40 CP) -> 2 turn Stun
Total: CC setup with damage amp
```

---

*Document Version: 1.0*
*Last Updated: 2024-12-09*
*Game: SHINOBI WAY - THE INFINITE TOWER*
