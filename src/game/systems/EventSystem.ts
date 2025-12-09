/**
 * =============================================================================
 * EVENT SYSTEM - Narrative Events & Choice Resolution
 * =============================================================================
 *
 * This system handles branching narrative events with player choices,
 * requirements, costs, and weighted random outcomes.
 *
 * ## EVENT STRUCTURE
 *
 * Events consist of:
 * 1. **Description**: Narrative text describing the situation
 * 2. **Choices**: Available player responses (may be restricted)
 * 3. **Outcomes**: Weighted random results for each choice
 * 4. **Effects**: Stat changes, items, buffs applied on resolution
 *
 * ## CHOICE VALIDATION
 *
 * Choices can have requirements and costs:
 *
 * ### Requirements (must be met to select)
 * - **minStat**: Minimum value for a primary stat
 * - **requiredClan**: Must be a specific clan
 *
 * ### Costs (deducted when choice is made)
 * - **ryo**: Currency cost
 *
 * ## OUTCOME ROLLING
 *
 * Each choice has weighted outcomes:
 * - Higher weight = more likely to occur
 * - Clan bonuses can reweight outcomes for matching clans
 *
 * Weighted roll algorithm:
 * 1. Sum all outcome weights
 * 2. Roll random value 0 to total
 * 3. Iterate outcomes, subtracting weights until roll ≤ 0
 * 4. Return that outcome
 *
 * ## OUTCOME EFFECTS
 *
 * Effects that can be applied:
 * - **statChanges**: Modify primary stats (+/-)
 * - **exp**: Grant experience points
 * - **ryo**: Grant/deduct currency
 * - **hpChange**: Heal/damage (flat or % of max)
 * - **chakraChange**: Restore/drain (flat or % of max)
 * - **buffs**: Apply temporary effects
 * - **triggerCombat**: Start a fight after event
 *
 * ## STORY ARC FILTERING
 *
 * Events can be restricted to specific story arcs:
 * - ACADEMY_ARC (floors 1-10)
 * - WAVES_ARC (floors 11-25)
 * - EXAMS_ARC (floors 26-50)
 * - ROGUE_ARC (floors 51-75)
 * - WAR_ARC (floors 76+)
 *
 * =============================================================================
 */

import {
  EnhancedEventChoice,
  EventOutcome,
  Player,
  RequirementCheck,
  EventCost,
  PrimaryStat,
  EnhancedGameEventDefinition,
} from '../types';

/**
 * Check if a player meets all requirements for an event choice.
 * Used to determine if a choice should be enabled or disabled.
 *
 * @param player - Current player state
 * @param requirements - Optional requirements to check
 * @param playerStats - Derived stats for HP/Chakra calculations
 * @returns true if all requirements are met
 */
export const checkRequirements = (
  player: Player,
  requirements: RequirementCheck | undefined,
  playerStats: any, // DerivedStats
): boolean => {
  if (!requirements) return true;

  // Check stat requirement
  if (requirements.minStat) {
    const stat = requirements.minStat.stat;
    const requiredValue = requirements.minStat.value;
    const currentValue = player.primaryStats[stat.toLowerCase() as keyof typeof player.primaryStats];

    if (typeof currentValue !== 'number' || currentValue < requiredValue) {
      return false;
    }
  }

  // Check clan requirement
  if (requirements.requiredClan && player.clan !== requirements.requiredClan) {
    return false;
  }

  return true;
};

/**
 * Check if a player can afford the cost of a choice
 */
export const checkEventCost = (
  player: Player,
  cost: EventCost | undefined,
): boolean => {
  if (!cost) return true;

  if (cost.ryo && player.ryo < cost.ryo) {
    return false;
  }

  return true;
};

/**
 * Get description of why a choice is disabled
 */
export const getDisabledReason = (
  player: Player,
  requirements: RequirementCheck | undefined,
  cost: EventCost | undefined,
  playerStats: any,
): string => {
  if (!requirements && !cost) return '';

  if (requirements) {
    if (requirements.minStat) {
      return `Requires ${requirements.minStat.value} ${requirements.minStat.stat}`;
    }

    if (requirements.requiredClan) {
      return `Clan restriction: ${requirements.requiredClan}`;
    }
  }

  if (cost) {
    if (cost.ryo && player.ryo < cost.ryo) {
      return `Not enough Ryo (Costs: ${cost.ryo}, Have: ${player.ryo})`;
    }
  }

  return 'Cannot perform this action';
};

/**
 * Roll an outcome from weighted outcomes
 * Applies clan bonuses if applicable
 */
export const rollOutcome = (
  choice: EnhancedEventChoice,
  player: Player,
): EventOutcome => {
  let outcomes = [...choice.outcomes];

  // Apply clan bonus if applicable
  if (choice.clanBonus && choice.clanBonus.clan === player.clan) {
    outcomes = outcomes.map((outcome) => ({
      ...outcome,
      weight: outcome.weight * choice.clanBonus!.weightMultiplier,
    }));

    // Renormalize weights
    const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
    outcomes = outcomes.map((outcome) => ({
      ...outcome,
      weight: (outcome.weight / totalWeight) * 100,
    }));
  }

  // Roll the outcome based on weights
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const outcome of outcomes) {
    roll -= outcome.weight;
    if (roll <= 0) {
      return outcome;
    }
  }

  // Fallback to last outcome (shouldn't happen if weights are correct)
  return outcomes[outcomes.length - 1];
};

/**
 * Apply outcome effects to a player
 * Returns updated player or null if validation fails
 */
export const applyOutcomeEffects = (
  player: Player,
  outcome: EventOutcome,
  playerStats: any, // DerivedStats
): Player => {
  let updated = { ...player };
  const effects = outcome.effects;

  // Apply stat changes
  if (effects.statChanges) {
    updated.primaryStats = { ...updated.primaryStats };
    Object.entries(effects.statChanges).forEach(([stat, value]) => {
      if (typeof value === 'number') {
        (updated.primaryStats as any)[stat] = Math.max(1, (updated.primaryStats as any)[stat] + value);
      }
    });
  }

  // Apply XP
  if (effects.exp) {
    updated.exp += effects.exp;
  }

  // Apply Ryo
  if (effects.ryo) {
    updated.ryo += effects.ryo;
  }

  // Apply HP changes
  if (effects.hpChange) {
    if (typeof effects.hpChange === 'number') {
      updated.currentHp = Math.max(1, updated.currentHp + effects.hpChange);
    } else if (effects.hpChange.percent) {
      const hpChange = Math.floor(playerStats.derived.maxHp * (effects.hpChange.percent / 100));
      updated.currentHp = Math.max(1, updated.currentHp + hpChange);
    }
    updated.currentHp = Math.min(playerStats.derived.maxHp, updated.currentHp);
  }

  // Apply Chakra changes
  if (effects.chakraChange) {
    if (typeof effects.chakraChange === 'number') {
      updated.currentChakra = Math.max(0, updated.currentChakra + effects.chakraChange);
    } else if (effects.chakraChange.percent) {
      const chakraChange = Math.floor(
        playerStats.derived.maxChakra * (effects.chakraChange.percent / 100),
      );
      updated.currentChakra = Math.max(0, updated.currentChakra + chakraChange);
    }
    updated.currentChakra = Math.min(playerStats.derived.maxChakra, updated.currentChakra);
  }

  // Apply buffs (store for combat system)
  if (effects.buffs) {
    updated.activeBuffs = [...updated.activeBuffs, ...effects.buffs];
  }

  return updated;
};

/**
 * Resolve a complete event choice
 * Returns { player, outcome, message, triggerCombat? }
 */
export const resolveEventChoice = (
  player: Player,
  choice: EnhancedEventChoice,
  playerStats: any,
): {
  success: boolean;
  player: Player | null;
  outcome: EventOutcome | null;
  message: string;
  triggerCombat?: boolean;
} => {
  // Check requirements
  if (!checkRequirements(player, choice.requirements, playerStats)) {
    return {
      success: false,
      player: null,
      outcome: null,
      message: getDisabledReason(player, choice.requirements, choice.costs, playerStats),
    };
  }

  // Check cost
  if (!checkEventCost(player, choice.costs)) {
    return {
      success: false,
      player: null,
      outcome: null,
      message: getDisabledReason(player, choice.requirements, choice.costs, playerStats),
    };
  }

  // Apply costs first
  let updated = { ...player };
  if (choice.costs) {
    if (choice.costs.ryo) {
      updated.ryo = Math.max(0, updated.ryo - choice.costs.ryo);
    }
  }

  // Roll outcome
  const outcome = rollOutcome(choice, updated);

  // Apply outcome effects
  updated = applyOutcomeEffects(updated, outcome, playerStats);

  return {
    success: true,
    player: updated,
    outcome,
    message: outcome.effects.logMessage,
    triggerCombat: !!outcome.effects.triggerCombat,
  };
};

/**
 * Check if an event is valid for a story arc
 */
export const isEventValidForArc = (event: EnhancedGameEventDefinition, arcName: string): boolean => {
  if (!event.allowedArcs || event.allowedArcs.length === 0) {
    return true; // No restrictions
  }

  return event.allowedArcs.includes(arcName);
};

/**
 * Filter events by arc
 */
export const getEventsForArc = (
  allEvents: EnhancedGameEventDefinition[],
  arcName: string,
): EnhancedGameEventDefinition[] => {
  return allEvents.filter((event) => isEventValidForArc(event, arcName));
};
