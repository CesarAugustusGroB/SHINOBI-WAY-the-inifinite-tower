import React, { useEffect, useCallback } from 'react';
import { Enemy, Item, Player, CharacterStats, Rarity } from '../../game/types';
import { Shield, Zap, Swords, Wind } from 'lucide-react';
import { getEscapeChanceDescription } from '../../game/systems/EliteChallengeSystem';
import { getEnemyFullStats } from '../../game/systems/StatSystem';
import './EliteChallenge.css';

interface EliteChallengeProps {
  enemy: Enemy;
  artifact: Item | null;
  player: Player;
  playerStats: CharacterStats;
  onFight: () => void;
  onEscape?: () => void;
  customTitle?: string;
  customDescription?: string;
}

// Helper for rarity class
const getRarityClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:
      return 'elite-challenge__artifact-name--broken';
    case Rarity.RARE:
      return 'elite-challenge__artifact-name--rare';
    case Rarity.EPIC:
      return 'elite-challenge__artifact-name--epic';
    case Rarity.LEGENDARY:
      return 'elite-challenge__artifact-name--legendary';
    case Rarity.CURSED:
      return 'elite-challenge__artifact-name--cursed';
    default:
      return 'elite-challenge__artifact-name--common';
  }
};

const EliteChallenge: React.FC<EliteChallengeProps> = ({
  enemy,
  artifact,
  playerStats,
  onFight,
  onEscape,
  customTitle,
  customDescription
}) => {
  const escapeInfo = getEscapeChanceDescription(playerStats);
  const enemyStats = getEnemyFullStats(enemy);

  // Keyboard shortcuts: F for Fight, E for Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      onFight();
    } else if (e.key.toLowerCase() === 'e' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  }, [onFight, onEscape]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get escape chance color class
  const getEscapeChanceClass = (chance: number): string => {
    if (chance >= 60) return 'elite-challenge__escape-chance--high';
    if (chance >= 40) return 'elite-challenge__escape-chance--medium';
    return 'elite-challenge__escape-chance--low';
  };

  return (
    <div className="elite-challenge">
      {/* Header */}
      <div className="elite-challenge__icon">
        <Shield size={48} />
      </div>
      <h2 className="elite-challenge__title">
        {customTitle || 'Artifact Guardian'}
      </h2>
      <p className="elite-challenge__subtitle">
        {customDescription || 'A powerful guardian stands between you and a rare artifact. Will you fight or flee?'}
      </p>

      {/* Keyboard Hints */}
      <div className="elite-challenge__hints">
        <span className="elite-challenge__hint">
          <span className="sw-shortcut">F</span> Fight
        </span>
        {onEscape && (
          <span className="elite-challenge__hint">
            <span className="sw-shortcut">E</span> Escape
          </span>
        )}
      </div>

      {/* Enemy Info */}
      <div className="elite-challenge__enemy">
        <div className="elite-challenge__enemy-header">
          <div>
            <h3 className="elite-challenge__enemy-name">{enemy.name}</h3>
            <p className="elite-challenge__enemy-type">{enemy.tier} Guardian</p>
          </div>
          <div className="elite-challenge__enemy-element-wrapper">
            <div className="elite-challenge__enemy-element-label">Element</div>
            <div className="elite-challenge__enemy-element">{enemy.element}</div>
          </div>
        </div>

        {/* Enemy Stats Preview */}
        <div className="elite-challenge__enemy-stats">
          <div className="elite-challenge__enemy-stat">
            <span className="elite-challenge__enemy-stat-label">HP</span>
            <span className="elite-challenge__enemy-stat-value--hp">{enemyStats.derived.maxHp}</span>
          </div>
          <div className="elite-challenge__enemy-stat">
            <span className="elite-challenge__enemy-stat-label">ATK</span>
            <span className="elite-challenge__enemy-stat-value--atk">{enemy.primaryStats.strength}</span>
          </div>
          <div className="elite-challenge__enemy-stat">
            <span className="elite-challenge__enemy-stat-label">SPD</span>
            <span className="elite-challenge__enemy-stat-value--spd">{enemy.primaryStats.speed}</span>
          </div>
        </div>
      </div>

      {/* Artifact Preview - Only shown when artifact exists */}
      {artifact && (
        <div className="elite-challenge__artifact">
          <div className="elite-challenge__artifact-header">
            <Zap size={16} className="elite-challenge__artifact-icon" />
            <span className="elite-challenge__artifact-label">Guarded Artifact</span>
          </div>
          <div className="elite-challenge__artifact-main">
            <div>
              <h4 className={`elite-challenge__artifact-name ${getRarityClass(artifact.rarity)}`}>
                {artifact.icon && <span className="elite-challenge__artifact-emoji">{artifact.icon}</span>}
                {artifact.name}
              </h4>
              <p className="elite-challenge__artifact-rarity">{artifact.rarity}</p>
            </div>
          </div>
          {artifact.description && (
            <p className="elite-challenge__artifact-description">{artifact.description}</p>
          )}
          {/* Show key stats */}
          <div className="elite-challenge__artifact-stats">
            {Object.entries(artifact.stats).slice(0, 4).map(([key, val]) => (
              val ? <span key={key}>+{val} {key.toUpperCase()}</span> : null
            ))}
          </div>
        </div>
      )}

      {/* Choice Buttons */}
      <div className="elite-challenge__choices">
        {/* Fight Button */}
        <button
          type="button"
          onClick={onFight}
          className="elite-challenge__choice-btn elite-challenge__choice-btn--fight"
        >
          <div className="elite-challenge__choice-content">
            <Swords size={20} className="elite-challenge__choice-icon--fight" />
            <div className="elite-challenge__choice-text">
              <div className="elite-challenge__choice-title--fight">
                Challenge Guardian
              </div>
              <div className="elite-challenge__choice-desc">
                Face the guardian in combat. Victory: Claim the artifact.
              </div>
            </div>
          </div>
        </button>

        {/* Escape Button - Only shown if escape is allowed */}
        {onEscape && (
          <button
            type="button"
            onClick={onEscape}
            className="elite-challenge__choice-btn elite-challenge__choice-btn--escape"
          >
            <div className="elite-challenge__choice-content">
              <Wind size={20} className="elite-challenge__choice-icon--escape" />
              <div className="elite-challenge__choice-text elite-challenge__choice-text--flex">
                <div className="elite-challenge__escape-header">
                  <span className="elite-challenge__choice-title--escape">
                    Attempt Escape
                  </span>
                  <span className={`elite-challenge__escape-chance ${getEscapeChanceClass(escapeInfo.chance)}`}>
                    {escapeInfo.chance}%
                  </span>
                </div>
                <div className="elite-challenge__choice-desc">
                  Use your speed to slip away. Your Speed: {escapeInfo.speedValue} (+{escapeInfo.speedBonus}% bonus)
                </div>
                <div className="elite-challenge__escape-failure">
                  Failure: Must fight anyway
                </div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Escape Formula Hint - Only shown if escape is allowed */}
      {onEscape && (
        <div className="elite-challenge__footer">
          Escape chance = 30% base + (Speed x 2), max 80%
        </div>
      )}
    </div>
  );
};

export default EliteChallenge;
