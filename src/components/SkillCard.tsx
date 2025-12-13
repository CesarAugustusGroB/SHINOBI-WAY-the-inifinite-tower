import React from 'react';
import { Skill, DamageType, ActionType } from '../game/types';

interface SkillCardProps {
  skill: Skill;
  predictedDamage: number;
  isEffective: boolean;
  canUse: boolean;
  onClick: () => void;
  /** Whether to show simplified passive display (non-interactive) */
  showAsPassive?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  predictedDamage,
  isEffective,
  canUse,
  onClick,
  showAsPassive = false
}) => {
  const actionType = skill.actionType || ActionType.MAIN;
  const isPassive = actionType === ActionType.PASSIVE || showAsPassive;
  const isSide = actionType === ActionType.SIDE;
  const isToggle = actionType === ActionType.TOGGLE;
  const isActive = skill.isActive || false;
  // Map skill names to specific background images
  const getSkillBackground = () => {
    const skillName = skill.name.toLowerCase();
    if (skillName.includes('shuriken')) {
      return '/assets/skill_shuriken.png';
    }
    if (skillName.includes('fireball')) {
      return '/assets/skill_fireball.png';
    }
    if (skillName.includes('taijutsu')) {
      return '/assets/skill_taijutsu.png';
    }
    if (skillName.includes('primary lotus')) {
      return '/assets/skill_primary_lotus.png';
    }
    if (skillName.includes('shadow') && skillName.includes('clone')) {
      return '/assets/skill_shadow_clones.png';
    }
    if (skillName.includes('gentle') && skillName.includes('fist')) {
      return '/assets/skill_gentle_fist.png';
    }
    if (skillName.includes('mind')){ //&& skillName.includes('body') && skillName.includes('disturbing')) {
      return '/assets/skill_mind_body_disturbing.png';
    }
    // Default fallback image
    return "https://i.pinimg.com/736x/2c/a6/34/2ca6347bd392eb997d74720838b90839.jpg";
  };

  const bgImage = getSkillBackground();

  // Get border color based on action type
  const getBorderStyle = () => {
    if (isPassive) return 'border-zinc-600 opacity-60';
    if (isToggle && isActive) return 'border-amber-500 ring-2 ring-amber-500/30 animate-pulse';
    if (isToggle) return 'border-amber-600/70 hover:border-amber-500';
    if (isSide) return 'border-blue-600/70 hover:border-blue-400';
    // MAIN default
    return canUse
      ? 'border-zinc-700 hover:border-zinc-500'
      : 'border-zinc-800';
  };

  // Get action type badge
  const getActionBadge = () => {
    if (isPassive) return { text: 'PASSIVE', color: 'bg-zinc-700 text-zinc-300' };
    if (isToggle) return isActive
      ? { text: 'ACTIVE', color: 'bg-amber-600 text-amber-100' }
      : { text: 'TOGGLE', color: 'bg-amber-900/80 text-amber-400' };
    if (isSide) return { text: 'SIDE', color: 'bg-blue-900/80 text-blue-300' };
    return null; // No badge for MAIN
  };

  const actionBadge = getActionBadge();
  const effectivelyUsable = !isPassive && canUse;

  return (
    <button
      onClick={effectivelyUsable ? onClick : undefined}
      className={`
        relative w-full h-28 rounded-lg overflow-hidden shadow-md border transition-all duration-200 text-left group
        ${getBorderStyle()}
        ${!effectivelyUsable && !isPassive ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${effectivelyUsable ? 'hover:scale-[1.02]' : ''}
        ${isPassive ? 'cursor-default' : ''}
        ${isEffective && effectivelyUsable ? 'ring-1 ring-yellow-500/50' : ''}
      `}
    >
      {/* LAYER 1: BACKGROUND IMAGE */}
      <img
        src={bgImage}
        alt={skill.name}
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 group-hover:opacity-90 transition-opacity"
      />

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10"></div>

      {/* LAYER 2: CONTENT */}
      <div className="relative z-20 w-full h-full p-3 flex flex-col justify-between">

        {/* Top Row: Name and Level */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider drop-shadow-md">
              {skill.name}
            </h3>
            <div className="flex gap-2 mt-0.5">
                <span className={`text-[9px] font-bold uppercase ${
                    skill.damageType === DamageType.PHYSICAL ? 'text-orange-400' :
                    skill.damageType === DamageType.ELEMENTAL ? 'text-purple-400' :
                    'text-indigo-400'
                }`}>
                    {skill.damageType.charAt(0)} {skill.element}
                </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Action Type Badge */}
            {actionBadge && (
              <div className={`${actionBadge.color} rounded px-1.5 py-0.5`}>
                <span className="text-[8px] font-bold uppercase tracking-wider">{actionBadge.text}</span>
              </div>
            )}
            {/* Level Badge */}
            <div className="bg-black/60 border border-zinc-800 rounded px-1.5 py-0.5">
              <span className="text-[8px] text-yellow-600 font-mono">LVL {skill.level || 1}</span>
            </div>
          </div>
        </div>

        {/* Middle/Bottom: Big Damage Number */}
        <div className="absolute right-3 bottom-3 text-right">
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-[-2px]">DMG</div>
            <div className={`text-2xl font-black font-serif transition-colors ${
                isEffective
                ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                : 'text-zinc-200'
            }`}>
                {predictedDamage > 0 ? predictedDamage : '-'}
            </div>
        </div>

        {/* Bottom Row: Costs */}
        <div className="flex gap-3 mt-auto text-[10px] font-mono">
            {isPassive ? (
              <span className="text-zinc-500 italic">Always Active</span>
            ) : (
              <>
                <span className={skill.chakraCost > 0 ? "text-blue-400 font-bold" : "text-zinc-600"}>
                  {skill.chakraCost > 0 ? `${skill.chakraCost} CP` : '-'}
                </span>
                {skill.hpCost > 0 && (
                  <span className="text-red-400 font-bold">
                    {skill.hpCost} HP
                  </span>
                )}
                {isToggle && skill.upkeepCost && skill.upkeepCost > 0 && (
                  <span className="text-amber-400 font-bold">
                    {skill.upkeepCost}/turn
                  </span>
                )}
              </>
            )}
        </div>
      </div>

      {/* COOLDOWN OVERLAY */}
      {skill.currentCooldown > 0 && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center backdrop-blur-[1px]">
          <span className="text-2xl font-black text-zinc-600">{skill.currentCooldown}</span>
        </div>
      )}
    </button>
  );
};
