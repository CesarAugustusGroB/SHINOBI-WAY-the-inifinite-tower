import React from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
} from '../game/types';
import StatBar from '../components/StatBar';
import Tooltip from '../components/Tooltip';
import { SkillCard } from '../components/SkillCard';
import { CinematicViewscreen } from '../components/CinematicViewscreen';
import { Hourglass } from 'lucide-react';
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
  getDamageTypeColor
}) => {
  return (
    <div className="w-full max-w-6xl z-10 flex flex-col h-full">

      {/* CINEMATIC BATTLE HEADER */}
      <CinematicViewscreen
        image={enemy.image || '/assets/image_3b2b13.jpg'}
        overlayContent={
          <div className="flex justify-between w-full h-full">

            {/* LEFT: Enemy Stats Overlay */}
            <div className="w-full max-w-md flex flex-col justify-start pt-2">
              {/* Name */}
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-serif">
                {enemy.name}
              </h1>

              {/* HP Bar with specific styling from reference */}
              <div className="mt-2 mb-1 relative">
                <StatBar
                  current={enemy.currentHp}
                  max={enemyStats.derived.maxHp}
                  color="red"
                  className="h-4"
                  showValue={false}
                />
                <div className="absolute -top-5 right-0 text-sm font-mono font-bold text-white drop-shadow-md">
                  {enemy.currentHp} / {enemyStats.derived.maxHp}
                </div>
              </div>

              {/* Tier & Affinity */}
              <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                <span className="bg-zinc-950/50 px-2 py-1 rounded border border-zinc-800">{enemy.tier}</span>
                <span className="bg-zinc-950/50 px-2 py-1 rounded border border-zinc-800">
                  Affinity: <span className="text-zinc-100 font-bold">{enemy.element}</span>
                </span>
              </div>

              {/* Detailed Stats (Small) */}
              <div className="mt-2 flex gap-3 text-[9px] font-mono text-zinc-500 opacity-80 hover:opacity-100 transition-opacity cursor-help">
                <span>Phys: <span className="text-orange-400">{enemyStats.derived.physicalDefenseFlat}+{formatPercent(enemyStats.derived.physicalDefensePercent)}</span></span>
                <span>Elem: <span className="text-purple-400">{enemyStats.derived.elementalDefenseFlat}+{formatPercent(enemyStats.derived.elementalDefensePercent)}</span></span>
                <span>Mind: <span className="text-indigo-400">{enemyStats.derived.mentalDefenseFlat}+{formatPercent(enemyStats.derived.mentalDefensePercent)}</span></span>
              </div>
            </div>

            {/* RIGHT: Active Buffs */}
            <div className="flex flex-col items-end gap-2">
              {enemy.activeBuffs.map(buff => (
                <Tooltip key={buff.id} content={buff.effect.type}>
                  <div className="px-2 py-1 bg-red-950/80 border border-red-500/30 text-[10px] text-red-200 font-mono uppercase tracking-wider shadow-lg backdrop-blur-sm">
                    {buff.name} <span className="text-red-500">[{buff.duration}]</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        }
      />

      {/* SKILL INTERFACE AREA */}
      <div className="flex-1 p-6 flex flex-col justify-end">

        {/* Skills Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 items-end">
          {player.skills.map(skill => {
            const canUse = player.currentChakra >= skill.chakraCost && player.currentHp > skill.hpCost && skill.currentCooldown === 0;
            const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
            const isEnemyTurn = turnState === 'ENEMY_TURN';
            const usable = (canUse || skill.isActive) && !isStunned && !isEnemyTurn;

            const prediction = calculateDamage(
              playerStats.effectivePrimary,
              playerStats.derived,
              enemyStats.effectivePrimary,
              enemyStats.derived,
              skill,
              player.element,
              enemy.element
            );

            const effectiveness = getElementEffectiveness(skill.element, enemy.element);
            const isSuperEffective = effectiveness > 1.0;

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
                    </div>
                  </div>
                }
              >
                <SkillCard
                  skill={skill}
                  predictedDamage={prediction.finalDamage}
                  isEffective={isSuperEffective}
                  canUse={usable || false}
                  onClick={() => onUseSkill(skill)}
                />
              </Tooltip>
            );
          })}
        </div>

        {/* Turn Control */}
        <div className="mt-6 flex justify-end border-t border-zinc-800/50 pt-4">
          <button
            type="button"
            onClick={onPassTurn}
            disabled={turnState === 'ENEMY_TURN'}
            className={`flex items-center gap-3 px-6 py-3 border transition-all duration-200 ${
              turnState === 'ENEMY_TURN'
                ? 'border-zinc-800 text-zinc-600 bg-zinc-900/50 cursor-not-allowed'
                : 'border-zinc-600 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-400 hover:text-white'
            }`}
          >
            <Hourglass size={14} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              {turnState === 'ENEMY_TURN' ? 'Enemy Turn' : 'Pass Turn'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Combat;
