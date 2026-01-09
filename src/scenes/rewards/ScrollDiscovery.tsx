import React, { useEffect } from 'react';
import {
  Skill,
  SkillTier,
  Player,
  DamageType,
  ScrollDiscoveryActivity,
  CharacterStats,
} from '../../game/types';
import { Scroll, Zap, Brain, Sparkles } from 'lucide-react';
import Tooltip from '../../components/shared/Tooltip';
import {
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
} from '../../game/utils/tooltipFormatters';
import './ScrollDiscovery.css';

interface ScrollDiscoveryProps {
  scrollDiscovery: ScrollDiscoveryActivity;
  player: Player;
  playerStats: CharacterStats;
  onLearnScroll: (skill: Skill, slotIndex?: number) => void;
  onSkip: () => void;
}

// Helper functions for tier-based styling
const getTierNameClass = (tier: SkillTier): string => {
  switch (tier) {
    case SkillTier.ADVANCED:
      return 'scroll-card__name--advanced';
    case SkillTier.HIDDEN:
      return 'scroll-card__name--hidden';
    case SkillTier.FORBIDDEN:
      return 'scroll-card__name--forbidden';
    case SkillTier.KINJUTSU:
      return 'scroll-card__name--kinjutsu';
    default:
      return 'scroll-card__name--basic';
  }
};

const getTierCardClass = (tier: SkillTier): string => {
  switch (tier) {
    case SkillTier.ADVANCED:
      return 'scroll-card--advanced';
    case SkillTier.HIDDEN:
      return 'scroll-card--hidden';
    case SkillTier.FORBIDDEN:
      return 'scroll-card--forbidden';
    case SkillTier.KINJUTSU:
      return 'scroll-card--kinjutsu';
    default:
      return 'scroll-card--basic';
  }
};

const getDamageTypeClass = (dt: DamageType): string => {
  switch (dt) {
    case DamageType.PHYSICAL:
      return 'scroll-card__stat-value--physical';
    case DamageType.ELEMENTAL:
      return 'scroll-card__stat-value--elemental';
    case DamageType.MENTAL:
      return 'scroll-card__stat-value--mental';
    case DamageType.TRUE:
      return 'scroll-card__stat-value--true';
    default:
      return '';
  }
};

const ScrollDiscovery: React.FC<ScrollDiscoveryProps> = ({
  scrollDiscovery,
  player,
  playerStats,
  onLearnScroll,
  onSkip,
}) => {
  // Keyboard shortcut: SPACE/ENTER to leave scrolls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  const chakraCost = scrollDiscovery.cost?.chakra || 0;
  const canAfford = player.currentChakra >= chakraCost;

  // Check if player already knows the skill
  const alreadyKnows = (skill: Skill) => player.skills.some(s => s.id === skill.id);
  const skillSlotsFull = player.skills.length >= 4;

  // Check skill requirements
  const meetsRequirements = (skill: Skill): { meets: boolean; reason?: string } => {
    if (!skill.requirements) return { meets: true };

    if (skill.requirements.intelligence &&
        playerStats.effectivePrimary.intelligence < skill.requirements.intelligence) {
      return {
        meets: false,
        reason: `Requires ${skill.requirements.intelligence} INT (you have ${Math.floor(playerStats.effectivePrimary.intelligence)})`
      };
    }

    if (skill.requirements.clan && skill.requirements.clan !== player.clan) {
      return { meets: false, reason: `Requires ${skill.requirements.clan} bloodline` };
    }

    return { meets: true };
  };

  return (
    <div className="scroll-discovery">
      <div className="scroll-discovery__header">
        <Scroll className="scroll-discovery__header-icon" size={24} />
        <h2 className="scroll-discovery__title">Ancient Scrolls</h2>
        <Scroll className="scroll-discovery__header-icon" size={24} />
      </div>

      <p className="scroll-discovery__subtitle">
        You discovered ancient jutsu scrolls. Study them to learn new techniques.
      </p>

      {/* Keyboard Hints */}
      <div className="scroll-discovery__hints">
        <span className="scroll-discovery__hint">
          <span className="sw-shortcut">Space</span> or <span className="sw-shortcut">Enter</span> Leave Scrolls
        </span>
      </div>

      <div className="scroll-discovery__resources">
        <div className="scroll-discovery__resource">
          <Zap className="scroll-discovery__resource-icon--chakra" size={16} />
          <span className="scroll-discovery__resource-value--chakra">
            {player.currentChakra} / {playerStats.derived.maxChakra}
          </span>
        </div>
        <div className="scroll-discovery__resource">
          <Brain className="scroll-discovery__resource-icon--int" size={16} />
          <span className="scroll-discovery__resource-value--int">
            INT: {Math.floor(playerStats.effectivePrimary.intelligence)}
          </span>
        </div>
      </div>

      <div className="scroll-discovery__grid">
        {scrollDiscovery.availableScrolls.map((skill) => {
          const known = alreadyKnows(skill);
          const reqCheck = meetsRequirements(skill);
          const canLearn = canAfford && reqCheck.meets && (!skillSlotsFull || known);

          return (
            <Tooltip
              key={skill.id}
              content={
                <div className="scroll-tooltip">
                  <div className={`scroll-tooltip__name ${getTierNameClass(skill.tier)}`}>{skill.name}</div>
                  <div className="scroll-tooltip__description">{skill.description}</div>

                  <div className="scroll-tooltip__section">
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Chakra Cost</span>
                      <span className="scroll-card__stat-value--chakra">{skill.chakraCost}</span>
                    </div>
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Damage Type</span>
                      <span className={getDamageTypeClass(skill.damageType)}>{skill.damageType}</span>
                    </div>
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Multiplier</span>
                      <span className="scroll-card__stat-value--multiplier">{skill.damageMult}x {formatScalingStat(skill.scalingStat)}</span>
                    </div>
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Element</span>
                      <span className={getElementColor(skill.element)}>{skill.element}</span>
                    </div>
                  </div>

                  {skill.effects && skill.effects.length > 0 && (
                    <div className="scroll-tooltip__section">
                      <div className="scroll-tooltip__effects-title">Effects</div>
                      {skill.effects.map((effect, idx) => (
                        <div key={idx} className="scroll-tooltip__effect">
                          <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                          <span className="scroll-tooltip__effect-text">{formatEffectDescription(effect)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {skill.requirements && (
                    <div className="scroll-tooltip__section">
                      <div className="scroll-tooltip__requirements-title">Requirements:</div>
                      {skill.requirements.intelligence && (
                        <div className={playerStats.effectivePrimary.intelligence >= skill.requirements.intelligence ? 'scroll-tooltip__requirement--met' : 'scroll-tooltip__requirement--unmet'}>
                          INT {skill.requirements.intelligence}
                        </div>
                      )}
                      {skill.requirements.clan && (
                        <div className={player.clan === skill.requirements.clan ? 'scroll-tooltip__requirement--met' : 'scroll-tooltip__requirement--unmet'}>
                          {skill.requirements.clan} bloodline
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
            >
              <div className={`scroll-card ${getTierCardClass(skill.tier)}`}>
                <div className="scroll-card__header">
                  <div className="scroll-card__title-section">
                    <h3 className={`scroll-card__name ${getTierNameClass(skill.tier)}`}>
                      {skill.name}
                    </h3>
                    <p className="scroll-card__type">{skill.tier} Technique</p>
                  </div>
                  {known && (
                    <span className="scroll-card__known-badge">Known</span>
                  )}
                </div>

                <p className="scroll-card__description">{skill.description}</p>

                <div className="scroll-card__stats">
                  <div className="scroll-card__stat">
                    <span>Chakra Cost</span>
                    <span className="scroll-card__stat-value--chakra">{skill.chakraCost}</span>
                  </div>
                  <div className="scroll-card__stat">
                    <span>Damage Type</span>
                    <span className={getDamageTypeClass(skill.damageType)}>{skill.damageType}</span>
                  </div>
                  <div className="scroll-card__stat">
                    <span>Element</span>
                    <span className={getElementColor(skill.element)}>{skill.element}</span>
                  </div>
                  <div className="scroll-card__stat">
                    <span>Multiplier</span>
                    <span className="scroll-card__stat-value--multiplier">{skill.damageMult}x {formatScalingStat(skill.scalingStat)}</span>
                  </div>
                </div>

                {!reqCheck.meets && (
                  <div className="scroll-card__warning scroll-card__warning--requirement">
                    {reqCheck.reason}
                  </div>
                )}

                {skillSlotsFull && !known && (
                  <div className="scroll-card__warning scroll-card__warning--slots">
                    Skill slots full (4/4) - will replace existing skill
                  </div>
                )}

                <div className="scroll-card__actions">
                  {/* Upgrade or Learn button */}
                  {(known || (!skillSlotsFull && reqCheck.meets)) && (
                    <button
                      type="button"
                      disabled={!canAfford || !reqCheck.meets}
                      onClick={() => onLearnScroll(skill)}
                      className={`scroll-card__btn scroll-card__btn--learn ${!canAfford || !reqCheck.meets ? 'scroll-card__btn--learn:disabled' : ''}`}
                    >
                      <Sparkles size={14} />
                      {known ? 'Upgrade Skill' : 'Learn Technique'}
                      {chakraCost > 0 && (
                        <span className={`scroll-card__btn-cost ${canAfford ? 'scroll-card__btn-cost--affordable' : 'scroll-card__btn-cost--insufficient'}`}>
                          (-{chakraCost} Chakra)
                        </span>
                      )}
                    </button>
                  )}

                  {/* Replacement buttons when slots are full */}
                  {!known && player.skills.length > 0 && reqCheck.meets && (
                    <div className="scroll-card__replace-grid">
                      {player.skills.map((s, idx) => (
                        <button
                          type="button"
                          key={idx}
                          disabled={!canAfford}
                          onClick={() => onLearnScroll(skill, idx)}
                          className="scroll-card__btn--replace"
                        >
                          Replace {s.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {!canAfford && (
                    <div className="scroll-card__warning--chakra">
                      Not enough chakra to study
                    </div>
                  )}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className="scroll-discovery__footer">
        <button type="button" onClick={onSkip} className="scroll-discovery__leave-btn">
          Leave Scrolls
        </button>
      </div>
    </div>
  );
};

export default ScrollDiscovery;
