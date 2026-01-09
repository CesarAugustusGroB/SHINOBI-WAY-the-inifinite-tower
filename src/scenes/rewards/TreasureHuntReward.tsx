import React, { useEffect, useState, useMemo } from 'react';
import { Item, Skill, Rarity, SkillTier, DamageType } from '../../game/types';
import { Scroll, MapPin, Coins, Sparkles, Award } from 'lucide-react';
import Tooltip from '../../components/shared/Tooltip';
import { formatStatName, getStatColor, formatScalingStat, getEffectColor, getEffectIcon, formatEffectDescription } from '../../game/utils/tooltipFormatters';
import './treasure.css';

interface TreasureHuntReward {
  items: Item[];
  skills: Skill[];
  ryo: number;
  piecesCollected: number;
  wealthLevel: number;
}

interface TreasureHuntRewardProps {
  reward: TreasureHuntReward;
  onClaim: () => void;
  getRarityColor: (rarity: Rarity) => string;
  getDamageTypeColor: (dt: DamageType) => string;
}

const TreasureHuntRewardScene: React.FC<TreasureHuntRewardProps> = ({
  reward,
  onClaim,
  getRarityColor,
  getDamageTypeColor,
}) => {
  const [showContent, setShowContent] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onClaim();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClaim]);

  // Memoized particles for performance
  const particles = useMemo(() =>
    [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2.5 + Math.random() * 1.5}s`,
    })),
  []);

  // Render map pieces
  const renderMapPieces = () => {
    return [...Array(reward.piecesCollected)].map((_, i) => (
      <div
        key={i}
        className="map-progress__piece map-progress__piece--collected"
        style={{ animationDelay: `${i * 150}ms` }}
      >
        <MapPin className="map-progress__piece-icon" />
      </div>
    ));
  };

  // Render item reward card
  const renderItemCard = (item: Item, index: number) => (
    <Tooltip
      key={item.id}
      content={
        <div className="treasure-tooltip">
          <div className={`treasure-tooltip__name ${getRarityColor(item.rarity)}`}>
            {item.name}
          </div>
          <div className="treasure-tooltip__type">
            {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
          </div>
          {item.description && (
            <div className="treasure-tooltip__description">{item.description}</div>
          )}
          <div className="treasure-tooltip__stats">
            {Object.entries(item.stats).map(([key, val]) => (
              <div key={key} className="treasure-tooltip__stat">
                <span className="treasure-tooltip__stat-label">{formatStatName(key)}</span>
                <span className="treasure-tooltip__stat-value">+{val}</span>
              </div>
            ))}
          </div>
          {item.passive && (
            <div className="treasure-tooltip__passive">
              Passive: {item.description}
            </div>
          )}
        </div>
      }
    >
      <div
        className={`treasure-reward__card ${item.passive ? 'treasure-reward__card--artifact' : ''}`}
        style={{ animationDelay: `${index * 100 + 500}ms` }}
      >
        {/* Corner ornaments */}
        <div className="treasure-card__corner treasure-card__corner--tl" />
        <div className="treasure-card__corner treasure-card__corner--tr" />
        <div className="treasure-card__corner treasure-card__corner--bl" />
        <div className="treasure-card__corner treasure-card__corner--br" />

        {/* Artifact sparkle */}
        {item.passive && (
          <div className="treasure-card__artifact-badge">
            <Sparkles className="w-6 h-6" />
          </div>
        )}

        <div className="treasure-reward__card-content">
          <span className="treasure-reward__card-icon">{item.icon || '📦'}</span>
          <div className={`treasure-reward__card-name ${getRarityColor(item.rarity)}`}>
            {item.name}
          </div>
          <div className="treasure-reward__card-type">
            {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
          </div>

          {/* Quick stats */}
          <div className="treasure-reward__card-stats">
            {Object.entries(item.stats).slice(0, 2).map(([key, val]) => (
              <div key={key} className="treasure-card__stat">
                <span className="treasure-card__stat-label">{formatStatName(key)}</span>
                <span className="treasure-card__stat-value">+{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tooltip>
  );

  // Render skill scroll card
  const renderSkillCard = (skill: Skill, index: number) => (
    <Tooltip
      key={skill.id}
      content={
        <div className="treasure-tooltip">
          <div className={`treasure-tooltip__name ${skill.tier === SkillTier.FORBIDDEN ? 'text-red-500' : 'text-blue-200'}`}>
            {skill.name}
          </div>
          <div className="treasure-tooltip__type treasure-tooltip__type--skill">
            {skill.tier} Jutsu
          </div>
          <div className="treasure-tooltip__description">{skill.description}</div>

          <div className="treasure-tooltip__stats">
            <div className="treasure-tooltip__stat">
              <span className="treasure-tooltip__stat-label">Chakra Cost</span>
              <span className="treasure-tooltip__stat-value treasure-tooltip__stat-value--chakra">{skill.chakraCost}</span>
            </div>
            <div className="treasure-tooltip__stat">
              <span className="treasure-tooltip__stat-label">Damage Type</span>
              <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
            </div>
            <div className="treasure-tooltip__stat">
              <span className="treasure-tooltip__stat-label">Scales with</span>
              <span className={getStatColor(skill.scalingStat)}>{formatScalingStat(skill.scalingStat)}</span>
            </div>
          </div>

          {skill.effects && skill.effects.length > 0 && (
            <div className="treasure-tooltip__effects">
              <div className="treasure-tooltip__effects-title">Effects</div>
              {skill.effects.map((effect, idx) => (
                <div key={idx} className="treasure-tooltip__effect">
                  <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                  <span>{formatEffectDescription(effect)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div
        className="treasure-reward__card treasure-reward__card--skill"
        style={{ animationDelay: `${index * 100 + 600}ms` }}
      >
        {/* Corner ornaments */}
        <div className="treasure-card__corner treasure-card__corner--tl" />
        <div className="treasure-card__corner treasure-card__corner--tr" />
        <div className="treasure-card__corner treasure-card__corner--bl" />
        <div className="treasure-card__corner treasure-card__corner--br" />

        <div className="treasure-reward__card-content">
          <Scroll className="treasure-reward__card-scroll-icon" />
          <div className={`treasure-reward__card-name ${skill.tier === SkillTier.FORBIDDEN ? 'text-red-400' : 'text-blue-200'}`}>
            {skill.name}
          </div>
          <div className="treasure-reward__card-type treasure-reward__card-type--skill">
            {skill.tier} Scroll
          </div>
        </div>
      </div>
    </Tooltip>
  );

  return (
    <div className="treasure-modal">
      {/* Backdrop */}
      <div className="treasure-modal__backdrop" />

      {/* Main container */}
      <div className="treasure-modal__container treasure-reward">
        {/* Ambient particles */}
        <div className="treasure-reward__particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="treasure-reward__particle"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className={`treasure-reward__header ${showContent ? 'treasure-reward__header--visible' : ''}`}>
          <div className="treasure-reward__trophy">
            <Award className="treasure-reward__trophy-icon" />
          </div>
          <h2 className="treasure-modal__title">Map Complete!</h2>
          <p className="treasure-modal__subtitle">
            You've assembled all {reward.piecesCollected} map pieces
          </p>
        </div>

        {/* Map pieces display */}
        <div className={`treasure-reward__map-pieces ${showContent ? 'treasure-reward__map-pieces--visible' : ''}`}>
          <div className="map-progress__pieces">
            {renderMapPieces()}
          </div>
        </div>

        {/* Body */}
        <div className={`treasure-modal__body ${showContent ? 'treasure-modal__body--visible' : ''}`}>
          {/* Section header */}
          <div className="treasure-reward__section-header">
            <span className="treasure-reward__section-title">Your Rewards</span>
            <div className="treasure-reward__section-divider" />
          </div>

          {/* Reward cards grid */}
          <div className="treasure-reward__cards">
            {/* Item rewards */}
            {reward.items.map((item, index) => renderItemCard(item, index))}

            {/* Skill rewards */}
            {reward.skills.map((skill, index) => renderSkillCard(skill, index))}

            {/* Ryo reward */}
            {reward.ryo > 0 && (
              <div className="treasure-reward__card treasure-reward__card--ryo">
                {/* Corner ornaments */}
                <div className="treasure-card__corner treasure-card__corner--tl" />
                <div className="treasure-card__corner treasure-card__corner--tr" />
                <div className="treasure-card__corner treasure-card__corner--bl" />
                <div className="treasure-card__corner treasure-card__corner--br" />

                <div className="treasure-reward__card-content">
                  <Coins className="treasure-reward__card-ryo-icon" />
                  <div className="treasure-reward__card-ryo-amount">{reward.ryo}</div>
                  <div className="treasure-reward__card-type treasure-reward__card-type--ryo">Ryō</div>
                </div>
              </div>
            )}
          </div>

          {/* Wealth level indicator */}
          <div className="treasure-reward__wealth-info">
            Wealth Level {reward.wealthLevel} • {reward.piecesCollected} Pieces Collected
          </div>

          {/* Claim button */}
          <div className="treasure-reward__actions">
            <button
              type="button"
              onClick={onClaim}
              className="treasure-btn treasure-btn--gold treasure-btn--claim"
            >
              <span className="treasure-btn__label">Claim Rewards</span>
              <span className="treasure-btn__key">[SPACE]</span>
            </button>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="treasure-reward__footer">
          <div className="treasure-reward__footer-line treasure-reward__footer-line--left" />
          <MapPin className="treasure-reward__footer-icon" />
          <div className="treasure-reward__footer-line treasure-reward__footer-line--right" />
        </div>
      </div>
    </div>
  );
};

export default TreasureHuntRewardScene;
