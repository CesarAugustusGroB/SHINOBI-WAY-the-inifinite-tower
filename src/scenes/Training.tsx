import React from 'react';
import {
  TrainingActivity,
  TrainingIntensity,
  PrimaryStat,
  Player,
  DerivedStats
} from '../game/types';
import { Heart, Zap, Dumbbell } from 'lucide-react';

interface TrainingProps {
  training: TrainingActivity;
  player: Player;
  playerStats: { derived: DerivedStats };
  onTrain: (stat: PrimaryStat, intensity: TrainingIntensity) => void;
  onSkip: () => void;
}

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

const STAT_DESCRIPTIONS: Record<PrimaryStat, string> = {
  [PrimaryStat.WILLPOWER]: 'Max HP, Guts chance, HP Regen',
  [PrimaryStat.CHAKRA]: 'Max Chakra capacity',
  [PrimaryStat.STRENGTH]: 'Taijutsu Dmg, Physical Defense',
  [PrimaryStat.SPIRIT]: 'Elemental Dmg, Elemental Defense',
  [PrimaryStat.INTELLIGENCE]: 'Jutsu Requirements, Chakra Regen',
  [PrimaryStat.CALMNESS]: 'Genjutsu Defense, Status Resistance',
  [PrimaryStat.SPEED]: 'Initiative, Melee Hit, Evasion',
  [PrimaryStat.ACCURACY]: 'Ranged Hit, Ranged Crit Multiplier',
  [PrimaryStat.DEXTERITY]: 'Critical Hit Chance',
};

const INTENSITY_COLORS: Record<TrainingIntensity, { bg: string; border: string; text: string; hover: string }> = {
  light: {
    bg: 'bg-green-900/20',
    border: 'border-green-700',
    text: 'text-green-400',
    hover: 'hover:bg-green-900/40',
  },
  medium: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700',
    text: 'text-yellow-400',
    hover: 'hover:bg-yellow-900/40',
  },
  intense: {
    bg: 'bg-red-900/20',
    border: 'border-red-700',
    text: 'text-red-400',
    hover: 'hover:bg-red-900/40',
  },
};

const Training: React.FC<TrainingProps> = ({
  training,
  player,
  playerStats,
  onTrain,
  onSkip,
}) => {
  const canAfford = (hp: number, chakra: number): boolean => {
    return player.currentHp > hp && player.currentChakra >= chakra;
  };

  const getStatValue = (stat: PrimaryStat): number => {
    const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;
    return player.primaryStats[statKey] || 0;
  };

  return (
    <div className="w-full max-w-6xl z-10">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Dumbbell className="text-orange-500" size={24} />
        <h2 className="text-2xl text-center text-zinc-500 font-serif tracking-[0.5em] uppercase">
          Training Grounds
        </h2>
        <Dumbbell className="text-orange-500" size={24} />
      </div>

      <p className="text-center text-zinc-600 text-sm mb-6">
        Choose a stat to train and select your training intensity
      </p>

      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <Heart className="text-red-500" size={16} />
          <span className="text-red-400 font-mono">
            {player.currentHp} / {playerStats.derived.maxHp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="text-blue-500" size={16} />
          <span className="text-blue-400 font-mono">
            {player.currentChakra} / {playerStats.derived.maxChakra}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {training.options.map((option) => {
          const currentValue = getStatValue(option.stat);

          return (
            <div
              key={option.stat}
              className="bg-black border border-orange-900/30 p-6 flex flex-col gap-4"
            >
              <div className="text-center">
                <h3 className="font-bold text-lg text-orange-400 mb-1">
                  {STAT_DISPLAY_NAMES[option.stat]}
                </h3>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                  Current: {currentValue}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  {STAT_DESCRIPTIONS[option.stat]}
                </p>
              </div>

              <div className="space-y-3 mt-auto">
                {(['light', 'medium', 'intense'] as TrainingIntensity[]).map((intensity) => {
                  const data = option.intensities[intensity];
                  const affordable = canAfford(data.cost.hp, data.cost.chakra);
                  const colors = INTENSITY_COLORS[intensity];

                  return (
                    <button
                      key={intensity}
                      type="button"
                      disabled={!affordable}
                      onClick={() => onTrain(option.stat, intensity)}
                      className={`w-full py-3 px-4 border text-xs font-bold uppercase transition-colors
                        ${affordable
                          ? `${colors.bg} ${colors.border} ${colors.text} ${colors.hover}`
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="capitalize">{intensity}</span>
                        <span className={affordable ? 'text-white' : 'text-zinc-600'}>
                          +{data.gain}
                        </span>
                      </div>
                      <div className="flex justify-center gap-4 mt-1 text-[10px] font-normal">
                        <span className={affordable ? 'text-red-400' : 'text-zinc-600'}>
                          -{data.cost.hp} HP
                        </span>
                        <span className={affordable ? 'text-blue-400' : 'text-zinc-600'}>
                          -{data.cost.chakra} Chakra
                        </span>
                      </div>
                      {!affordable && (
                        <div className="text-[9px] text-zinc-500 mt-1 font-normal normal-case">
                          Not enough resources
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1"
        >
          Skip Training
        </button>
      </div>
    </div>
  );
};

export default Training;
