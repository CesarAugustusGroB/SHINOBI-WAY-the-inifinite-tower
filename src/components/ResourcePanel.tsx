import React from 'react';
import { PlayerResources, ResourceStatus } from '../game/types';
import { getResourceStatus, getResourceEffectsDescription } from '../game/systems/ResourceSystem';
import Tooltip from './Tooltip';

interface ResourcePanelProps {
  resources: PlayerResources;
  hoveredResource?: string;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources, hoveredResource }) => {
  const status = getResourceStatus(resources);
  const effects = getResourceEffectsDescription(resources);

  const getResourceColor = (value: number, max: number, inverted: boolean = false): string => {
    const percent = value / max;

    if (!inverted) {
      if (percent >= 0.75) return 'bg-green-600';
      if (percent >= 0.5) return 'bg-yellow-600';
      if (percent >= 0.25) return 'bg-orange-600';
      return 'bg-red-600';
    } else {
      // Inverted for fatigue (high is bad)
      if (percent <= 0.25) return 'bg-green-600';
      if (percent <= 0.5) return 'bg-yellow-600';
      if (percent <= 0.75) return 'bg-orange-600';
      return 'bg-red-600';
    }
  };

  const getStatusBorderColor = (): string => {
    switch (status) {
      case ResourceStatus.CRITICAL:
        return 'border-red-600';
      case ResourceStatus.WARNING:
        return 'border-yellow-600';
      default:
        return 'border-green-600';
    }
  };

  return (
    <div className={`bg-black border-2 ${getStatusBorderColor()} p-4 rounded w-full max-w-sm`}>
      <h3 className='text-sm font-serif font-bold text-white mb-3 tracking-widest'>RESOURCES</h3>

      {/* Hunger Bar */}
      <div className='mb-3'>
        <div className='flex justify-between mb-1'>
          <span className='text-xs font-mono text-zinc-300'>HUNGER</span>
          <span className='text-xs font-mono text-zinc-400'>{Math.floor(resources.hunger)}/100</span>
        </div>
        <div className='w-full h-3 bg-zinc-900 border border-zinc-700 rounded overflow-hidden'>
          <div
            className={`h-full ${getResourceColor(resources.hunger, 100)} transition-all duration-300`}
            style={{ width: `${resources.hunger}%` }}
          />
        </div>
        {hoveredResource === 'hunger' && (
          <p className='text-[10px] text-zinc-400 mt-1'>
            {resources.hunger < 20 && 'Starving: -15% Max HP, -10% Damage'}
            {resources.hunger >= 20 && resources.hunger < 80 && 'Moderate - effects when critical'}
            {resources.hunger >= 80 && '+5% HP Regen'}
          </p>
        )}
      </div>

      {/* Fatigue Bar */}
      <div className='mb-3'>
        <div className='flex justify-between mb-1'>
          <span className='text-xs font-mono text-zinc-300'>FATIGUE</span>
          <span className='text-xs font-mono text-zinc-400'>{Math.floor(resources.fatigue)}/100</span>
        </div>
        <div className='w-full h-3 bg-zinc-900 border border-zinc-700 rounded overflow-hidden'>
          <div
            className={`h-full ${getResourceColor(resources.fatigue, 100, true)} transition-all duration-300`}
            style={{ width: `${resources.fatigue}%` }}
          />
        </div>
        {hoveredResource === 'fatigue' && (
          <p className='text-[10px] text-zinc-400 mt-1'>
            {resources.fatigue > 80 && 'Exhausted: -20% Speed, +15% Chakra Costs'}
            {resources.fatigue <= 80 && resources.fatigue >= 15 && 'Balanced'}
            {resources.fatigue < 15 && '+10% Speed, -10% Chakra Costs'}
          </p>
        )}
      </div>

      {/* Morale Bar */}
      <div className='mb-3'>
        <div className='flex justify-between mb-1'>
          <span className='text-xs font-mono text-zinc-300'>MORALE</span>
          <span className='text-xs font-mono text-zinc-400'>{Math.floor(resources.morale)}/100</span>
        </div>
        <div className='w-full h-3 bg-zinc-900 border border-zinc-700 rounded overflow-hidden'>
          <div
            className={`h-full ${getResourceColor(resources.morale, 100)} transition-all duration-300`}
            style={{ width: `${resources.morale}%` }}
          />
        </div>
        {hoveredResource === 'morale' && (
          <p className='text-[10px] text-zinc-400 mt-1'>
            {resources.morale < 20 && 'Broken: -20% Damage, -20% Defense'}
            {resources.morale >= 20 && resources.morale < 85 && 'Steady'}
            {resources.morale >= 85 && 'Heroic: +15% Damage, +10% XP'}
          </p>
        )}
      </div>

      {/* Supplies Counter */}
      <div className='border-t border-zinc-700 pt-2 mt-2'>
        <div className='flex justify-between items-center'>
          <span className='text-xs font-mono text-zinc-300'>SUPPLIES</span>
          <div className='flex gap-1'>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 border border-zinc-600 ${
                  i < resources.supplies ? 'bg-green-700' : 'bg-zinc-900'
                }`}
              />
            ))}
          </div>
        </div>
        <p className='text-[10px] text-zinc-400 mt-1'>{resources.supplies}/10 items</p>
      </div>

      {/* Active Effects */}
      {effects.length > 0 && (
        <div className='border-t border-zinc-700 pt-2 mt-3'>
          <p className='text-xs font-mono text-yellow-400 mb-1'>ACTIVE EFFECTS:</p>
          {effects.map((effect, i) => (
            <p key={i} className='text-[9px] text-yellow-300 leading-tight'>
              • {effect}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcePanel;
