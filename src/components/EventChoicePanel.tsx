import React, { useState } from 'react';
import { EnhancedEventChoice, Player, RiskLevel } from '../game/types';
import { checkRequirements, checkResourceCost, getDisabledReason } from '../game/systems/EventSystem';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface EventChoicePanelProps {
  choice: EnhancedEventChoice;
  player: Player;
  playerStats: any;
  onSelect: () => void;
  disabled: boolean;
}

const EventChoicePanel: React.FC<EventChoicePanelProps> = ({
  choice,
  player,
  playerStats,
  onSelect,
  disabled,
}) => {
  const [hovering, setHovering] = useState(false);

  const meetsRequirements = checkRequirements(player, choice.requirements, playerStats);
  const canAffordCost = checkResourceCost(player, choice.costs);
  const isDisabled = disabled || !meetsRequirements || !canAffordCost;
  const disabledReason = !meetsRequirements || !canAffordCost
    ? getDisabledReason(player, choice.requirements, choice.costs, playerStats)
    : '';

  const getRiskColor = (): string => {
    switch (choice.riskLevel) {
      case RiskLevel.SAFE:
        return 'border-green-700 bg-green-950';
      case RiskLevel.LOW:
        return 'border-yellow-700 bg-yellow-950';
      case RiskLevel.MEDIUM:
        return 'border-orange-700 bg-orange-950';
      case RiskLevel.HIGH:
        return 'border-red-700 bg-red-950';
      case RiskLevel.EXTREME:
        return 'border-purple-700 bg-purple-950';
      default:
        return 'border-zinc-700 bg-zinc-950';
    }
  };

  const getRiskBadgeColor = (): string => {
    switch (choice.riskLevel) {
      case RiskLevel.SAFE:
        return 'bg-green-700 text-white';
      case RiskLevel.LOW:
        return 'bg-yellow-700 text-white';
      case RiskLevel.MEDIUM:
        return 'bg-orange-700 text-white';
      case RiskLevel.HIGH:
        return 'bg-red-700 text-white';
      case RiskLevel.EXTREME:
        return 'bg-purple-700 text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  const getCostDisplay = (): string => {
    const costs: string[] = [];
    if (choice.costs?.hunger) costs.push(`${choice.costs.hunger} Hunger`);
    if (choice.costs?.fatigue) costs.push(`${choice.costs.fatigue} Fatigue`);
    if (choice.costs?.morale) costs.push(`${choice.costs.morale} Morale`);
    if (choice.costs?.supplies) costs.push(`${choice.costs.supplies} Supplies`);
    if (choice.costs?.ryo) costs.push(`${choice.costs.ryo} Ryō`);
    return costs.length > 0 ? costs.join(', ') : 'No cost';
  };

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`
        w-full p-4 rounded-lg border-2 transition-all duration-300 text-left
        ${getRiskColor()}
        ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:shadow-lg hover:shadow-current'
        }
      `}
    >
      <div className='flex items-start justify-between gap-3'>
        {/* Content */}
        <div className='flex-grow'>
          {/* Label and Risk Badge */}
          <div className='flex items-center gap-2 mb-2'>
            <h4 className='font-serif font-bold text-white text-lg'>{choice.label}</h4>
            <span className={`text-xs font-mono px-2 py-1 rounded ${getRiskBadgeColor()}`}>
              {choice.riskLevel}
            </span>
          </div>

          {/* Description */}
          <p className='text-sm text-zinc-300 mb-2'>{choice.description}</p>

          {/* Hint Text */}
          {choice.hintText && (
            <p className='text-xs text-zinc-400 italic mb-2'>"{choice.hintText}"</p>
          )}

          {/* Cost Display */}
          {choice.costs && (
            <div className='text-xs font-mono text-zinc-400 mb-2 bg-zinc-900 bg-opacity-50 p-2 rounded'>
              Cost: {getCostDisplay()}
            </div>
          )}

          {/* Requirements Display */}
          {choice.requirements && (
            <div className='text-xs font-mono text-zinc-400 mb-2'>
              {choice.requirements.minMorale && <p>Requires: {choice.requirements.minMorale}+ Morale</p>}
              {choice.requirements.minStat && (
                <p>
                  Requires: {choice.requirements.minStat.value}+ {choice.requirements.minStat.stat}
                </p>
              )}
            </div>
          )}

          {/* Disabled Reason */}
          {isDisabled && disabledReason && (
            <div className='flex items-start gap-2 mt-2 p-2 bg-red-900 bg-opacity-50 rounded'>
              <AlertCircle className='w-4 h-4 text-red-400 flex-shrink-0 mt-0.5' />
              <p className='text-xs text-red-300'>{disabledReason}</p>
            </div>
          )}

          {/* Available indicator */}
          {!isDisabled && meetsRequirements && canAffordCost && (
            <div className='flex items-center gap-2 mt-2 text-green-400'>
              <CheckCircle className='w-4 h-4' />
              <span className='text-xs font-mono'>Available</span>
            </div>
          )}
        </div>

        {/* Right side - outcome summary (shown on hover) */}
        {hovering && !isDisabled && choice.outcomes && (
          <div className='text-right min-w-fit text-xs font-mono text-zinc-400'>
            <p className='mb-1 text-zinc-500 font-bold'>Outcomes:</p>
            <p>{choice.outcomes.length} possible results</p>
            {choice.outcomes[0] && (
              <p className='text-green-400 text-[10px] mt-1'>
                {Math.round(choice.outcomes[0].weight)}% best case
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export default EventChoicePanel;
