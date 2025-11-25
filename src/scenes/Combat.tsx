import React from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
  SkillTier
} from '../game/types';
import StatBar from '../components/StatBar';
import Tooltip from '../components/Tooltip';
import {
  Hourglass
} from 'lucide-react';
import { calculateDamage, formatPercent } from '../game/systems/StatSystem';
import { getElementEffectiveness } from '../game/constants';

interface CombatProps {
  player: Player;
  playerStats: CharacterStats;
  enemy: Enemy;
  enemyStats: CharacterStats;
  turnState: 'PLAYER' | 'ENEMY_TURN';
  onUseSkill: (skill: Skill) => void;
  onPassTurn: () => void;
  droppedSkill?: Skill | null;
  getDamageTypeColor: (dt: DamageType) => string;
  getRarityColor: (rarity: string) => string;
}

const Combat: React.FC<CombatProps> = ({
  player,
  playerStats,
  enemy,
  enemyStats,
  turnState,
  onUseSkill,
  onPassTurn,
  droppedSkill,
  getDamageTypeColor,
  getRarityColor
}) => {
  return (
    <div className="w-full max-w-4xl z-10 flex flex-col h-full justify-center">
      <div className="mb-8 flex flex-col items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-8 w-full">
          {/* Enemy Portrait */}
          {enemy.image && (
            <div className="relative w-40 h-40 shrink-0 bg-black border border-zinc-800 flex items-center justify-center overflow-hidden">
              <img src={enemy.image} alt={enemy.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Enemy Stats */}
          <div className="flex-1 w-full">
            <div className={`text-3xl font-black mb-3 tracking-tight uppercase ${enemy.isBoss ? 'text-red-600' : 'text-zinc-200'}`}>
              {enemy.name}
            </div>
            <div className="w-full max-w-md mb-2">
              <StatBar current={enemy.currentHp} max={enemyStats.derived.maxHp} label="" color="red" />
            </div>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">
              <span>{enemy.tier}</span>
              <span>Affinity: <span className="text-zinc-300">{enemy.element}</span></span>
            </div>
            {/* Enemy Defense Display */}
            <div className="flex gap-2 text-[9px] font-mono text-zinc-600 mb-2">
              <span className="text-orange-600">Phys: {enemyStats.derived.physicalDefenseFlat}+{formatPercent(enemyStats.derived.physicalDefensePercent)}</span>
              <span className="text-purple-600">Elem: {enemyStats.derived.elementalDefenseFlat}+{formatPercent(enemyStats.derived.elementalDefensePercent)}</span>
              <span className="text-indigo-600">Mind: {enemyStats.derived.mentalDefenseFlat}+{formatPercent(enemyStats.derived.mentalDefensePercent)}</span>
            </div>
            {/* Enemy Buffs */}
            <div className="flex gap-2 h-5 flex-wrap">
              {enemy.activeBuffs.map(buff => (
                <div key={buff.id} className="px-1.5 py-0.5 bg-red-950 border border-red-900 text-[8px] text-red-300 rounded">
                  {buff.name} ({buff.duration})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {player.skills.map(skill => {
          const canUse = player.currentChakra >= skill.chakraCost && player.currentHp > skill.hpCost && skill.currentCooldown === 0;
          const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
          const isEnemyTurn = turnState === 'ENEMY_TURN';

          // Predicted damage
          const prediction = calculateDamage(
            playerStats.effectivePrimary,
            playerStats.derived,
            enemyStats.effectivePrimary,
            enemyStats.derived,
            skill,
            player.element,
            enemy.element
          );

          // Calculate effectiveness for UI
          const effectiveness = getElementEffectiveness(skill.element, enemy.element);
          let borderColor = 'border-zinc-800';
          let effectivenessIcon = null;

          if (effectiveness > 1.0) {
            borderColor = 'border-green-600';
            effectivenessIcon = <div className="absolute top-1 right-1 text-green-500 text-[10px] font-bold z-20">▲</div>;
          } else if (effectiveness < 1.0) {
            borderColor = 'border-red-900';
            effectivenessIcon = <div className="absolute top-1 right-1 text-red-500 text-[10px] font-bold z-20">▼</div>;
          }

          // Override border if unusable or toggle active
          if (!((canUse || skill.isActive) && !isStunned && !isEnemyTurn)) {
            borderColor = 'border-zinc-900';
          } else if (skill.isToggle && skill.isActive) {
            borderColor = 'border-blue-500';
          }

          return (
            <Tooltip
              key={skill.id}
              content={
                <div className="space-y-2 p-1 max-w-[220px]">
                  <div className="font-bold text-zinc-200 flex justify-between">
                    <span>{skill.name}</span>
                    <span className="text-yellow-500">Lv.{skill.level || 1}</span>
                  </div>
                  <div className="text-xs text-zinc-400">{skill.description}</div>
                  <div className="border-t border-zinc-700 my-2 pt-2 space-y-1 text-[10px] font-mono text-zinc-500">
                    <div className="flex justify-between">
                      <span>Damage Type</span>
                      <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Property</span>
                      <span className="text-zinc-300">{skill.damageProperty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method</span>
                      <span className="text-zinc-300">{skill.attackMethod}</span>
                    </div>
                    {skill.requirements?.intelligence && (
                      <div className="flex justify-between text-cyan-400">
                        <span>Requires INT</span>
                        <span>{skill.requirements.intelligence}</span>
                      </div>
                    )}
                  </div>
                </div>
              }
            >
              <button
                onClick={() => onUseSkill(skill)}
                disabled={(!canUse && !skill.isActive) || isStunned || isEnemyTurn}
                className={`w-full relative p-3 h-28 text-left border transition-all group flex flex-col justify-between overflow-hidden
                  ${
                    (canUse || skill.isActive) && !isStunned && !isEnemyTurn
                      ? `bg-zinc-900 ${borderColor} hover:border-zinc-500`
                      : 'bg-black border-zinc-900 opacity-40 cursor-not-allowed'
                  }
                  ${skill.isToggle && skill.isActive ? 'bg-blue-900/20' : ''}`}
              >
                {effectivenessIcon}
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs text-zinc-200 mb-0.5">{skill.name}</div>
                    {(skill.level || 1) > 1 && <div className="text-[8px] text-yellow-500 font-mono">Lv.{skill.level}</div>}
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                    <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType.charAt(0)}</span>
                    <span>{skill.element}</span>
                  </div>
                </div>

                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-right pointer-events-none">
                  <div className="text-[8px] font-black uppercase text-zinc-700">DMG</div>
                  <div className="text-2xl font-black font-serif text-zinc-800 leading-none">{prediction.finalDamage > 0 && !prediction.isMiss ? prediction.finalDamage : '-'}</div>
                </div>

                <div className="flex justify-between text-[9px] font-mono relative z-10 mt-auto">
                  <span className={skill.chakraCost > 0 ? 'text-blue-400' : 'text-zinc-700'}>{skill.chakraCost > 0 ? `${skill.chakraCost} CP` : '-'}</span>
                  <span className={skill.hpCost > 0 ? 'text-red-400' : 'text-zinc-700'}>{skill.hpCost > 0 ? `${skill.hpCost} HP` : '-'}</span>
                </div>

                {skill.currentCooldown > 0 && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center text-2xl font-black text-zinc-700 z-20">{skill.currentCooldown}</div>
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3 flex justify-center">
        <button
          onClick={onPassTurn}
          disabled={turnState === 'ENEMY_TURN'}
          className={`flex items-center gap-2 px-4 py-2 bg-black border border-zinc-800 ${
            turnState === 'ENEMY_TURN' ? 'opacity-50' : 'hover:border-zinc-600'
          }`}
        >
          <Hourglass size={12} className="text-zinc-600" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {turnState === 'ENEMY_TURN' ? 'Enemy Turn...' : 'Pass Turn'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Combat;
