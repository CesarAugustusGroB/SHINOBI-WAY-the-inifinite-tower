import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
  Buff,
  Rarity,
  ActionType,
  TurnPhaseState,
} from '../../game/types';
import StatBar from '../../components/shared/StatBar';
import Tooltip from '../../components/shared/Tooltip';
import { SkillCard } from '../../components/combat/SkillCard';
import { CinematicViewscreen } from '../../components/layout/CinematicViewscreen';
import PlayerHUD from '../../components/character/PlayerHUD';
import FloatingText, { FloatingTextItem, FloatingTextType } from '../../components/combat/FloatingText';
import { FeatureFlags } from '../../config/featureFlags';
import { Hourglass, Zap, ZapOff } from 'lucide-react';
import { calculateDamage, formatPercent } from '../../game/systems/StatSystem';
import { getElementEffectiveness } from '../../game/constants';
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
  getDetailedEffectMechanics,
  getEffectTip,
  getEffectSeverity,
  getSeverityColor,
  isPositiveEffect,
  getAttackMethodDescription,
  getDamagePropertyDescription,
  getDamageTypeDescription,
} from '../../game/utils/tooltipFormatters';

export interface CombatRef {
  spawnFloatingText: (target: 'enemy' | 'player', text: string, type: FloatingTextType) => void;
}

interface CombatProps {
  player: Player;
  playerStats: CharacterStats;
  enemy: Enemy;
  enemyStats: CharacterStats;
  turnState: 'PLAYER' | 'ENEMY_TURN';
  turnPhase: TurnPhaseState;
  onUseSkill: (skill: Skill) => void;
  onPassTurn: () => void;
  droppedSkill?: Skill | null;
  getDamageTypeColor: (dt: DamageType) => string;
  getRarityColor: (rarity: Rarity) => string;
  autoCombatEnabled?: boolean;
  onToggleAutoCombat?: () => void;
  autoPassTimeRemaining?: number | null;
}

const Combat = forwardRef<CombatRef, CombatProps>(({
  player,
  playerStats,
  enemy,
  enemyStats,
  turnState,
  turnPhase,
  onUseSkill,
  onPassTurn,
  droppedSkill,
  getDamageTypeColor,
  autoCombatEnabled = false,
  onToggleAutoCombat,
  autoPassTimeRemaining,
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

  // Group skills by ActionType
  const mainSkills = player.skills.filter(s => s.actionType === ActionType.MAIN || !s.actionType);
  const sideSkills = player.skills.filter(s => s.actionType === ActionType.SIDE);
  const toggleSkills = player.skills.filter(s => s.actionType === ActionType.TOGGLE);

  // Keyboard shortcuts for MAIN skills (keys 1-4) and pass turn (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (turnState !== 'PLAYER') return;

      // Space to pass turn
      if (e.code === 'Space') {
        e.preventDefault();
        onPassTurn();
        return;
      }

      // Number keys for skills
      const keyMap: Record<string, number> = {
        'Digit1': 0, '1': 0,
        'Digit2': 1, '2': 1,
        'Digit3': 2, '3': 2,
        'Digit4': 3, '4': 3,
      };

      const index = keyMap[e.code] ?? keyMap[e.key];
      if (index === undefined) return;

      const skill = mainSkills[index];
      if (!skill) return;

      const canUse = player.currentChakra >= skill.chakraCost
                  && player.currentHp > skill.hpCost
                  && skill.currentCooldown === 0;
      const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);

      if (canUse && !isStunned) {
        e.preventDefault();
        onUseSkill(skill);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnState, player, mainSkills, onUseSkill, onPassTurn]);

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
              {enemy.activeBuffs.filter(b => b?.effect).map(buff => {
                const isPositive = buff.effect ? isPositiveEffect(buff.effect.type) : false;
                const severity = getEffectSeverity(buff);
                const mechanics = getDetailedEffectMechanics(buff);
                const tip = buff.effect ? getEffectTip(buff.effect.type) : '';

                return (
                  <Tooltip
                    key={buff.id}
                    content={
                      <div className="space-y-2 p-1 max-w-[260px]">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${buff.effect ? getEffectColor(buff.effect.type) : 'text-zinc-400'}`}>
                            {buff.effect ? getEffectIcon(buff.effect.type) : '✨'}
                          </span>
                          <div>
                            <div className={`font-bold uppercase text-sm ${isPositive ? 'text-green-400' : getSeverityColor(severity)}`}>
                              {buff.name}
                            </div>
                            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
                              {isPositive ? 'Enemy Buff' : 'Your Debuff on Enemy'}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="text-xs text-zinc-300 border-t border-zinc-700 pt-2">
                          {getBuffDescription(buff)}
                        </div>

                        {/* Mechanics Breakdown */}
                        <div className="border-t border-zinc-700 pt-2">
                          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Mechanics</div>
                          <div className="space-y-0.5">
                            {mechanics.map((mechanic, i) => (
                              <div key={i} className="text-[10px] text-zinc-400 flex items-start gap-1">
                                <span className="text-zinc-600">•</span>
                                <span>{mechanic}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Source & Duration */}
                        <div className="border-t border-zinc-700 pt-2 flex justify-between text-[10px]">
                          <div>
                            <span className="text-zinc-500">Source: </span>
                            <span className="text-zinc-300">{buff.source || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Remaining: </span>
                            <span className={buff.duration <= 1 ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                              {buff.duration === -1 ? 'Permanent' : `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>

                        {/* Strategic Tip */}
                        {tip && (
                          <div className="border-t border-zinc-700 pt-2 text-[10px] text-amber-400/80 italic">
                            Tip: {tip}
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider shadow-lg backdrop-blur-sm cursor-help transition-colors ${
                      isPositive
                        ? 'bg-green-950/80 border border-green-500/30 text-green-200 hover:border-green-400/50'
                        : 'bg-red-950/80 border border-red-500/30 text-red-200 hover:border-red-400/50'
                    }`}>
                      {buff.name} <span className={isPositive ? 'text-green-500' : 'text-red-500'}>[{buff.duration}]</span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        }
      />
      </div>

      {/* SKILL INTERFACE AREA */}
      <div className="flex-1 p-6 flex flex-col justify-end">

        {/* SIDE Action Counter & Phase Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Phase Indicator */}
            <div className="text-[10px] font-mono uppercase tracking-wider">
              <span className="text-zinc-500">Phase: </span>
              <span className={turnPhase.phase === 'SIDE' ? 'text-blue-400' : 'text-orange-400'}>
                {turnPhase.phase}
              </span>
            </div>
            {/* SIDE Actions */}
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-950/30 border border-blue-800/50 rounded">
              <span className="text-[10px] font-bold text-blue-300 uppercase">Side Actions:</span>
              <span className={`text-sm font-mono font-bold ${
                turnPhase.sideActionsUsed >= turnPhase.maxSideActions ? 'text-red-400' : 'text-blue-400'
              }`}>
                {turnPhase.sideActionsUsed}/{turnPhase.maxSideActions}
              </span>
            </div>
          </div>
          {/* Passive Skills Summary */}
          {player.skills.filter(s => s.actionType === ActionType.PASSIVE).length > 0 && (
            <Tooltip
              content={
                <div className="space-y-2 p-1 max-w-[280px]">
                  <div className="text-xs font-bold text-zinc-300 uppercase">Active Passives</div>
                  {player.skills.filter(s => s.actionType === ActionType.PASSIVE).map(skill => (
                    <div key={skill.id} className="text-[10px] text-zinc-400">
                      <span className="text-zinc-200">{skill.name}</span> - {skill.description}
                    </div>
                  ))}
                </div>
              }
            >
              <div className="text-[10px] font-mono text-zinc-500 cursor-help hover:text-zinc-300">
                {player.skills.filter(s => s.actionType === ActionType.PASSIVE).length} Passives Active
              </div>
            </Tooltip>
          )}
        </div>

        {/* Skills Row - Grouped by ActionType */}
        {(() => {
          const renderSkillCard = (skill: Skill, mainIndex?: number) => {
            const canUse = player.currentChakra >= skill.chakraCost && player.currentHp > skill.hpCost && skill.currentCooldown === 0;
            const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
            const isEnemyTurn = turnState === 'ENEMY_TURN';

            // SIDE skills have additional check for remaining actions
            const sideActionsAvailable = turnPhase.sideActionsUsed < turnPhase.maxSideActions;
            const isSideSkill = skill.actionType === ActionType.SIDE;
            const usable = (canUse || skill.isActive) && !isStunned && !isEnemyTurn && (!isSideSkill || sideActionsAvailable);

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
                position="top"
                content={
                  <div className="space-y-2 p-1 max-w-[300px]">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-zinc-200">{skill.name}</div>
                        <div className="text-[9px] uppercase tracking-wider flex items-center gap-2">
                          <span className="text-zinc-500">{skill.tier}</span>
                          <span className={
                            skill.actionType === ActionType.SIDE ? 'text-blue-400' :
                            skill.actionType === ActionType.TOGGLE ? 'text-amber-400' :
                            'text-orange-400'
                          }>
                            {skill.actionType || 'MAIN'} Action
                          </span>
                        </div>
                      </div>
                      <span className="text-yellow-500 text-xs font-bold">Lv.{skill.level || 1}</span>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-zinc-400 italic border-t border-zinc-700 pt-2">{skill.description}</div>

                    {/* Damage Section */}
                    <div className="border-t border-zinc-700 pt-2">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Damage</div>
                      <div className="space-y-1 text-[10px]">
                        {/* Scaling */}
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getStatColor(skill.scalingStat)}`}>
                            {Math.round(skill.damageMult * 100)}% {formatScalingStat(skill.scalingStat)}
                          </span>
                          <span className="text-zinc-600">scaling</span>
                        </div>
                        {/* Damage Type & Property */}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
                          <span className={getElementColor(skill.element)}>{skill.element}</span>
                          {skill.damageProperty && skill.damageProperty !== 'Normal' && (
                            <span className="text-red-400">{skill.damageProperty}</span>
                          )}
                        </div>
                        {/* Mechanics Explanations */}
                        <div className="text-[9px] text-zinc-500 space-y-0.5 mt-1">
                          <div>• {getDamageTypeDescription(skill.damageType)}</div>
                          {skill.damageProperty && skill.damageProperty !== 'Normal' && (
                            <div>• {getDamagePropertyDescription(skill.damageProperty)}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hit Chance Section */}
                    <div className="border-t border-zinc-700 pt-2">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Hit Chance</div>
                      <div className="text-[10px] text-zinc-400">
                        <span className="text-zinc-300">{skill.attackMethod}</span> - {getAttackMethodDescription(skill.attackMethod)}
                      </div>
                    </div>

                    {/* Costs & Cooldown */}
                    <div className="border-t border-zinc-700 pt-2">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Cost</div>
                      <div className="flex flex-wrap gap-3 text-[10px]">
                        <span className={skill.chakraCost > 0 ? 'text-blue-400' : 'text-zinc-600'}>
                          {skill.chakraCost} CP
                        </span>
                        {skill.hpCost > 0 && (
                          <span className="text-red-400">{skill.hpCost} HP</span>
                        )}
                        <span className={skill.cooldown > 0 ? 'text-zinc-300' : 'text-zinc-600'}>
                          {skill.cooldown > 0 ? `${skill.cooldown} turn cooldown` : 'No cooldown'}
                        </span>
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
                    {(skill.isToggle || skill.actionType === ActionType.TOGGLE) && (
                      <div className="border-t border-zinc-700 pt-2 text-[10px] text-amber-400">
                        Toggle Skill - {skill.upkeepCost || 0} CP/turn upkeep
                      </div>
                    )}

                    {/* Damage Preview vs Enemy */}
                    <div className="border-t border-zinc-700 pt-2 bg-zinc-800/50 -mx-1 px-2 py-1 rounded">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">vs {enemy.name}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px]">
                          <span className="text-zinc-400">Predicted: </span>
                          <span className={`font-bold ${isSuperEffective ? 'text-yellow-400' : 'text-zinc-200'}`}>
                            {prediction.finalDamage} dmg
                          </span>
                          {prediction.isCrit && <span className="text-yellow-500 ml-1">(CRIT)</span>}
                        </div>
                        {isSuperEffective && (
                          <span className="text-[9px] text-yellow-400 font-bold">SUPER EFFECTIVE!</span>
                        )}
                        {effectiveness < 1.0 && (
                          <span className="text-[9px] text-zinc-500">Resisted</span>
                        )}
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
                  shortcutKey={mainIndex !== undefined && mainIndex < 4 ? String(mainIndex + 1) : undefined}
                />
              </Tooltip>
            );
          };

          return (
            <div className="space-y-4">
              {/* SIDE Skills Row (if any) */}
              {sideSkills.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                    Side Actions (Free)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {sideSkills.map(renderSkillCard)}
                  </div>
                </div>
              )}

              {/* TOGGLE Skills Row (if any) */}
              {toggleSkills.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                    Toggle Skills
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {toggleSkills.map(renderSkillCard)}
                  </div>
                </div>
              )}

              {/* MAIN Skills Row */}
              <div>
                <div className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mb-2">
                  Main Actions (Ends Turn)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                  {mainSkills.map((skill, index) => renderSkillCard(skill, index))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Turn Control */}
        <div className="mt-6 flex justify-between items-center border-t border-zinc-800/50 pt-4">
          {/* Auto-Combat Toggle */}
          <button
            type="button"
            onClick={onToggleAutoCombat}
            className={`flex items-center gap-2 px-4 py-2 border transition-all duration-200 ${
              autoCombatEnabled
                ? 'border-amber-600/50 text-amber-400 bg-amber-950/30 hover:bg-amber-950/50'
                : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30'
            }`}
            title={autoCombatEnabled ? 'Auto-pass enabled - Click to disable' : 'Enable auto-pass for faster pacing'}
          >
            {autoCombatEnabled ? <Zap size={14} /> : <ZapOff size={14} />}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Auto
            </span>
            {autoCombatEnabled && autoPassTimeRemaining != null && turnState === 'PLAYER' && (
              <span className="text-[10px] font-mono text-amber-500">
                {(autoPassTimeRemaining / 1000).toFixed(1)}s
              </span>
            )}
          </button>

          {/* Pass Turn Button */}
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
      {FeatureFlags.SHOW_FLOATING_TEXT && floatingTexts.map(ft => (
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
