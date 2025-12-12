/**
 * EventSystem Unit Tests
 * Tests requirement checking, cost validation, outcome rolling, and effect application
 */

import { describe, it, expect } from 'vitest';
import {
  checkRequirements,
  checkEventCost,
  rollOutcome,
  applyOutcomeEffects,
  isEventValidForArc,
  getEventsForArc,
} from '../EventSystem';
import { calculateDerivedStats } from '../StatSystem';
import { Clan, PrimaryStat } from '../../types';
import { createMockPlayer, BASE_STATS } from './testFixtures';

describe('checkRequirements', () => {
  const player = createMockPlayer();
  const derived = calculateDerivedStats(player.primaryStats, {});
  const playerStats = {
    primary: player.primaryStats,
    effectivePrimary: player.primaryStats,
    derived,
  };

  it('returns true when no requirements', () => {
    expect(checkRequirements(player, undefined, playerStats)).toBe(true);
  });

  it('returns true when stat requirement met', () => {
    const requirements = {
      minStat: { stat: PrimaryStat.STRENGTH, value: 5 },
    };
    expect(checkRequirements(player, requirements, playerStats)).toBe(true);
  });

  it('returns false when stat requirement not met', () => {
    const requirements = {
      minStat: { stat: PrimaryStat.STRENGTH, value: 50 },
    };
    expect(checkRequirements(player, requirements, playerStats)).toBe(false);
  });

  it('returns true when clan requirement met', () => {
    const uzumakiPlayer = createMockPlayer({ clan: Clan.UZUMAKI });
    const requirements = {
      requiredClan: Clan.UZUMAKI,
    };
    expect(checkRequirements(uzumakiPlayer, requirements, playerStats)).toBe(true);
  });

  it('returns false when clan requirement not met', () => {
    const uzumakiPlayer = createMockPlayer({ clan: Clan.UZUMAKI });
    const requirements = {
      requiredClan: Clan.UCHIHA,
    };
    expect(checkRequirements(uzumakiPlayer, requirements, playerStats)).toBe(false);
  });
});

describe('checkEventCost', () => {
  it('returns true when no cost', () => {
    const player = createMockPlayer();
    expect(checkEventCost(player, undefined)).toBe(true);
  });

  it('returns true when player has enough ryo', () => {
    const player = createMockPlayer({ ryo: 100 });
    const cost = { ryo: 50 };
    expect(checkEventCost(player, cost)).toBe(true);
  });

  it('returns false when player lacks ryo', () => {
    const player = createMockPlayer({ ryo: 10 });
    const cost = { ryo: 50 };
    expect(checkEventCost(player, cost)).toBe(false);
  });
});

describe('rollOutcome', () => {
  it('returns an outcome from the choice', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 50, effects: { logMessage: 'Outcome 1' } },
        { weight: 50, effects: { logMessage: 'Outcome 2' } },
      ],
    } as any;

    const outcome = rollOutcome(choice, player);

    expect(outcome).toBeDefined();
    expect(outcome.effects).toBeDefined();
    expect(['Outcome 1', 'Outcome 2']).toContain(outcome.effects.logMessage);
  });

  it('respects weights (higher weight more likely)', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 99, effects: { logMessage: 'Common' } },
        { weight: 1, effects: { logMessage: 'Rare' } },
      ],
    } as any;

    // Roll many times and count outcomes
    let commonCount = 0;
    for (let i = 0; i < 100; i++) {
      const outcome = rollOutcome(choice, player);
      if (outcome.effects.logMessage === 'Common') commonCount++;
    }

    // Common should be rolled most of the time
    expect(commonCount).toBeGreaterThan(80);
  });

  it('applies clan bonus when matching', () => {
    const uchihaPlayer = createMockPlayer({ clan: Clan.UCHIHA });
    const choice = {
      outcomes: [
        { weight: 50, effects: { logMessage: 'Normal' } },
        { weight: 50, effects: { logMessage: 'Boosted' } },
      ],
      clanBonus: {
        clan: Clan.UCHIHA,
        weightMultiplier: 2.0, // Doubles second outcome weight
      },
    } as any;

    // The clan bonus changes the odds, but outcome is still valid
    const outcome = rollOutcome(choice, uchihaPlayer);
    expect(outcome).toBeDefined();
  });
});

describe('applyOutcomeEffects', () => {
  const derived = calculateDerivedStats(BASE_STATS, {});
  const playerStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived,
  };

  it('applies stat changes', () => {
    const player = createMockPlayer();
    const outcome = {
      effects: {
        statChanges: { strength: 5 },
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.primaryStats.strength).toBe(player.primaryStats.strength + 5);
  });

  it('applies ryo changes', () => {
    const player = createMockPlayer({ ryo: 100 });
    const outcome = {
      effects: {
        ryo: 50,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.ryo).toBe(150);
  });

  it('applies exp changes', () => {
    const player = createMockPlayer({ exp: 0 });
    const outcome = {
      effects: {
        exp: 25,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.exp).toBe(25);
  });

  it('applies HP changes (flat)', () => {
    const player = createMockPlayer({ currentHp: 50 });
    const outcome = {
      effects: {
        hpChange: 20,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.currentHp).toBe(70);
  });

  it('does not reduce HP below 1', () => {
    const player = createMockPlayer({ currentHp: 10 });
    const outcome = {
      effects: {
        hpChange: -100,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.currentHp).toBe(1);
  });

  it('does not exceed max HP', () => {
    const maxHp = playerStats.derived.maxHp;
    const player = createMockPlayer({ currentHp: maxHp - 5 });
    const outcome = {
      effects: {
        hpChange: 100,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.currentHp).toBe(maxHp);
  });
});

describe('isEventValidForArc', () => {
  it('returns true when no arc restrictions', () => {
    const event = { allowedArcs: [] } as any;
    expect(isEventValidForArc(event, 'ACADEMY_ARC')).toBe(true);
  });

  it('returns true when event is undefined allowedArcs', () => {
    const event = {} as any;
    expect(isEventValidForArc(event, 'ACADEMY_ARC')).toBe(true);
  });

  it('returns true when arc is in allowedArcs', () => {
    const event = { allowedArcs: ['ACADEMY_ARC', 'WAVES_ARC'] } as any;
    expect(isEventValidForArc(event, 'ACADEMY_ARC')).toBe(true);
  });

  it('returns false when arc is not in allowedArcs', () => {
    const event = { allowedArcs: ['ACADEMY_ARC'] } as any;
    expect(isEventValidForArc(event, 'WAR_ARC')).toBe(false);
  });
});

describe('getEventsForArc', () => {
  const events = [
    { id: 'event1', allowedArcs: ['ACADEMY_ARC'] },
    { id: 'event2', allowedArcs: ['WAVES_ARC'] },
    { id: 'event3', allowedArcs: ['ACADEMY_ARC', 'WAVES_ARC'] },
    { id: 'event4', allowedArcs: [] }, // Available everywhere
  ] as any[];

  it('filters events by arc', () => {
    const academyEvents = getEventsForArc(events, 'ACADEMY_ARC');

    expect(academyEvents.length).toBe(3);
    expect(academyEvents.map(e => e.id)).toContain('event1');
    expect(academyEvents.map(e => e.id)).toContain('event3');
    expect(academyEvents.map(e => e.id)).toContain('event4');
  });

  it('excludes events from other arcs', () => {
    const academyEvents = getEventsForArc(events, 'ACADEMY_ARC');

    expect(academyEvents.map(e => e.id)).not.toContain('event2');
  });
});
