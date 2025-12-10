# SHINOBI WAY: THE INFINITE TOWER
## Complete Combat Mechanics Documentation

---

# Table of Contents

1. [Primary Stat System](#primary-stat-system)
2. [Derived Stats & Formulas](#derived-stats--formulas)
3. [Damage Calculation](#damage-calculation)
4. [Defense System](#defense-system)
5. [Elemental System](#elemental-system)
6. [Critical Hits](#critical-hits)
7. [Turn Order & Combat Flow](#turn-order--combat-flow)
8. [Status Effects](#status-effects)
9. [Skill System](#skill-system)
10. [Enemy AI System](#enemy-ai-system)
11. [Combat Approaches](#combat-approaches)
12. [Equipment Passive Effects](#equipment-passive-effects)
13. [Special Mechanics](#special-mechanics)
14. [Constants Reference](#constants-reference)

---

# Primary Stat System

The game features **9 primary stats** organized into three categories: Body, Mind, and Technique. Each stat influences multiple derived attributes and combat calculations.

## The Body (Physical)

### Willpower
> The ninja's mental fortitude and life force.

- **Max HP** - Primary HP scaling
- **Guts Chance** - Survive fatal damage
- **Physical Defense %** - Damage reduction
- **HP Regen** - Natural healing

**Range:** 4 (Lee) → 25 (Uzumaki)

### Chakra
> The ninja's spiritual energy capacity.

- **Max Chakra** - Resource pool for jutsu

**Range:** 4 (Lee) → 22 (Uzumaki)

### Strength
> Raw physical power.

- **Physical Attack** - Taijutsu damage
- **Physical Defense (Flat)** - Flat reduction
- **Physical Defense %** - Percent reduction

**Range:** 8 (Yamanaka) → 28 (Lee)

## The Mind (Mental)

### Spirit
> Connection to chakra nature.

- **Elemental Attack** - Ninjutsu damage
- **Elemental Defense (Flat)** - Flat reduction
- **Elemental Defense %** - Percent reduction

**Range:** 2 (Lee) → 22 (Uchiha)

### Intelligence
> Analytical ability and chakra control.

- **Chakra Regen** - Chakra restored per turn
- **Skill Requirements** - Learn advanced jutsu
- **Mental Attack** - Genjutsu damage (partial)

**Range:** 6 (Lee) → 22 (Yamanaka)

### Calmness
> Mental stability and focus.

- **Mental Attack** - Genjutsu damage
- **Mental Defense** - Genjutsu resistance
- **Status Resistance** - Debuff protection

**Range:** 10 (Lee) → 18 (Yamanaka)

## The Technique (Combat)

### Speed
> Movement and reaction time.

- **Melee Hit Chance** - Accuracy for melee
- **Evasion** - Chance to dodge attacks
- **Initiative** - Turn order priority

**Range:** 10 (Uzumaki) → 26 (Lee)

### Accuracy
> Precision targeting ability.

- **Ranged Hit Chance** - Accuracy for ranged
- **Ranged Crit Bonus** - Extra crit damage

**Range:** 8 (Uzumaki) → 22 (Hyuga)

### Dexterity
> Fine motor control and coordination.

- **Critical Chance** - All attack types

**Range:** 8 (Uzumaki) → 18 (Uchiha/Hyuga)

---

# Derived Stats & Formulas

Derived stats are calculated from primary stats using specific formulas. These determine your actual combat capabilities.

## Resource Pools

### Maximum Hit Points
```
Max HP = 50 + (Willpower × 12) + Equipment Bonuses
```

### Maximum Chakra
```
Max Chakra = 30 + (Chakra × 8) + Equipment Bonuses
```

### HP Regeneration (per turn)
```
HP Regen = floor(Max HP × 0.02 × (Willpower / 20))
```

### Chakra Regeneration (per turn)
```
Chakra Regen = floor(Intelligence × 2)
```

## Attack Power

| Attack Type | Formula | Used By |
|-------------|---------|---------|
| Physical ATK | `Strength × 2 + Dexterity × 0.5` | Taijutsu skills |
| Elemental ATK | `Spirit × 2 + Intelligence × 0.5` | Ninjutsu skills |
| Mental ATK | `Intelligence × 1.5 + Calmness × 1` | Genjutsu skills |

## Defense Values

### Flat Defense (Linear Scaling)

```
Physical Flat Defense  = floor(Strength × 0.3)
Elemental Flat Defense = floor(Spirit × 0.3)
Mental Flat Defense    = floor(Calmness × 0.25)
```

### Percent Defense (Soft Cap)

```
Physical %  = Strength / (Strength + 200)    [Soft cap at 75% max]
Elemental % = Spirit / (Spirit + 200)        [Soft cap at 75% max]
Mental %    = Calmness / (Calmness + 150)    [Soft cap at 75% max]
```

## Combat Stats

### Melee Hit Chance
```
Hit% = clamp(92% + (Speed × 0.3) - (DefenderSpeed × 0.5), 30%, 98%)
```

### Ranged Hit Chance
```
Hit% = clamp(92% + (Accuracy × 0.3) - (DefenderSpeed × 0.5), 30%, 98%)
```

### Evasion (Separate Roll)
```
Evasion% = Speed / (Speed + 250)
```

### Initiative
```
Initiative = 10 + (Speed × 1) + random(0-10)
```

### Status Resistance
```
StatusRes% = Calmness / (Calmness + 80)
```

### Guts Chance (Survive Fatal)
```
Guts% = Willpower / (Willpower + 200)
```

---

# Damage Calculation

Damage is calculated through a **5-step pipeline**. Each step modifies the damage value before passing it to the next.

## Step 1: Hit/Miss Check

Roll against hit chance. If miss → return 0 damage. Otherwise, check evasion separately.

- **AUTO:** Always hits (100%)
- **MELEE:** Speed vs Enemy Speed
- **RANGED:** Accuracy vs Enemy Speed

## Step 2: Base Damage Calculation

```
Raw Damage = Scaling Stat × Skill Damage Multiplier
```

Scaling stat determined by skill (Strength, Spirit, Intelligence, etc.)

## Step 3: Elemental Effectiveness

Apply element multiplier:
- **Super Effective:** 1.5× damage
- **Resisted:** 0.5× damage
- **Neutral:** 1.0× damage

## Step 4: Critical Hit Check

Roll against crit chance. If crit → apply crit damage multiplier.

## Step 5: Defense Application

Apply defense based on damage type (Physical, Elemental, Mental, or True).

## Damage Properties

| Property | Flat Defense | % Defense | Notes |
|----------|--------------|-----------|-------|
| **NORMAL** | ✅ Applied (max 60%) | ✅ Applied | Standard damage reduction |
| **PIERCING** | ❌ Ignored | ✅ Applied | Bypasses armor |
| **ARMOR_BREAK** | ✅ Applied | ❌ Ignored | Shatters % reduction |
| **TRUE** | ❌ Ignored | ❌ Ignored | Cannot be reduced |

> **Note:** All attacks deal at least 1 damage, regardless of defense.

---

# Defense System

Defense uses a **dual-layer mitigation system** with flat and percentage components applied in order.

## Defense Application Order

### Step 1: Flat Defense Applied First

```
Flat Reduction = min(Flat Defense, Damage × 0.6)
```

Flat defense is **capped at 60%** of incoming damage.

### Step 2: Percent Defense Applied Second

```
Final Damage = (Damage - Flat Reduction) × (1 - Percent Defense)
```

Percentage defense has a **soft cap at 75%**.

## Example Calculation

> **Incoming: 100 Physical Damage**
>
> Strength: 50 → Flat Def: 15, % Def: 20%
>
> - Step 1: Flat = min(15, 100 × 0.6) = min(15, 60) = **15**
> - Step 2: After Flat = 100 - 15 = **85**
> - Step 3: Final = 85 × (1 - 0.20) = **68 damage taken**

## Defense by Damage Type

| Damage Type | Flat Defense From | % Defense From |
|-------------|-------------------|----------------|
| Physical | Strength × 0.3 | Strength / (Strength + 200) |
| Elemental | Spirit × 0.3 | Spirit / (Spirit + 200) |
| Mental | Calmness × 0.25 | Calmness / (Calmness + 150) |
| True | None | None |

---

# Elemental System

The game features **5 main elements** plus Physical and Mental damage types. Elements follow a rock-paper-scissors cycle.

## Element Cycle

```
🔥 Fire → 🌪️ Wind → ⚡ Lightning → 🪨 Earth → 💧 Water → 🔥 Fire
```

## Effectiveness Multipliers

| Matchup | Multiplier | Bonus Effect |
|---------|------------|--------------|
| **Super Effective** (e.g., Fire vs Wind) | `1.5×` | +10% Crit Chance |
| **Resisted** (e.g., Fire vs Water) | `0.5×` | None |
| Neutral | `1.0×` | None |

## Element Relationships

| Element | Strong Against | Weak Against |
|---------|----------------|--------------|
| 🔥 Fire | Wind | Water |
| 🌪️ Wind | Lightning | Fire |
| ⚡ Lightning | Earth | Wind |
| 🪨 Earth | Water | Lightning |
| 💧 Water | Fire | Earth |
| Physical | Neutral to all | Neutral to all |
| Mental | Neutral to all | Neutral to all |

---

# Critical Hits

Critical hits deal bonus damage and can be enhanced through stats, equipment, and elemental advantage.

## Critical Chance Formula

```
Crit% = 8% + (Dexterity × 0.5) + Equipment Bonus + Super Effective Bonus
```

> **Critical Chance Cap:** Maximum crit chance is **75%**, regardless of stats.

## Critical Damage Multipliers

| Attack Type | Base Crit Multiplier | Bonus |
|-------------|---------------------|-------|
| Melee Attacks | `1.75×` | None |
| Ranged Attacks | `1.75×` | `+ (Accuracy × 0.008)` |

## Super Effective Crit Bonus

When attacking with an element that is **super effective** against the enemy, you gain an additional **+10% crit chance** on that attack.

---

# Turn Order & Combat Flow

Combat follows a structured turn-based system with specific phases for each combatant.

## Initiative Determination

```
Player Initiative = 10 + Speed + Terrain Bonus + Approach Bonus + random(0-10)
Enemy Initiative  = 10 + Speed + random(0-10)
```

Higher initiative acts first. If tied, player goes first.

## Player Turn Phases

### 1. UPKEEP Phase
- Pay chakra costs for toggle abilities
- Apply passive HP/Chakra regeneration
- Process any start-of-turn effects

### 2. SIDE Phase
- Use up to 2 SIDE action skills (free actions)
- Items, stances, preparations

### 3. MAIN Phase
- Execute one MAIN action skill
- Calculate damage and apply effects
- Ends your turn

### 4. END Phase
- Combat loops to enemy turn

## Enemy Turn Processing (Detailed Order)

1. **Process DoTs on Enemy** - Bleed, Burn, Poison tick
2. **Decrement Enemy Buffs** - Reduce buff durations
3. **Process DoTs on Player** - Can be absorbed by shield
4. **Decrement Player Buffs** - Reduce buff durations
5. **Death Checks** - Check if anyone died from DoT
6. **Stun Check** - Skip enemy action if stunned
7. **Confusion Check** - 50% chance to hit self for half damage
8. **AI Skill Selection** - Enemy chooses and executes skill
9. **Reduce Player Cooldowns** - Skills become available
10. **Restore Player Chakra** - Apply chakra regeneration
11. **Apply Terrain Hazards** - Environmental effects
12. **Final Death Checks** - Verify combat continuation

---

# Status Effects

Status effects are temporary modifiers that affect combatants. They fall into several categories.

## Damage Over Time (DoT)

| Effect | Type | Duration | Defense Interaction |
|--------|------|----------|---------------------|
| **Bleed** | Physical | 3 turns | 50% defense mitigation |
| **Burn** | Elemental | 3 turns | 50% defense mitigation |
| **Poison** | True | Variable | Bypasses all defense |

### DoT Damage Formula
```
DoT Damage = max(1, floor(Base - FlatDef × 0.5 - PercentDef × 0.5))
```

## Crowd Control

| Effect | Description | Duration |
|--------|-------------|----------|
| **Stun** | Target skips their turn entirely | 1-2 turns |
| **Confusion** | 50% chance to hit self for half damage | 2-3 turns |
| **Silence** | Cannot use jutsu (planned feature) | Variable |

## Buffs & Debuffs

### Buff Application
```
Modified Stat = Original Stat × (1 + Buff Value)
```

### Debuff Application
```
Modified Stat = Original Stat × (1 - Debuff Value)
```

### Common Buffs
- **ATK Up** - Increased damage
- **DEF Up** - Reduced damage taken
- **SPD Up** - Higher hit/evasion
- **Regen** - Heal over time

### Common Debuffs
- **ATK Down** - Reduced damage
- **DEF Down** - Increased damage taken
- **SPD Down** - Lower hit/evasion
- **Curse** - Amplifies damage taken

## Defensive Effects

| Effect | Description | Priority |
|--------|-------------|----------|
| **Invulnerability** | Takes 0 damage from all sources | 1 (Highest) |
| **Reflection** | Returns % of damage to attacker | 2 |
| **Shield** | Absorbs damage before HP | 3 |
| **Guts** | Survive fatal damage at 1 HP | 4 |

---

# Skill System

Skills (jutsu) are the primary means of dealing damage and applying effects in combat.

## Skill Properties

| Property | Description | Examples |
|----------|-------------|----------|
| **Damage Multiplier** | Scales the base damage | 0.8×, 1.2×, 2.5× |
| **Scaling Stat** | Which stat determines damage | Strength, Spirit, Intelligence |
| **Damage Type** | What defense applies | Physical, Elemental, Mental, True |
| **Damage Property** | How defense is applied | Normal, Piercing, Armor Break, True |
| **Attack Method** | Hit calculation type | Melee, Ranged, Auto |
| **Element** | Elemental effectiveness | Fire, Wind, Lightning, Earth, Water |
| **Chakra Cost** | Resource requirement | 0-50 chakra |
| **HP Cost** | Life force payment | 0-30% max HP |
| **Cooldown** | Turns before reuse | 0-5 turns |

## Action Types

### MAIN Action
Primary combat action. Using a MAIN action skill ends your turn.

*Examples: Attacks, major jutsu*

### SIDE Action
Free action performed before your main. Can use up to **2 per turn**.

*Examples: Items, buffs, stance changes*

### TOGGLE
Activate once, pay upkeep cost each turn. Remains active until cancelled.

*Examples: Byakugan, Sharingan*

### PASSIVE
Always active. No action required. Cannot be turned off.

*Examples: Clan traits, innate abilities*

## Attack Methods

| Method | Hit Formula | Description |
|--------|-------------|-------------|
| **AUTO** | Always hits (100%) | Cannot miss or be evaded |
| **MELEE** | Speed vs Enemy Speed | Close-range, uses Speed for accuracy |
| **RANGED** | Accuracy vs Enemy Speed | Long-range, bonus crit damage from Accuracy |

---

# Enemy AI System

Enemies use a **priority scoring system** to select skills each turn.

## AI Scoring Priorities

| Priority | Condition | Points |
|----------|-----------|--------|
| 1 | Self-Heal When Low HP (HP < 30%) | **+60** |
| 2 | Finish Low HP Player (HP < 20% and can kill) | **+50** |
| 3 | Apply Debuffs to Healthy Player (HP > 50%) | **+30** |
| 4 | Self-Buff When Healthy (HP > 40%) | **+25** |
| 5 | High Damage on Wounded Player (20-50% HP) | **+20** |
| 6 | Use High Cooldown Skills (CD ≥ 3) | **+10** |
| 7 | Element Matching (super effective) | **+5** |
| 8 | Randomness Factor | **+0 to +15** |

> **Selection:** The skill with the highest total score is selected. This creates intelligent behavior while maintaining some unpredictability.

## Enemy Archetypes

| Archetype | High Stats | Combat Style |
|-----------|------------|--------------|
| **TANK** | Willpower 22, Strength 18 | High HP, strong defense, outlasts you |
| **ASSASSIN** | Speed 22, Dexterity 18 | Fast, high crit, burst damage |
| **BALANCED** | All stats 12-14 | No major weaknesses or strengths |
| **CASTER** | Spirit 22, Chakra 18 | Elemental damage, ranged attacks |
| **GENJUTSU** | Calmness 22, Intelligence 18 | Mental attacks, status effects |

## Enemy Scaling

### Floor Multiplier
```
Floor Mult = 1 + (Floor × 0.08)
```

### Difficulty Multiplier
```
Diff Mult = 0.75 + (Difficulty / 100)
```

### Total Scaling
```
Total Scaling = Floor Mult × Diff Mult
```

### Example
> Floor 10, Difficulty 50
> - Floor Mult = 1 + (10 × 0.08) = **1.8**
> - Diff Mult = 0.75 + (50 / 100) = **1.25**
> - Total = 1.8 × 1.25 = **2.25× base stats**

---

# Combat Approaches

Before combat, players can choose an **approach** that affects how the battle begins. Each approach has requirements, success chances, and unique effects.

## ⚔️ Frontal Assault

**Requirements:** None (Always Available)

Direct confrontation. No tricks, no advantages, just skill.

| Stat | Value |
|------|-------|
| Success | **100%** |
| XP Multiplier | **1.0×** |
| Bonuses | None |
| Penalties | None |

---

## 🗡️ Silent Strike (Stealth Ambush)

**Requirements:** Speed ≥ 12

Strike from the shadows for massive first-hit damage.

| Stat | Value |
|------|-------|
| Success | 40% + (DEX × 1.5%) |
| Max Success | **95%** |
| XP (Success) | **1.15×** |
| Cost | None |

**On Success:**
- 2.0× damage on first hit
- +50 initiative bonus
- +15% Dexterity buff
- 15% stun chance on first hit

---

## 👁️ Mind Trap (Genjutsu)

**Requirements:** Calmness ≥ 15

Trap the enemy in an illusion before they realize combat has begun.

| Stat | Value |
|------|-------|
| Success | 35% + (INT × 2%) |
| Max Success | **95%** |
| XP (Success) | **1.20×** |
| Cost | **20 Chakra** |

**On Success:**
- Enemy confused (50% self-hit, 2 turns)
- -30% enemy Speed
- +20% Calmness buff

---

## 🪤 Terrain Trap

**Requirements:** Intelligence ≥ 14 + Specific Terrain

Use the environment to damage and debilitate the enemy.

| Stat | Value |
|------|-------|
| Success | 45% + (ACC × 1.2%) |
| Max Success | **90%** |
| XP (Success) | **1.25×** |
| Cost | None |

**On Success:**
- Enemy loses 20% HP before fight
- -15% enemy Strength

---

## 💨 Shadow Passage (Bypass)

**Requirements:** Speed ≥ 35 + Shunshin Skill

> ⚠️ **NOT available vs Elite/Boss enemies**

Move so fast the enemy doesn't even notice you pass by.

| Stat | Value |
|------|-------|
| Success | 30% + (SPD × 1%) |
| Max Success | **95%** |
| Cost | **30 Chakra** |
| XP | **0× (No Combat)** |

**On Success:**
- SKIP COMBAT ENTIRELY
- No fight, no loot, no XP

---

# Equipment Passive Effects

Equipment can have passive effects that trigger under specific conditions during combat.

## Trigger Conditions

| Trigger | When It Fires | Common Effects |
|---------|---------------|----------------|
| `combat_start` | Battle begins | Shield, Invulnerability, Reflection, Free First Skill |
| `on_hit` | Player deals damage | Bleed, Burn, Lifesteal, Chakra Drain, Seal Chance |
| `on_crit` | Player lands critical hit | Enhanced Burn, Pierce Defense |
| `turn_start` | Player's turn begins | Regen, Chakra Restore |
| `on_kill` | Player defeats enemy | Cooldown Reset |
| `below_half_hp` | Player HP drops below 50% | Damage Reduction, Lifesteal boost |

## Effect Types

### Shield Effects
- **SHIELD_ON_START:** Shield = Chakra × (value/100)
- **SHIELD_FLAT:** Gain fixed shield value

### DoT Effects
- **BLEED:** 5-10 physical DoT, 3 turns
- **BURN:** 8-15 elemental DoT, 3 turns
- **POISON:** True damage DoT

### Sustain Effects
- **LIFESTEAL:** Heal % of damage dealt
- **REGEN:** Heal % of max HP per turn
- **CHAKRA_DRAIN:** Steal chakra per hit

### Utility Effects
- **SEAL_CHANCE:** % chance to stun
- **PIERCE_DEFENSE:** Ignore % defense
- **COOLDOWN_RESET:** Reset skills on kill

---

# Special Mechanics

Advanced combat mechanics that can turn the tide of battle.

## 🛡️ Shield

Shields absorb damage before it reaches your HP. When a shield is depleted, any remaining damage carries through to HP.

### Shield Damage Absorption
```
if (Damage ≤ Shield) → HP unchanged, Shield -= Damage
if (Damage > Shield) → HP -= (Damage - Shield), Shield = 0
```

---

## 💀 Guts (Survival)

When damage would reduce your HP to 0 or below, Guts gives you a chance to survive at 1 HP.

### Guts Chance
```
Guts% = Willpower / (Willpower + 200)
```

- Only triggers when you would die (HP → 0)
- On success: HP set to 1
- Maximum **1 Guts proc per turn**

---

## 🔄 Reflection

Returns a percentage of incoming damage back to the attacker. Does NOT reduce the damage you take.

### Reflected Damage
```
Reflected = floor(Incoming Damage × Reflection%)
```

> Reflection is calculated BEFORE shield absorption.

---

## ✨ Invulnerability

The highest priority defensive effect. When invulnerable, you take **0 damage** from all sources.

- Bypasses shields (damage never reaches them)
- Bypasses reflection (no damage to reflect)
- Bypasses curse (no damage to amplify)

---

## ☠️ Curse Mark

Amplifies all incoming damage by a multiplier.

### Cursed Damage
```
Final Damage = Incoming × (1 + Curse Value)
```

> Applied AFTER reflection is calculated.

---

## Damage Mitigation Priority

| Order | Effect | Description |
|-------|--------|-------------|
| 1 | **INVULNERABILITY** | If active, take 0 damage. Skip all other steps. |
| 2 | **REFLECTION** | Calculate reflected damage based on incoming. |
| 3 | **CURSE** | Amplify incoming damage if cursed. |
| 4 | **SHIELD** | Absorb damage with shield before HP. |
| 5 | **GUTS** | If HP would hit 0, roll for survival. |

---

# Constants Reference

Quick reference for all major combat constants.

## Resource Constants

| Constant | Value | Description |
|----------|-------|-------------|
| HP_BASE | 50 | Base HP before stat scaling |
| HP_PER_WILLPOWER | 12 | HP gained per Willpower point |
| CHAKRA_BASE | 30 | Base Chakra before stat scaling |
| CHAKRA_PER_CHAKRA | 8 | Chakra gained per Chakra stat |

## Combat Constants

| Constant | Value | Description |
|----------|-------|-------------|
| BASE_HIT_CHANCE | 92% | Starting hit chance before modifiers |
| HIT_CHANCE_MIN | 30% | Minimum possible hit chance |
| HIT_CHANCE_MAX | 98% | Maximum possible hit chance |
| EVASION_SOFT_CAP | 250 | Speed needed for 50% evasion |
| BASE_CRIT_CHANCE | 8% | Starting crit chance |
| CRIT_PER_DEX | 0.5% | Crit chance per Dexterity |
| CRIT_CHANCE_CAP | 75% | Maximum crit chance |
| BASE_CRIT_MULT | 1.75× | Base critical damage multiplier |

## Defense Soft Caps

| Defense Type | Soft Cap Divisor | Stat for 50% |
|--------------|------------------|--------------|
| Physical | 200 | 200 Strength |
| Elemental | 200 | 200 Spirit |
| Mental | 150 | 150 Calmness |

## Flat Defense Scaling

| Defense Type | Multiplier | Max Reduction |
|--------------|------------|---------------|
| Physical (Strength) | 0.3 | 60% of damage |
| Elemental (Spirit) | 0.3 | 60% of damage |
| Mental (Calmness) | 0.25 | 60% of damage |

---

*忍の道 - The Way of the Ninja*

**SHINOBI WAY: THE INFINITE TOWER** - Combat Mechanics Documentation v1.0
