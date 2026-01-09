import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  TrainingActivity,
  TrainingIntensity,
  PrimaryStat,
  Player,
  DerivedStats
} from '../../game/types';
import {
  Heart,
  Droplet,
  Sword,
  Flame,
  Brain,
  Eye,
  Wind,
  Target,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import './Training.css';

interface TrainingProps {
  training: TrainingActivity;
  player: Player;
  playerStats: { derived: DerivedStats };
  onTrain: (stat: PrimaryStat, intensity: TrainingIntensity) => void;
  onSkip: () => void;
}

type StatCategory = 'body' | 'mind' | 'technique';

interface StatInfo {
  category: StatCategory;
  categoryLabel: string;
  icon: LucideIcon;
  description: string;
  benefits: string[];
}

const STAT_INFO: Record<PrimaryStat, StatInfo> = {
  [PrimaryStat.WILLPOWER]: {
    category: 'body',
    categoryLabel: 'THE BODY',
    icon: Heart,
    description: 'Your vital force and will to survive.',
    benefits: ['Max HP', 'Guts %', 'HP Regen'],
  },
  [PrimaryStat.CHAKRA]: {
    category: 'body',
    categoryLabel: 'THE BODY',
    icon: Droplet,
    description: 'Your spiritual energy reservoir.',
    benefits: ['Max Chakra'],
  },
  [PrimaryStat.STRENGTH]: {
    category: 'body',
    categoryLabel: 'THE BODY',
    icon: Sword,
    description: 'Raw physical power.',
    benefits: ['Physical ATK', 'Physical DEF'],
  },
  [PrimaryStat.SPIRIT]: {
    category: 'mind',
    categoryLabel: 'THE MIND',
    icon: Flame,
    description: 'Elemental affinity and inner flame.',
    benefits: ['Elemental ATK', 'Elemental DEF'],
  },
  [PrimaryStat.INTELLIGENCE]: {
    category: 'mind',
    categoryLabel: 'THE MIND',
    icon: Brain,
    description: 'Mental acuity for complex jutsu.',
    benefits: ['Jutsu Req', 'Chakra Regen'],
  },
  [PrimaryStat.CALMNESS]: {
    category: 'mind',
    categoryLabel: 'THE MIND',
    icon: Eye,
    description: 'Fortitude against illusions.',
    benefits: ['Mental DEF', 'Status Resist'],
  },
  [PrimaryStat.SPEED]: {
    category: 'technique',
    categoryLabel: 'THE TECHNIQUE',
    icon: Wind,
    description: 'Swiftness in combat.',
    benefits: ['Initiative', 'Evasion', 'Melee Hit'],
  },
  [PrimaryStat.ACCURACY]: {
    category: 'technique',
    categoryLabel: 'THE TECHNIQUE',
    icon: Target,
    description: 'Precision for ranged attacks.',
    benefits: ['Ranged Hit', 'Ranged Crit DMG'],
  },
  [PrimaryStat.DEXTERITY]: {
    category: 'technique',
    categoryLabel: 'THE TECHNIQUE',
    icon: Sparkles,
    description: 'Finesse for critical strikes.',
    benefits: ['Crit Chance'],
  },
};

const STAT_DISPLAY_NAMES: Record<PrimaryStat, string> = {
  [PrimaryStat.WILLPOWER]: 'Willpower',
  [PrimaryStat.CHAKRA]: 'Chakra',
  [PrimaryStat.STRENGTH]: 'Strength',
  [PrimaryStat.SPIRIT]: 'Spirit',
  [PrimaryStat.INTELLIGENCE]: 'Intelligence',
  [PrimaryStat.CALMNESS]: 'Calmness',
  [PrimaryStat.SPEED]: 'Speed',
  [PrimaryStat.ACCURACY]: 'Accuracy',
  [PrimaryStat.DEXTERITY]: 'Dexterity',
};

const INTENSITY_ORDER: TrainingIntensity[] = ['light', 'medium', 'intense'];

/* ===========================================
   Resource Panel Component
   =========================================== */

interface ResourcePanelProps {
  currentHp: number;
  maxHp: number;
  currentChakra: number;
  maxChakra: number;
  previewCost: { hp: number; chakra: number } | null;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({
  currentHp,
  maxHp,
  currentChakra,
  maxChakra,
  previewCost,
}) => {
  const hpPercent = (currentHp / maxHp) * 100;
  const chakraPercent = (currentChakra / maxChakra) * 100;

  const previewHp = previewCost ? currentHp - previewCost.hp : currentHp;
  const previewChakra = previewCost ? currentChakra - previewCost.chakra : currentChakra;
  const previewHpPercent = previewCost ? (previewHp / maxHp) * 100 : hpPercent;
  const previewChakraPercent = previewCost ? (previewChakra / maxChakra) * 100 : chakraPercent;

  return (
    <div className="resource-panel">
      <div className="resource-panel__content">
        {/* HP */}
        <div className="resource-panel__item">
          <div className="resource-panel__label">
            <Heart size={12} />
            <span>Vitality</span>
          </div>
          <div className="resource-panel__bar">
            <div
              className="resource-panel__bar-fill resource-panel__bar-fill--hp"
              style={{ width: `${hpPercent}%` }}
            />
            {previewCost && previewHpPercent < hpPercent && (
              <div
                className="resource-panel__bar-preview"
                style={{
                  left: `${previewHpPercent}%`,
                  width: `${hpPercent - previewHpPercent}%`,
                }}
              />
            )}
          </div>
          <div className="resource-panel__values">
            <span className="resource-panel__current">{currentHp}/{maxHp}</span>
            {previewCost && (
              <>
                <span className="resource-panel__arrow">→</span>
                <span className="resource-panel__preview">{previewHp}</span>
                <span className="resource-panel__cost">(-{previewCost.hp})</span>
              </>
            )}
          </div>
        </div>

        {/* Chakra */}
        <div className="resource-panel__item">
          <div className="resource-panel__label">
            <Droplet size={12} />
            <span>Chakra</span>
          </div>
          <div className="resource-panel__bar">
            <div
              className="resource-panel__bar-fill resource-panel__bar-fill--chakra"
              style={{ width: `${chakraPercent}%` }}
            />
            {previewCost && previewChakraPercent < chakraPercent && (
              <div
                className="resource-panel__bar-preview"
                style={{
                  left: `${previewChakraPercent}%`,
                  width: `${chakraPercent - previewChakraPercent}%`,
                }}
              />
            )}
          </div>
          <div className="resource-panel__values">
            <span className="resource-panel__current">{currentChakra}/{maxChakra}</span>
            {previewCost && (
              <>
                <span className="resource-panel__arrow">→</span>
                <span className="resource-panel__preview">{previewChakra}</span>
                <span className="resource-panel__cost">(-{previewCost.chakra})</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===========================================
   Intensity Selector Component
   =========================================== */

interface IntensitySelectorProps {
  option: TrainingActivity['options'][0];
  selectedIntensity: TrainingIntensity | null;
  onSelect: (intensity: TrainingIntensity) => void;
  canAfford: (hp: number, chakra: number) => boolean;
}

const IntensitySelector: React.FC<IntensitySelectorProps> = ({
  option,
  selectedIntensity,
  onSelect,
  canAfford,
}) => {
  return (
    <div className="intensity-selector">
      {INTENSITY_ORDER.map((intensity) => {
        const data = option.intensities[intensity];
        const affordable = canAfford(data.cost.hp, data.cost.chakra);
        const isSelected = selectedIntensity === intensity;

        return (
          <button
            key={intensity}
            type="button"
            className={`intensity-option intensity-option--${intensity} ${
              isSelected ? 'intensity-option--selected' : ''
            } ${!affordable ? 'intensity-option--disabled' : ''}`}
            onClick={() => affordable && onSelect(intensity)}
            disabled={!affordable}
          >
            <div className="intensity-option__left">
              <div className="intensity-option__radio">
                <div className="intensity-option__radio-dot" />
              </div>
              <span className={`intensity-option__label intensity-option__label--${intensity}`}>
                {intensity}
              </span>
              <span className="intensity-option__gain">+{data.gain}</span>
            </div>
            <div className="intensity-option__right">
              <span className={`intensity-option__cost intensity-option__cost--hp ${!affordable ? 'intensity-option__insufficient' : ''}`}>
                {data.cost.hp} HP
              </span>
              <span className={`intensity-option__cost intensity-option__cost--chakra ${!affordable ? 'intensity-option__insufficient' : ''}`}>
                {data.cost.chakra} CK
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

/* ===========================================
   Stat Card Component
   =========================================== */

interface StatCardProps {
  option: TrainingActivity['options'][0];
  currentValue: number;
  isSelected: boolean;
  isDimmed: boolean;
  selectedIntensity: TrainingIntensity | null;
  index: number;
  onSelect: () => void;
  onIntensityChange: (intensity: TrainingIntensity) => void;
  canAfford: (hp: number, chakra: number) => boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  option,
  currentValue,
  isSelected,
  isDimmed,
  selectedIntensity,
  index,
  onSelect,
  onIntensityChange,
  canAfford,
}) => {
  const info = STAT_INFO[option.stat];
  const Icon = info.icon;
  const displayName = STAT_DISPLAY_NAMES[option.stat];

  const handleClick = useCallback(() => {
    if (!isSelected) {
      onSelect();
    }
  }, [isSelected, onSelect]);

  return (
    <div
      className={`stat-card stat-card--${info.category} ${
        isSelected ? 'stat-card--selected' : ''
      } ${isDimmed ? 'stat-card--dimmed' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header */}
      <div className="stat-card__header">
        <div>
          <span className="stat-card__index">{index + 1}</span>
          <span className="stat-card__category">{info.categoryLabel}</span>
        </div>
        <span className={`stat-card__value stat-card__value--${info.category}`}>
          {currentValue}
        </span>
      </div>

      {/* Title with Icon */}
      <div className="stat-card__title">
        <div className={`stat-card__icon stat-card__icon--${info.category}`}>
          <Icon size={18} />
        </div>
        <span className="stat-card__name">{displayName}</span>
      </div>

      {/* Benefits */}
      <div className="stat-card__benefits">
        {info.benefits.map((benefit) => (
          <span key={benefit} className="stat-card__benefit">
            {benefit}
          </span>
        ))}
      </div>

      {/* Intensity Selector */}
      <IntensitySelector
        option={option}
        selectedIntensity={isSelected ? selectedIntensity : null}
        onSelect={onIntensityChange}
        canAfford={canAfford}
      />
    </div>
  );
};

/* ===========================================
   Train Button Component
   =========================================== */

interface TrainButtonProps {
  stat: PrimaryStat;
  gain: number;
  category: StatCategory;
  onClick: () => void;
  disabled: boolean;
}

const TrainButton: React.FC<TrainButtonProps> = ({
  stat,
  gain,
  category,
  onClick,
  disabled,
}) => {
  const displayName = STAT_DISPLAY_NAMES[stat];

  return (
    <div className="train-button-container">
      <button
        type="button"
        className={`train-button train-button--${category}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span>Train {displayName}</span>
        <span className="train-button__gain">+{gain}</span>
      </button>
    </div>
  );
};

/* ===========================================
   Main Training Component
   =========================================== */

const Training: React.FC<TrainingProps> = ({
  training,
  player,
  playerStats,
  onTrain,
  onSkip,
}) => {
  const [selectedStat, setSelectedStat] = useState<PrimaryStat | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<TrainingIntensity | null>(null);

  const canAfford = useCallback((hp: number, chakra: number): boolean => {
    return player.currentHp > hp && player.currentChakra >= chakra;
  }, [player.currentHp, player.currentChakra]);

  const getStatValue = useCallback((stat: PrimaryStat): number => {
    const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;
    return player.primaryStats[statKey] || 0;
  }, [player.primaryStats]);

  const selectedOption = useMemo(() => {
    if (!selectedStat) return null;
    return training.options.find((opt) => opt.stat === selectedStat) || null;
  }, [selectedStat, training.options]);

  const previewCost = useMemo(() => {
    if (!selectedOption || !selectedIntensity) return null;
    return selectedOption.intensities[selectedIntensity].cost;
  }, [selectedOption, selectedIntensity]);

  const handleStatSelect = useCallback((stat: PrimaryStat) => {
    setSelectedStat(stat);
    setSelectedIntensity(null);
  }, []);

  const handleIntensitySelect = useCallback((intensity: TrainingIntensity) => {
    setSelectedIntensity(intensity);
  }, []);

  const handleTrain = useCallback(() => {
    if (selectedStat && selectedIntensity) {
      onTrain(selectedStat, selectedIntensity);
    }
  }, [selectedStat, selectedIntensity, onTrain]);

  const canTrain = useMemo(() => {
    if (!selectedOption || !selectedIntensity) return false;
    const cost = selectedOption.intensities[selectedIntensity].cost;
    return canAfford(cost.hp, cost.chakra);
  }, [selectedOption, selectedIntensity, canAfford]);

  const selectedCategory = selectedStat ? STAT_INFO[selectedStat].category : null;
  const selectedGain = selectedOption && selectedIntensity
    ? selectedOption.intensities[selectedIntensity].gain
    : 0;

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toUpperCase();

    // Number keys 1-9 to select stat
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      if (index < training.options.length) {
        handleStatSelect(training.options[index].stat);
      }
    }

    // L/M/I for intensity (only when stat is selected)
    if (selectedStat && selectedOption) {
      if (key === 'L') {
        e.preventDefault();
        const data = selectedOption.intensities.light;
        if (canAfford(data.cost.hp, data.cost.chakra)) {
          handleIntensitySelect('light');
        }
      } else if (key === 'M') {
        e.preventDefault();
        const data = selectedOption.intensities.medium;
        if (canAfford(data.cost.hp, data.cost.chakra)) {
          handleIntensitySelect('medium');
        }
      } else if (key === 'I') {
        e.preventDefault();
        const data = selectedOption.intensities.intense;
        if (canAfford(data.cost.hp, data.cost.chakra)) {
          handleIntensitySelect('intense');
        }
      }
    }

    // Enter to train
    if (e.key === 'Enter' && selectedStat && selectedIntensity && canTrain) {
      e.preventDefault();
      handleTrain();
    }

    // Escape to skip or deselect
    if (e.key === 'Escape') {
      e.preventDefault();
      if (selectedStat) {
        setSelectedStat(null);
        setSelectedIntensity(null);
      } else {
        onSkip();
      }
    }
  }, [training.options, selectedStat, selectedOption, selectedIntensity, canTrain, canAfford, handleStatSelect, handleIntensitySelect, handleTrain, onSkip]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="training">
      {/* Header */}
      <header className="training__header">
        <h1 className="training__title">Training Grounds</h1>
        <p className="training__subtitle">"Forge your body and spirit"</p>
      </header>

      {/* Keyboard Hints */}
      <div className="training__hints">
        <span className="training__hint">
          <span className="sw-shortcut">1</span>-<span className="sw-shortcut">9</span> Select Stat
        </span>
        <span className="training__hint">
          <span className="sw-shortcut">L</span>/<span className="sw-shortcut">M</span>/<span className="sw-shortcut">I</span> Intensity
        </span>
        <span className="training__hint">
          <span className="sw-shortcut">Enter</span> Train
        </span>
        <span className="training__hint">
          <span className="sw-shortcut">Esc</span> Skip
        </span>
      </div>

      {/* Resource Panel */}
      <ResourcePanel
        currentHp={player.currentHp}
        maxHp={playerStats.derived.maxHp}
        currentChakra={player.currentChakra}
        maxChakra={playerStats.derived.maxChakra}
        previewCost={previewCost}
      />

      {/* Stat Cards */}
      <div className="training__cards">
        {training.options.map((option, idx) => (
          <StatCard
            key={option.stat}
            option={option}
            currentValue={getStatValue(option.stat)}
            isSelected={selectedStat === option.stat}
            isDimmed={selectedStat !== null && selectedStat !== option.stat}
            selectedIntensity={selectedIntensity}
            index={idx}
            onSelect={() => handleStatSelect(option.stat)}
            onIntensityChange={handleIntensitySelect}
            canAfford={canAfford}
          />
        ))}
      </div>

      {/* Train Button */}
      {selectedStat && selectedIntensity && selectedCategory && (
        <TrainButton
          stat={selectedStat}
          gain={selectedGain}
          category={selectedCategory}
          onClick={handleTrain}
          disabled={!canTrain}
        />
      )}

      {/* Skip Button */}
      <div className="training__skip">
        <button
          type="button"
          className="training__skip-button"
          onClick={onSkip}
        >
          Skip Training
        </button>
      </div>
    </div>
  );
};

export default Training;
