import React, { useState, useMemo } from 'react';
import {
  ApproachType,
  TerrainDefinition,
  TerrainType,
  CharacterStats,
  Player,
  Enemy,
} from '../../game/types';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
  meetsApproachRequirements,
} from '../../game/constants/approaches';
import {
  Sword,
  Eye,
  Brain,
  TreePine,
  Wind,
  X,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import './ApproachSelector.css';

// Simplified combat node info for approach selection
interface CombatNodeInfo {
  id: string;
  type: 'COMBAT' | 'ELITE' | 'BOSS';
  terrain: TerrainType;
  enemy?: Enemy;
}

interface ApproachSelectorProps {
  node: CombatNodeInfo;
  terrain: TerrainDefinition;
  player: Player;
  playerStats: CharacterStats;
  onSelectApproach: (approach: ApproachType) => void;
  onCancel: () => void;
}

// Get success tier for styling
const getSuccessTier = (chance: number): string => {
  if (chance >= 80) return 'high';
  if (chance >= 60) return 'good';
  if (chance >= 40) return 'medium';
  if (chance >= 20) return 'low';
  return 'critical';
};

const ApproachSelector: React.FC<ApproachSelectorProps> = ({
  node,
  terrain,
  player,
  playerStats,
  onSelectApproach,
  onCancel,
}) => {
  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if this is an elite or boss
  const isEliteOrBoss = node.type === 'ELITE' || node.type === 'BOSS';

  // Get player stats as flat object for calculations
  const stats = useMemo(() => ({
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  }), [playerStats]);

  // Get player skill IDs
  const skillIds = useMemo(() => player.skills.map(s => s.id), [player.skills]);

  // Calculate approach availability and success chances
  const approaches = useMemo(() => {
    return Object.values(ApproachType).map(approachType => {
      const def = APPROACH_DEFINITIONS[approachType];

      // Bypass not available for elite/boss
      if (approachType === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
        return {
          type: approachType,
          def,
          available: false,
          reason: 'Cannot bypass Elite or Boss encounters',
          successChance: 0,
        };
      }

      const { meets, reason } = meetsApproachRequirements(
        approachType,
        stats,
        skillIds,
        node.terrain
      );

      const successChance = meets
        ? calculateApproachSuccessChance(approachType, stats, terrain.effects.stealthModifier)
        : 0;

      return {
        type: approachType,
        def,
        available: meets,
        reason,
        successChance: Math.round(successChance),
      };
    });
  }, [stats, skillIds, node.terrain, terrain, isEliteOrBoss]);

  // Get approach icon
  const getApproachIcon = (type: ApproachType): React.ReactNode => {
    switch (type) {
      case ApproachType.FRONTAL_ASSAULT:
        return <Sword />;
      case ApproachType.STEALTH_AMBUSH:
        return <Eye />;
      case ApproachType.GENJUTSU_SETUP:
        return <Brain />;
      case ApproachType.ENVIRONMENTAL_TRAP:
        return <TreePine />;
      case ApproachType.SHADOW_BYPASS:
        return <Wind />;
      default:
        return <Zap />;
    }
  };

  // Handle approach selection
  const handleSelect = (approach: ApproachType) => {
    setSelectedApproach(approach);
    setShowConfirm(true);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedApproach) {
      onSelectApproach(selectedApproach);
    }
  };

  const selectedDef = selectedApproach ? APPROACH_DEFINITIONS[selectedApproach] : null;
  const selectedInfo = approaches.find(a => a.type === selectedApproach);

  // Build card classes
  const getCardClasses = (approach: typeof approaches[0]): string => {
    const classes = ['approach-card'];
    if (approach.available) {
      classes.push('approach-card--available');
    } else {
      classes.push('approach-card--disabled');
    }
    if (selectedApproach === approach.type) {
      classes.push('approach-card--selected');
    }
    return classes.join(' ');
  };

  return (
    <div className="approach-modal">
      <div className="approach-modal__container">
        {/* Header */}
        <div className="approach-modal__header">
          <div>
            <h2 className="approach-modal__title">
              CHOOSE YOUR APPROACH
            </h2>
            <p className="approach-modal__subtitle">
              {node.enemy?.name || 'Unknown Enemy'} • {terrain.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="approach-modal__close"
            aria-label="Close approach selector"
          >
            <X className="approach-modal__close-icon" />
          </button>
        </div>

        {/* Approach Cards */}
        <div className="approach-modal__body">
          <div className="approach-modal__grid">
            {approaches.map(approach => {
              const tier = getSuccessTier(approach.successChance);

              return (
                <button
                  type="button"
                  key={approach.type}
                  onClick={() => approach.available && handleSelect(approach.type)}
                  disabled={!approach.available}
                  className={getCardClasses(approach)}
                >
                  {/* Icon and Name */}
                  <div className="approach-card__header">
                    <div className={`approach-card__icon approach-card__icon--${approach.available ? 'available' : 'disabled'}`}>
                      {getApproachIcon(approach.type)}
                    </div>
                    <div className="approach-card__title-group">
                      <h3 className={`approach-card__name approach-card__name--${approach.available ? 'available' : 'disabled'}`}>
                        {approach.def.name}
                      </h3>
                      {approach.type === ApproachType.FRONTAL_ASSAULT && (
                        <span className="approach-card__tag">Always Available</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`approach-card__description approach-card__description--${approach.available ? 'available' : 'disabled'}`}>
                    {approach.def.description}
                  </p>

                  {/* Success Chance */}
                  {approach.available && (
                    <div className="success-bar">
                      <div className="success-bar__header">
                        <span className="success-bar__label">Success Chance</span>
                        <span className={`success-bar__value success-bar__value--${tier}`}>
                          {approach.successChance}%
                        </span>
                      </div>
                      <div className="success-bar__track">
                        <div
                          className={`success-bar__fill success-bar__fill--${tier}`}
                          style={{ width: `${approach.successChance}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Requirements/Reason */}
                  {!approach.available && approach.reason && (
                    <div className="approach-card__requirement">
                      <AlertTriangle className="approach-card__requirement-icon" />
                      {approach.reason}
                    </div>
                  )}

                  {/* Cost indicators */}
                  {approach.available && approach.def.successEffects.chakraCost > 0 && (
                    <div className="approach-card__cost">
                      <Zap className="approach-card__cost-icon" />
                      Costs {approach.def.successEffects.chakraCost} Chakra
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Terrain Effects Summary */}
        <div className="terrain-effects">
          <div className="terrain-effects__content">
            <span className="terrain-effects__label">Terrain Effects:</span>
            {terrain.effects.stealthModifier !== 0 && (
              <span className={`terrain-effects__item terrain-effects__item--${terrain.effects.stealthModifier > 0 ? 'positive' : 'negative'}`}>
                Stealth {terrain.effects.stealthModifier > 0 ? '+' : ''}{terrain.effects.stealthModifier}%
              </span>
            )}
            {terrain.effects.initiativeModifier !== 0 && (
              <span className={`terrain-effects__item terrain-effects__item--${terrain.effects.initiativeModifier > 0 ? 'positive' : 'negative'}`}>
                Initiative {terrain.effects.initiativeModifier > 0 ? '+' : ''}{terrain.effects.initiativeModifier}
              </span>
            )}
            {terrain.effects.hazard && (
              <span className="terrain-effects__item terrain-effects__item--hazard">
                {terrain.effects.hazard.type} hazard active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedDef && selectedInfo && (
        <div className="confirm-modal">
          <div className="confirm-modal__container">
            <h3 className="confirm-modal__title">
              Confirm Approach
            </h3>

            <div className="confirm-modal__preview">
              <div className="confirm-modal__preview-icon">
                {getApproachIcon(selectedApproach!)}
              </div>
              <div className="confirm-modal__preview-info">
                <p className="confirm-modal__preview-name">{selectedDef.name}</p>
                <p className={`confirm-modal__preview-chance success-bar__value--${getSuccessTier(selectedInfo.successChance)}`}>
                  {selectedInfo.successChance}% Success Chance
                </p>
              </div>
            </div>

            {/* On Success */}
            <div className="confirm-modal__effects">
              <p className="confirm-modal__effects-title confirm-modal__effects-title--success">On Success:</p>
              <ul className="confirm-modal__effects-list">
                {selectedDef.successEffects.guaranteedFirst && (
                  <li>Guaranteed first turn</li>
                )}
                {selectedDef.successEffects.firstHitMultiplier > 1 && (
                  <li>First hit deals {selectedDef.successEffects.firstHitMultiplier}x damage</li>
                )}
                {selectedDef.successEffects.enemyHpReduction > 0 && (
                  <li>Enemy loses {selectedDef.successEffects.enemyHpReduction * 100}% HP</li>
                )}
                {selectedDef.successEffects.skipCombat && (
                  <li>Skip combat entirely (no XP/loot)</li>
                )}
                {selectedDef.successEffects.xpMultiplier > 1 && (
                  <li>+{Math.round((selectedDef.successEffects.xpMultiplier - 1) * 100)}% XP</li>
                )}
              </ul>
            </div>

            {/* On Failure (only show if different from frontal) */}
            {selectedApproach !== ApproachType.FRONTAL_ASSAULT && (
              <div className="confirm-modal__effects">
                <p className="confirm-modal__effects-title confirm-modal__effects-title--failure">On Failure:</p>
                <p className="confirm-modal__effects-list">
                  Normal combat (no bonuses or penalties)
                </p>
              </div>
            )}

            {/* Cost warning */}
            {selectedDef.successEffects.chakraCost > 0 && (
              <div className="confirm-modal__cost-warning">
                This approach costs {selectedDef.successEffects.chakraCost} Chakra
                {player.currentChakra < selectedDef.successEffects.chakraCost && (
                  <span className="confirm-modal__cost-warning--insufficient">
                    Warning: Not enough chakra!
                  </span>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="confirm-modal__buttons">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="confirm-modal__btn confirm-modal__btn--back"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedDef.successEffects.chakraCost > player.currentChakra}
                className="confirm-modal__btn confirm-modal__btn--confirm"
              >
                <Check className="confirm-modal__btn-icon" />
                Engage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproachSelector;
