import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
  Buff,
} from '../game/types';
import StatBar from '../components/StatBar';
import Tooltip from '../components/Tooltip';
import { SkillCard } from '../components/SkillCard';
import { CinematicViewscreen } from '../components/CinematicViewscreen';
import PlayerHUD from '../components/PlayerHUD';
import FloatingText, { FloatingTextItem, FloatingTextType } from '../components/FloatingText';
import { Hourglass } from 'lucide-react';
import { calculateDamage, formatPercent } from '../game/systems/StatSystem';
import { getElementEffectiveness } from '../game/constants';
import {
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
  getBuffDescription,
  getCategoryRanks,
  getRankColor,
} from '../game/utils/tooltipFormatters';

export interface CombatRef {
  spawnFloatingText: (target: 'enemy' | 'player', text: string, type: FloatingTextType) => void;
}

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

const Combat = forwardRef<CombatRef, CombatProps>(({
  player,
  playerStats,
  enemy,
  enemyStats,
  turnState,
  onUseSkill,
  onPassTurn,
  droppedSkill,
  getDamageTypeColor
}, ref) => {
  // Floating text state
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const enemyRef = useRef<HTMLDivElement>(null);
  const playerHudRef = useRef<HTMLDivElement>(null);

  // Spawn floating text at target location
  const spawnFloatingText = useCallback((
    target: 'enemy' | 'player',
    text: string,
    type: FloatingTextType
  ) => {
    const targetRef = target === 'enemy' ? enemyRef : playerHudRef;
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const id = `fct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
    const y = rect.top + rect.height * (target === 'enemy' ? 0.4 : 0.3);

    setFloatingTexts(prev => [...prev, { id, text, type, position: { x, y } }]);
  }, []);

  // Remove floating text after animation completes
  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expose spawnFloatingText to parent via ref
  useImperativeHandle(ref, () => ({
    spawnFloatingText
  }), [spawnFloatingText]);

  return (
    <div className="w-full max-w-6xl z-10 flex flex-col h-full mx-auto">

      {/* CINEMATIC BATTLE HEADER - Enemy Area */}
      <div ref={enemyRef}>
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

              {/* Detailed Stats with Tooltip */}
              <Tooltip
                content={
                  (() => {
                    const ranks = getCategoryRanks(enemyStats.effectivePrimary);
                    return (
                      <div className="space-y-3 p-1 max-w-[280px]">
                        <div className="text-sm font-bold text-zinc-200">{enemy.name}</div>
                        <div className="text-[10px] text-zinc-500">{enemy.tier} - {enemy.element} Affinity</div>

                        {/* THE BODY */}
                        <div className="border-t border-zinc-700 pt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-orange-400 uppercase">The Body</span>
                            <span className={`text-sm font-black ${getRankColor(ranks.body)}`}>{ranks.body}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-zinc-300 mb-1">
                            <div><span className="text-orange-500">STR</span> {enemyStats.effectivePrimary.strength}</div>
                            <div><span className="text-red-500">WIL</span> {enemyStats.effectivePrimary.willpower}</div>
                            <div><span className="text-blue-500">CHA</span> {enemyStats.effectivePrimary.chakra}</div>
                          </div>
                          <div className="text-[9px] text-zinc-500">
                            Phys Def: <span className="text-orange-400">{enemyStats.derived.physicalDefenseFlat} + {formatPercent(enemyStats.derived.physicalDefensePercent)}</span>
                          </div>
                        </div>

                        {/* THE MIND */}
                        <div className="border-t border-zinc-700 pt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-purple-400 uppercase">The Mind</span>
                            <span className={`text-sm font-black ${getRankColor(ranks.mind)}`}>{ranks.mind}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-zinc-300 mb-1">
                            <div><span className="text-purple-500">SPI</span> {enemyStats.effectivePrimary.spirit}</div>
                            <div><span className="text-cyan-500">INT</span> {enemyStats.effectivePrimary.intelligence}</div>
                            <div><span className="text-indigo-500">CAL</span> {enemyStats.effectivePrimary.calmness}</div>
                          </div>
                          <div className="text-[9px] text-zinc-500 space-y-0.5">
                            <div>Elem Def: <span className="text-purple-400">{enemyStats.derived.elementalDefenseFlat} + {formatPercent(enemyStats.derived.elementalDefensePercent)}</span></div>
                            <div>Mind Def: <span className="text-indigo-400">{enemyStats.derived.mentalDefenseFlat} + {formatPercent(enemyStats.derived.mentalDefensePercent)}</span></div>
                          </div>
                        </div>

                        {/* THE TECHNIQUE */}
                        <div className="border-t border-zinc-700 pt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-green-400 uppercase">The Technique</span>
                            <span className={`text-sm font-black ${getRankColor(ranks.technique)}`}>{ranks.technique}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-zinc-300 mb-1">
                            <div><span className="text-green-500">SPD</span> {enemyStats.effectivePrimary.speed}</div>
                            <div><span className="text-yellow-500">ACC</span> {enemyStats.effectivePrimary.accuracy}</div>
                            <div><span className="text-pink-500">DEX</span> {enemyStats.effectivePrimary.dexterity}</div>
                          </div>
                          <div className="text-[9px] text-zinc-500 space-y-0.5">
                            <div>Evasion: <span className="text-green-400">{formatPercent(enemyStats.derived.evasion)}</span></div>
                            <div>Crit: <span className="text-yellow-400">{Math.round(enemyStats.derived.critChance)}%</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                }
              >
                <div className="mt-2 flex gap-3 text-[9px] font-mono text-zinc-500 opacity-80 hover:opacity-100 transition-opacity cursor-help">
                  <span>Phys: <span className="text-orange-400">{enemyStats.derived.physicalDefenseFlat}+{formatPercent(enemyStats.derived.physicalDefensePercent)}</span></span>
                  <span>Elem: <span className="text-purple-400">{enemyStats.derived.elementalDefenseFlat}+{formatPercent(enemyStats.derived.elementalDefensePercent)}</span></span>
                  <span>Mind: <span className="text-indigo-400">{enemyStats.derived.mentalDefenseFlat}+{formatPercent(enemyStats.derived.mentalDefensePercent)}</span></span>
                </div>
              </Tooltip>
            </div>

            {/* RIGHT: Active Buffs */}
            <div className="flex flex-col items-end gap-2">
              {enemy.activeBuffs.filter(b => b?.effect).map(buff => (
                <Tooltip
                  key={buff.id}
                  content={
                    <div className="space-y-2 p-1 max-w-[220px]">
                      <div className="font-bold text-zinc-200 flex items-center gap-2">
                        <span className={getEffectColor(buff.effect?.type)}>{getEffectIcon(buff.effect?.type)}</span>
                        <span>{buff.name}</span>
                      </div>
                      <div className="text-xs text-zinc-400">{getBuffDescription(buff)}</div>
                      <div className="border-t border-zinc-700 pt-2 text-[10px] text-zinc-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Source</span>
                          <span className="text-zinc-300">{buff.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining</span>
                          <span className="text-zinc-300">{buff.duration} {buff.duration === 1 ? 'turn' : 'turns'}</span>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="px-2 py-1 bg-red-950/80 border border-red-500/30 text-[10px] text-red-200 font-mono uppercase tracking-wider shadow-lg backdrop-blur-sm">
                    {buff.name} <span className="text-red-500">[{buff.duration}]</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        }
      />
      </div>

      {/* SKILL INTERFACE AREA */}
      <div className="flex-1 p-6 flex flex-col justify-end">

        {/* Skills Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 items-end">
          {player.skills.map(skill => {
            const canUse = player.currentChakra >= skill.chakraCost && player.currentHp > skill.hpCost && skill.currentCooldown === 0;
            const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
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
                  <div className="space-y-2 p-1 max-w-[280px]">
                    {/* Header */}
                    <div className="font-bold text-zinc-200 flex justify-between items-center">
                      <span>{skill.name}</span>
                      <span className="text-yellow-500 text-xs">Lv.{skill.level || 1}</span>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-zinc-400 italic">{skill.description}</div>

                    {/* Core Stats */}
                    <div className="border-t border-zinc-700 pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Scales</span>
                        <span className={getStatColor(skill.scalingStat)}>{formatScalingStat(skill.scalingStat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Element</span>
                        <span className={getElementColor(skill.element)}>{skill.element}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Attack</span>
                        <span className="text-zinc-300">{skill.attackMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Type</span>
                        <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
                      </div>
                    </div>

                    {/* Effects Section */}
                    {skill.effects && skill.effects.length > 0 && (
                      <div className="border-t border-zinc-700 pt-2">
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Effects</div>
                        <div className="space-y-0.5">
                          {skill.effects.map((effect, idx) => (
                            <div key={idx} className="text-[10px] flex items-center gap-1.5">
                              <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                              <span className="text-zinc-300">{formatEffectDescription(effect)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonus Stats */}
                    {(skill.critBonus || skill.penetration) && (
                      <div className="border-t border-zinc-700 pt-2 text-[10px] space-y-0.5">
                        {skill.critBonus && (
                          <div className="text-yellow-400">+{skill.critBonus}% Crit Chance</div>
                        )}
                        {skill.penetration && (
                          <div className="text-red-400">{Math.round(skill.penetration * 100)}% Defense Penetration</div>
                        )}
                      </div>
                    )}

                    {/* Toggle Skill Info */}
                    {skill.isToggle && (
                      <div className="border-t border-zinc-700 pt-2 text-[10px] text-amber-400">
                        Toggle Skill - {skill.upkeepCost} CP/turn upkeep
                      </div>
                    )}
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

      {/* PLAYER HUD */}
      <PlayerHUD
        ref={playerHudRef}
        player={player}
        playerStats={playerStats}
      />

      {/* FLOATING TEXT OVERLAY */}
      {floatingTexts.map(ft => (
        <FloatingText
          key={ft.id}
          id={ft.id}
          value={ft.text}
          type={ft.type}
          position={ft.position}
          onComplete={removeFloatingText}
        />
      ))}
    </div>
  );
});

Combat.displayName = 'Combat';

export default Combat;
