import React from 'react';
import { Skill, DamageType, ActionType } from '../../game/types';
import './SkillCard.css';

interface SkillCardProps {
  skill: Skill;
  predictedDamage: number;
  isEffective: boolean;
  canUse: boolean;
  onClick: () => void;
  /** Whether to show simplified passive display (non-interactive) */
  showAsPassive?: boolean;
  /** Keyboard shortcut key to display (e.g., "1", "2", "3", "4") */
  shortcutKey?: string;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  predictedDamage,
  isEffective,
  canUse,
  onClick,
  showAsPassive = false,
  shortcutKey
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
    if (skillName.includes('mind')) {
      return '/assets/skill_mind_body_disturbing.png';
    }
    // Default fallback image
    return 'https://i.pinimg.com/736x/2c/a6/34/2ca6347bd392eb997d74720838b90839.jpg';
  };

  const bgImage = getSkillBackground();

  // Build class names
  const getCardClasses = () => {
    const classes = ['skill-card'];

    // Action type variant
    if (isPassive) {
      classes.push('skill-card--passive');
    } else if (isToggle) {
      classes.push('skill-card--toggle');
      if (isActive) classes.push('skill-card--active');
    } else if (isSide) {
      classes.push('skill-card--side');
    } else {
      classes.push('skill-card--main');
    }

    // State modifiers
    if (!canUse && !isPassive && !isActive) {
      classes.push('skill-card--disabled');
    }
    if (isEffective && canUse) {
      classes.push('skill-card--effective');
    }

    return classes.join(' ');
  };

  // Get action type badge config
  const getActionBadge = () => {
    if (isPassive) return { text: 'PASSIVE', className: 'skill-card__action-badge--passive' };
    if (isToggle) {
      return isActive
        ? { text: 'ACTIVE', className: 'skill-card__action-badge--toggle-active' }
        : { text: 'TOGGLE', className: 'skill-card__action-badge--toggle' };
    }
    if (isSide) return { text: 'SIDE', className: 'skill-card__action-badge--side' };
    return null; // No badge for MAIN
  };

  // Get damage type class
  const getDamageTypeClass = () => {
    switch (skill.damageType) {
      case DamageType.PHYSICAL:
        return 'skill-card__damage-type--physical';
      case DamageType.ELEMENTAL:
        return 'skill-card__damage-type--elemental';
      default:
        return 'skill-card__damage-type--mental';
    }
  };

  const actionBadge = getActionBadge();
  const effectivelyUsable = !isPassive && canUse;

  return (
    <button
      type="button"
      onClick={effectivelyUsable ? onClick : undefined}
      className={getCardClasses()}
    >
      {/* Keyboard Shortcut Badge */}
      {shortcutKey && (
        <div className="skill-card__shortcut">{shortcutKey}</div>
      )}

      {/* Background Image Layer */}
      <img
        src={bgImage}
        alt={skill.name}
        className="skill-card__bg"
      />

      {/* Gradient Overlay */}
      <div className="skill-card__overlay" />

      {/* Content Layer */}
      <div className="skill-card__content">
        {/* Top Row: Name and Level */}
        <div className="skill-card__header">
          <div>
            <h3 className="skill-card__name">{skill.name}</h3>
            <div className="skill-card__type-row">
              <span className={`skill-card__damage-type ${getDamageTypeClass()}`}>
                {skill.damageType.charAt(0)} {skill.element}
              </span>
            </div>
          </div>
          <div className="skill-card__badges">
            {/* Action Type Badge */}
            {actionBadge && (
              <div className={`skill-card__action-badge ${actionBadge.className}`}>
                <span className="skill-card__action-badge-text">{actionBadge.text}</span>
              </div>
            )}
            {/* Level Badge */}
            <div className="skill-card__level-badge">
              <span className="skill-card__level-text">LVL {skill.level || 1}</span>
            </div>
          </div>
        </div>

        {/* Damage Display */}
        <div className="skill-card__damage">
          <div className="skill-card__damage-label">DMG</div>
          <div className={`skill-card__damage-value ${isEffective ? 'skill-card__damage-value--effective' : ''}`}>
            {predictedDamage > 0 ? predictedDamage : '-'}
          </div>
        </div>

        {/* Cost Display */}
        <div className="skill-card__costs">
          {isPassive ? (
            <span className="skill-card__cost--passive">Always Active</span>
          ) : (
            <>
              <span className={skill.chakraCost > 0 ? 'skill-card__cost--cp' : 'skill-card__cost--cp-zero'}>
                {skill.chakraCost > 0 ? `${skill.chakraCost} CP` : '-'}
              </span>
              {skill.hpCost > 0 && (
                <span className="skill-card__cost--hp">{skill.hpCost} HP</span>
              )}
              {isToggle && skill.upkeepCost && skill.upkeepCost > 0 && (
                <span className="skill-card__cost--upkeep">{skill.upkeepCost}/turn</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cooldown Overlay */}
      {skill.currentCooldown > 0 && (
        <div className="skill-card__cooldown">
          <span className="skill-card__cooldown-value">{skill.currentCooldown}</span>
        </div>
      )}
    </button>
  );
};
