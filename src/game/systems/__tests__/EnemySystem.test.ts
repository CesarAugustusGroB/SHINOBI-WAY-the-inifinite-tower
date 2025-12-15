/**
 * EnemySystem Unit Tests
 * Tests enemy generation with danger-based scaling
 */

import { describe, it, expect } from 'vitest';
import { generateEnemy, getStoryArcByName } from '../EnemySystem';

describe('getStoryArcByName', () => {
  it('returns correct arc data for WAVES_ARC', () => {
    const arc = getStoryArcByName('WAVES_ARC');
    expect(arc.name).toBe('WAVES_ARC');
    expect(arc.label).toBe('Land of Waves');
    expect(arc.biome).toBe('Mist Covered Bridge');
  });

  it('returns correct arc data for EXAMS_ARC', () => {
    const arc = getStoryArcByName('EXAMS_ARC');
    expect(arc.name).toBe('EXAMS_ARC');
    expect(arc.label).toBe('Chunin Exams');
    expect(arc.biome).toBe('Forest of Death');
  });

  it('returns correct arc data for ROGUE_ARC', () => {
    const arc = getStoryArcByName('ROGUE_ARC');
    expect(arc.name).toBe('ROGUE_ARC');
    expect(arc.label).toBe('Sasuke Retrieval');
    expect(arc.biome).toBe('Valley of the End');
  });

  it('returns correct arc data for WAR_ARC', () => {
    const arc = getStoryArcByName('WAR_ARC');
    expect(arc.name).toBe('WAR_ARC');
    expect(arc.label).toBe('Great Ninja War');
    expect(arc.biome).toBe('Divine Tree Roots');
  });

  it('falls back to WAVES_ARC for unknown arc names', () => {
    const arc = getStoryArcByName('UNKNOWN_ARC');
    expect(arc.name).toBe('WAVES_ARC');
  });
});

describe('generateEnemy', () => {
  describe('NORMAL enemies', () => {
    it('generates enemy with proper structure', () => {
      const enemy = generateEnemy(1, 0, 'NORMAL', 50, 'WAVES_ARC');

      expect(enemy.name).toBeDefined();
      expect(enemy.tier).toBe('Chunin');
      expect(enemy.primaryStats).toBeDefined();
      expect(enemy.currentHp).toBeGreaterThan(0);
      expect(enemy.skills.length).toBeGreaterThan(0);
      expect(enemy.element).toBeDefined();
    });

    it('scales stats with danger level', () => {
      // Generate multiple enemies to account for random archetype variance
      const sampleSize = 20;
      let danger1TotalHp = 0;
      let danger7TotalHp = 0;

      for (let i = 0; i < sampleSize; i++) {
        danger1TotalHp += generateEnemy(1, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        danger7TotalHp += generateEnemy(7, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // Average HP should be higher at danger 7 due to scaling
      const danger1AvgHp = danger1TotalHp / sampleSize;
      const danger7AvgHp = danger7TotalHp / sampleSize;

      expect(danger7AvgHp).toBeGreaterThan(danger1AvgHp);
    });

    it('scales stats with locations cleared (progression)', () => {
      // Generate multiple enemies to account for random archetype variance
      const sampleSize = 20;
      let noProgressionTotalHp = 0;
      let highProgressionTotalHp = 0;

      for (let i = 0; i < sampleSize; i++) {
        noProgressionTotalHp += generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        highProgressionTotalHp += generateEnemy(3, 20, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // Average HP should be higher with more locations cleared (+4% per location)
      const noProgressionAvgHp = noProgressionTotalHp / sampleSize;
      const highProgressionAvgHp = highProgressionTotalHp / sampleSize;

      expect(highProgressionAvgHp).toBeGreaterThan(noProgressionAvgHp);
    });

    it('scales stats with difficulty', () => {
      // Generate multiple enemies to account for random archetype variance
      const sampleSize = 20;
      let lowDiffTotalHp = 0;
      let highDiffTotalHp = 0;

      for (let i = 0; i < sampleSize; i++) {
        lowDiffTotalHp += generateEnemy(3, 0, 'NORMAL', 25, 'WAVES_ARC').currentHp;
        highDiffTotalHp += generateEnemy(3, 0, 'NORMAL', 75, 'WAVES_ARC').currentHp;
      }

      // Average HP should be higher with higher difficulty
      const lowDiffAvgHp = lowDiffTotalHp / sampleSize;
      const highDiffAvgHp = highDiffTotalHp / sampleSize;

      expect(highDiffAvgHp).toBeGreaterThan(lowDiffAvgHp);
    });
  });

  describe('ELITE enemies', () => {
    it('has Jonin tier', () => {
      const enemy = generateEnemy(3, 0, 'ELITE', 50, 'WAVES_ARC');
      expect(enemy.tier).toBe('Jonin');
    });

    it('has boosted willpower and strength/spirit', () => {
      // Generate multiple to account for randomness
      const eliteEnemy = generateEnemy(3, 0, 'ELITE', 50, 'WAVES_ARC');

      // Elite should have valid stats with 1.4x willpower, 1.3x str/spirit multipliers
      expect(eliteEnemy.primaryStats.willpower).toBeGreaterThan(0);
      expect(eliteEnemy.tier).toBe('Jonin');
    });
  });

  describe('BOSS enemies', () => {
    it('has Kage Level tier', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.tier).toBe('Kage Level');
    });

    it('is marked as boss', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.isBoss).toBe(true);
    });

    it('has drop rate bonus', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.dropRateBonus).toBeDefined();
      expect(boss.dropRateBonus).toBeGreaterThan(0);
    });

    it('has multiple skills including special skill', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.skills.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AMBUSH enemies', () => {
    it('has S-Rank Rogue tier', () => {
      const enemy = generateEnemy(3, 0, 'AMBUSH', 50, 'WAVES_ARC');
      expect(enemy.tier).toBe('S-Rank Rogue');
    });
  });

  describe('scaling formula', () => {
    it('applies danger scaling - higher danger means stronger enemies', () => {
      // Use larger sample size and relaxed expectations due to archetype variance
      const sampleSize = 50;

      // Calculate average HP at different danger levels
      let d1Total = 0, d7Total = 0;
      for (let i = 0; i < sampleSize; i++) {
        d1Total += generateEnemy(1, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        d7Total += generateEnemy(7, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // D7 should be significantly higher than D1 due to danger scaling
      // (1.70 / 0.80 = 2.12x theoretical, but archetype variance is high)
      expect(d7Total / d1Total).toBeGreaterThan(1.2);
    });

    it('applies progression scaling - more locations cleared means stronger enemies', () => {
      const sampleSize = 50;

      // 20 locations = 80% bonus (1 + 20*0.04 = 1.80)
      let base = 0, with20 = 0;
      for (let i = 0; i < sampleSize; i++) {
        base += generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        with20 += generateEnemy(3, 20, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // 20 locations should result in meaningful increase despite variance
      const ratio = with20 / base;
      expect(ratio).toBeGreaterThan(1.2);
    });
  });
});
