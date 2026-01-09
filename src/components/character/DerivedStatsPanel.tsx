import React from 'react';
import { DerivedStats } from '../../game/types';
import { Shield, Flame, Eye } from 'lucide-react';
import Tooltip from '../shared/Tooltip';
import { formatPercent } from '../../game/systems/StatSystem';
import './character.css';

interface DerivedStatsPanelProps {
  derived: DerivedStats;
}

const DerivedStatsPanel: React.FC<DerivedStatsPanelProps> = ({ derived }) => {
  const renderDerivedStat = (
    label: string,
    value: string | number,
    description: string,
    valueClass: string
  ) => {
    const tooltipContent = (
      <div className="derived-stats__tooltip">
        <div className="derived-stats__tooltip-title">{label}</div>
        <div className="derived-stats__tooltip-desc">{description}</div>
      </div>
    );

    return (
      <Tooltip content={tooltipContent} position="right">
        <div className="derived-stats__stat">
          <span className="derived-stats__stat-label">{label}</span>
          <span className={`derived-stats__stat-value ${valueClass}`}>{value}</span>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="derived-stats">
      <h3 className="derived-stats__title">Derived Stats</h3>

      {/* Defense Breakdown */}
      <div className="derived-stats__defense-grid">
        <div className="derived-stats__defense-card">
          <div className="derived-stats__defense-label derived-stats__defense-label--physical">
            <Shield size={8} /> Physical
          </div>
          <div className="derived-stats__defense-value">
            <span className="derived-stats__defense-flat--physical">{derived.physicalDefenseFlat}</span>
            <span className="derived-stats__defense-separator">+</span>
            <span className="derived-stats__defense-percent--physical">{formatPercent(derived.physicalDefensePercent)}</span>
          </div>
        </div>
        <div className="derived-stats__defense-card">
          <div className="derived-stats__defense-label derived-stats__defense-label--elemental">
            <Flame size={8} /> Elemental
          </div>
          <div className="derived-stats__defense-value">
            <span className="derived-stats__defense-flat--elemental">{derived.elementalDefenseFlat}</span>
            <span className="derived-stats__defense-separator">+</span>
            <span className="derived-stats__defense-percent--elemental">{formatPercent(derived.elementalDefensePercent)}</span>
          </div>
        </div>
        <div className="derived-stats__defense-card">
          <div className="derived-stats__defense-label derived-stats__defense-label--mental">
            <Eye size={8} /> Mental
          </div>
          <div className="derived-stats__defense-value">
            <span className="derived-stats__defense-flat--mental">{derived.mentalDefenseFlat}</span>
            <span className="derived-stats__defense-separator">+</span>
            <span className="derived-stats__defense-percent--mental">{formatPercent(derived.mentalDefensePercent)}</span>
          </div>
        </div>
      </div>

      {/* Other Derived Stats */}
      <div className="derived-stats__list">
        {renderDerivedStat("Evasion", formatPercent(derived.evasion), "Chance to dodge attacks. Based on Speed.", "derived-stats__stat-value--evasion")}
        {renderDerivedStat("Crit Chance", `${Math.round(derived.critChance)}%`, "Chance to deal critical damage. Based on Dexterity.", "derived-stats__stat-value--crit")}
        {renderDerivedStat("Melee Crit", `${derived.critDamageMelee.toFixed(2)}x`, "Critical damage multiplier for melee attacks.", "derived-stats__stat-value--melee")}
        {renderDerivedStat("Ranged Crit", `${derived.critDamageRanged.toFixed(2)}x`, "Critical damage multiplier for ranged attacks. Boosted by Accuracy.", "derived-stats__stat-value--ranged")}
        {renderDerivedStat("Status Resist", formatPercent(derived.statusResistance), "Chance to resist debuffs. Based on Calmness.", "derived-stats__stat-value--resist")}
        {renderDerivedStat("Guts", formatPercent(derived.gutsChance), "Chance to survive a fatal blow at 1 HP. Based on Willpower.", "derived-stats__stat-value--guts")}
        {renderDerivedStat("HP Regen", `${derived.hpRegen}/turn`, "Health restored each turn. Based on Willpower.", "derived-stats__stat-value--hp-regen")}
        {renderDerivedStat("Chakra Regen", `${derived.chakraRegen}/turn`, "Chakra restored each turn. Based on Intelligence.", "derived-stats__stat-value--chakra-regen")}
      </div>
    </div>
  );
};

export default DerivedStatsPanel;
