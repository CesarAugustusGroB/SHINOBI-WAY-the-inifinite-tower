import React from 'react';
import { Skill, DamageType } from '../game/types';

interface SkillCardProps {
  skill: Skill;
  predictedDamage: number;
  isEffective: boolean;
  canUse: boolean;
  onClick: () => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ 
  skill, 
  predictedDamage, 
  isEffective, 
  canUse,
  onClick 
}) => {
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
    // Default fallback image
    return "https://i.pinimg.com/736x/2c/a6/34/2ca6347bd392eb997d74720838b90839.jpg";
  };
  
  const bgImage = getSkillBackground();

  return (
    <button 
      onClick={canUse ? onClick : undefined}
      className={`
        relative w-full h-28 rounded-lg overflow-hidden shadow-md border transition-all duration-200 text-left group
        ${canUse 
          ? 'border-zinc-700 hover:border-zinc-500 hover:scale-[1.02]' 
          : 'border-zinc-800 opacity-50 cursor-not-allowed grayscale'}
        ${isEffective && canUse ? 'ring-1 ring-yellow-500/50' : ''}
      `}
    >
      {/* LAYER 1: BACKGROUND IMAGE */}
      <img 
        src={bgImage} 
        alt={skill.name} 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 group-hover:opacity-60 transition-opacity"
      />
      
      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>

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
          <div className="bg-black/60 border border-zinc-800 rounded px-1.5 py-0.5">
             <span className="text-[8px] text-yellow-600 font-mono">LVL {skill.level || 1}</span>
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
            <span className={skill.chakraCost > 0 ? "text-blue-400 font-bold" : "text-zinc-600"}>
                {skill.chakraCost > 0 ? `${skill.chakraCost} CP` : '-'}
            </span>
            {skill.hpCost > 0 && (
                <span className="text-red-400 font-bold">
                    {skill.hpCost} HP
                </span>
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
