import React, { useState, useCallback, useEffect } from 'react';
import {
  GameEvent,
  Player,
  EventChoice,
  EventOutcome,
  CharacterStats,
  RiskLevel,
  PrimaryStat,
} from '../../game/types';
import {
  checkRequirements,
  checkEventCost,
  getDisabledReason,
} from '../../game/systems/EventSystem';
import {
  Scroll,
  CheckCircle,
  Lock,
  AlertCircle,
  Swords,
  Coins,
  Sparkles,
} from 'lucide-react';
import './Event.css';

interface EventProps {
  activeEvent: GameEvent;
  onChoice: (choice: EventChoice) => void;
  player?: Player | null;
  playerStats?: CharacterStats | null;
}

/* ===========================================
   Helper Functions
   =========================================== */

const getRiskClass = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case RiskLevel.SAFE:
      return 'safe';
    case RiskLevel.LOW:
      return 'low';
    case RiskLevel.MEDIUM:
      return 'medium';
    case RiskLevel.HIGH:
      return 'high';
    case RiskLevel.EXTREME:
      return 'extreme';
    default:
      return 'safe';
  }
};

const getStatCategory = (stat: PrimaryStat): 'body' | 'mind' | 'technique' => {
  switch (stat) {
    case PrimaryStat.WILLPOWER:
    case PrimaryStat.CHAKRA:
    case PrimaryStat.STRENGTH:
      return 'body';
    case PrimaryStat.SPIRIT:
    case PrimaryStat.INTELLIGENCE:
    case PrimaryStat.CALMNESS:
      return 'mind';
    case PrimaryStat.SPEED:
    case PrimaryStat.ACCURACY:
    case PrimaryStat.DEXTERITY:
      return 'technique';
    default:
      return 'body';
  }
};

const getPlayerStatValue = (
  player: Player,
  stat: PrimaryStat
): number => {
  const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;
  return player.primaryStats[statKey] || 0;
};

const getOutcomeType = (
  outcome: EventOutcome
): 'reward' | 'danger' | 'neutral' => {
  const { effects } = outcome;

  if (effects.triggerCombat) return 'danger';
  if (effects.hpChange && (
    (typeof effects.hpChange === 'number' && effects.hpChange < 0) ||
    (typeof effects.hpChange === 'object' && effects.hpChange.percent < 0)
  )) return 'danger';

  if (effects.exp || effects.ryo || effects.items?.length || effects.skills?.length ||
      effects.statChanges || effects.upgradeTreasureQuality || effects.addMerchantSlot) {
    return 'reward';
  }

  return 'neutral';
};

const formatOutcomeText = (outcome: EventOutcome): string => {
  const { effects } = outcome;
  const parts: string[] = [];

  if (effects.triggerCombat) {
    parts.push(`Combat: ${effects.triggerCombat.name || 'Enemy'}`);
  }
  if (effects.exp) parts.push(`+${effects.exp} XP`);
  if (effects.ryo) parts.push(`${effects.ryo > 0 ? '+' : ''}${effects.ryo} Ryo`);
  if (effects.hpChange) {
    if (typeof effects.hpChange === 'number') {
      parts.push(`${effects.hpChange > 0 ? '+' : ''}${effects.hpChange} HP`);
    } else {
      parts.push(`${effects.hpChange.percent > 0 ? '+' : ''}${effects.hpChange.percent}% HP`);
    }
  }
  if (effects.statChanges) {
    Object.entries(effects.statChanges).forEach(([stat, value]) => {
      if (value) parts.push(`+${value} ${stat.toUpperCase()}`);
    });
  }
  if (effects.upgradeTreasureQuality) parts.push('Treasure Quality ↑');
  if (effects.addMerchantSlot) parts.push('+1 Merchant Slot');
  if (effects.intelGain) parts.push(`+${effects.intelGain} Intel`);

  return parts.length > 0 ? parts.join(', ') : effects.logMessage || 'Story continues...';
};

/* ===========================================
   Risk Badge Component
   =========================================== */

interface RiskBadgeProps {
  riskLevel: RiskLevel;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel }) => {
  return (
    <span className={`risk-badge risk-badge--${getRiskClass(riskLevel)}`}>
      {riskLevel}
    </span>
  );
};

/* ===========================================
   Outcome Preview Component
   =========================================== */

interface OutcomePreviewProps {
  outcomes: EventOutcome[];
}

const OutcomePreview: React.FC<OutcomePreviewProps> = ({ outcomes }) => {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);

  return (
    <div className="choice-card__outcomes">
      <div className="choice-card__outcomes-header">Possible Outcomes</div>
      {outcomes.map((outcome, idx) => {
        const type = getOutcomeType(outcome);
        const percent = Math.round((outcome.weight / totalWeight) * 100);
        const text = formatOutcomeText(outcome);

        return (
          <div key={idx} className="choice-card__outcome">
            <span className="choice-card__outcome-percent">{percent}%</span>
            <span className={`choice-card__outcome-type choice-card__outcome-type--${type}`}>
              {type}
            </span>
            <span className="choice-card__outcome-text">{text}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ===========================================
   Choice Card Component
   =========================================== */

interface ChoiceCardProps {
  choice: EventChoice;
  player: Player;
  playerStats: CharacterStats | null;
  isSelected: boolean;
  isDimmed: boolean;
  index: number;
  onSelect: () => void;
  onConfirm: () => void;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  choice,
  player,
  playerStats,
  isSelected,
  isDimmed,
  index,
  onSelect,
  onConfirm,
}) => {
  const meetsRequirements = checkRequirements(player, choice.requirements, playerStats);
  const canAffordCost = checkEventCost(player, choice.costs);
  const isDisabled = !meetsRequirements || !canAffordCost;
  const disabledReason = isDisabled
    ? getDisabledReason(player, choice.requirements, choice.costs, playerStats)
    : '';

  const riskClass = getRiskClass(choice.riskLevel);

  const handleClick = useCallback(() => {
    if (!isDisabled && !isDimmed) {
      onSelect();
    }
  }, [isDisabled, isDimmed, onSelect]);

  const handleConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onConfirm();
    },
    [onConfirm]
  );

  // Stat requirement display
  const statRequirement = choice.requirements?.minStat;
  const playerStatValue = statRequirement
    ? getPlayerStatValue(player, statRequirement.stat)
    : 0;
  const statCategory = statRequirement
    ? getStatCategory(statRequirement.stat)
    : 'body';

  return (
    <div
      className={`choice-card choice-card--${riskClass} ${
        isSelected ? 'choice-card--selected' : ''
      } ${isDimmed ? 'choice-card--dimmed' : ''} ${
        isDisabled ? 'choice-card--disabled' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={isDisabled || isDimmed ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header */}
      <div className="choice-card__header">
        <div className="choice-card__header-left">
          <span className="choice-card__index">{index + 1}</span>
          <RiskBadge riskLevel={choice.riskLevel} />
          <span className="choice-card__label">{choice.label}</span>
        </div>
        {choice.costs?.ryo && (
          <span
            className={`choice-card__cost ${
              !canAffordCost ? 'choice-card__cost--insufficient' : ''
            }`}
          >
            -{choice.costs.ryo} Ryo
          </span>
        )}
      </div>

      {/* Body */}
      <div className="choice-card__body">
        <p className="choice-card__description">{choice.description}</p>

        {choice.hintText && (
          <p className="choice-card__hint">"{choice.hintText}"</p>
        )}

        {/* Requirements */}
        {statRequirement && (
          <div className="choice-card__requirements">
            <span
              className={`choice-card__requirement ${
                meetsRequirements
                  ? 'choice-card__requirement--met'
                  : 'choice-card__requirement--unmet'
              }`}
            >
              {meetsRequirements ? <CheckCircle size={12} /> : <Lock size={12} />}
              <span>REQUIRES: {statRequirement.stat} {statRequirement.value}+</span>
            </span>
            <span
              className={`choice-card__stat-value choice-card__stat-value--${statCategory}`}
            >
              YOUR {statRequirement.stat}: {playerStatValue}
            </span>
          </div>
        )}

        {/* Status */}
        {!isDisabled && (
          <div className="choice-card__status choice-card__status--available">
            <CheckCircle size={12} />
            <span>Available</span>
          </div>
        )}

        {isDisabled && disabledReason && (
          <div className="choice-card__disabled-reason">
            <AlertCircle size={14} />
            <span>{disabledReason}</span>
          </div>
        )}

        {/* Outcome Preview (when selected) */}
        {isSelected && !isDisabled && choice.outcomes && (
          <OutcomePreview outcomes={choice.outcomes} />
        )}

        {/* Confirm Button (when selected) */}
        {isSelected && !isDisabled && (
          <div className="choice-card__confirm">
            <button
              type="button"
              className={`choice-card__confirm-button choice-card__confirm-button--${riskClass}`}
              onClick={handleConfirm}
            >
              {choice.riskLevel === RiskLevel.HIGH ||
              choice.riskLevel === RiskLevel.EXTREME ? (
                <Swords size={16} />
              ) : choice.costs?.ryo ? (
                <Coins size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              <span>{choice.label}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ===========================================
   Main Event Component
   =========================================== */

const Event: React.FC<EventProps> = ({
  activeEvent,
  onChoice,
  player,
  playerStats,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleConfirm = useCallback(
    (choice: EventChoice) => {
      onChoice(choice);
    },
    [onChoice]
  );

  // Check if a choice is available (meets requirements and can afford)
  const isChoiceAvailable = useCallback((choice: EventChoice) => {
    if (!player) return false;
    const meetsReqs = checkRequirements(player, choice.requirements, playerStats);
    const canAfford = checkEventCost(player, choice.costs);
    return meetsReqs && canAfford;
  }, [player, playerStats]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!player) return;

    const key = e.key;

    // Number keys 1-4 to select choice
    if (key >= '1' && key <= '4') {
      e.preventDefault();
      const index = parseInt(key) - 1;
      if (index < activeEvent.choices.length) {
        const choice = activeEvent.choices[index];
        if (isChoiceAvailable(choice)) {
          handleSelect(index);
        }
      }
    }

    // Enter to confirm selected choice
    if (key === 'Enter' && selectedIndex !== null) {
      e.preventDefault();
      const choice = activeEvent.choices[selectedIndex];
      if (isChoiceAvailable(choice)) {
        onChoice(choice);
      }
    }

    // Escape to deselect
    if (key === 'Escape' && selectedIndex !== null) {
      e.preventDefault();
      setSelectedIndex(null);
    }
  }, [player, activeEvent.choices, selectedIndex, isChoiceAvailable, handleSelect, onChoice]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!player) {
    return null;
  }

  return (
    <div className="event">
      {/* Header */}
      <header className="event__header">
        <div className="event__icon">
          <Scroll size={40} />
        </div>
        <h1 className="event__title">{activeEvent.title}</h1>
        <p className="event__description">{activeEvent.description}</p>
      </header>

      {/* Keyboard Hints */}
      <div className="event__hints">
        <span className="event__hint">
          <span className="sw-shortcut">1</span>-<span className="sw-shortcut">4</span> Select
        </span>
        <span className="event__hint">
          <span className="sw-shortcut">Enter</span> Confirm
        </span>
        <span className="event__hint">
          <span className="sw-shortcut">Esc</span> Deselect
        </span>
      </div>

      {/* Divider */}
      <div className="event__divider">Choose Your Path</div>

      {/* Choice Cards */}
      <div className="event__choices">
        {activeEvent.choices.map((choice, idx) => (
          <ChoiceCard
            key={idx}
            choice={choice}
            player={player}
            playerStats={playerStats || null}
            isSelected={selectedIndex === idx}
            isDimmed={selectedIndex !== null && selectedIndex !== idx}
            index={idx}
            onSelect={() => handleSelect(idx)}
            onConfirm={() => handleConfirm(choice)}
          />
        ))}
      </div>
    </div>
  );
};

export default Event;
