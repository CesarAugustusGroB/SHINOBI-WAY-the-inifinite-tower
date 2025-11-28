import React, { useState } from 'react';
import { Player, SupplyType } from '../game/types';
import { canUseSupply, getSupplyInfo, getAllSupplyTypes } from '../game/systems/SupplySystem';
import { Package, Droplet } from 'lucide-react';
import Tooltip from './Tooltip';

interface SupplyInventoryProps {
  player: Player;
  onUseSupply: (supplyType: SupplyType) => void;
  disabled?: boolean;
  compact?: boolean;
}

const SupplyInventory: React.FC<SupplyInventoryProps> = ({
  player,
  onUseSupply,
  disabled = false,
  compact = false,
}) => {
  const [hoveredSupply, setHoveredSupply] = useState<SupplyType | null>(null);
  const canUse = canUseSupply(player) && !disabled;

  const getSupplyColor = (supplyType: SupplyType): string => {
    switch (supplyType) {
      case SupplyType.RATIONS:
        return 'border-yellow-700 bg-yellow-950 text-yellow-400';
      case SupplyType.BANDAGES:
        return 'border-red-700 bg-red-950 text-red-400';
      case SupplyType.CHAKRA_PILLS:
        return 'border-blue-700 bg-blue-950 text-blue-400';
      case SupplyType.STAMINA_TONIC:
        return 'border-purple-700 bg-purple-950 text-purple-400';
      default:
        return 'border-zinc-700 bg-zinc-950 text-zinc-400';
    }
  };

  const getSupplyIcon = (supplyType: SupplyType): React.ReactNode => {
    switch (supplyType) {
      case SupplyType.RATIONS:
        return '🍙';
      case SupplyType.BANDAGES:
        return '🩹';
      case SupplyType.CHAKRA_PILLS:
        return '💊';
      case SupplyType.STAMINA_TONIC:
        return '🧪';
      default:
        return '📦';
    }
  };

  if (compact) {
    return (
      <div className='flex items-center gap-2'>
        <Package className='w-4 h-4 text-zinc-400' />
        <span className='text-xs font-mono text-zinc-400'>
          {player.resources.supplies}/{10} supplies
        </span>
      </div>
    );
  }

  return (
    <div className='bg-black border-2 border-zinc-700 p-4 rounded w-full max-w-sm'>
      <h3 className='text-sm font-serif font-bold text-white mb-3 tracking-widest flex items-center gap-2'>
        <Package className='w-4 h-4' />
        SUPPLIES ({player.resources.supplies}/10)
      </h3>

      {player.resources.supplies === 0 ? (
        <p className='text-xs text-zinc-500 italic'>No supplies. Collect items during exploration.</p>
      ) : (
        <div className='grid grid-cols-2 gap-2'>
          {getAllSupplyTypes().map((supplyType) => (
            <Tooltip
              key={supplyType}
              content={getSupplyInfo(supplyType).description}
              side='top'
              disabled={player.resources.supplies === 0}
            >
              <button
                onClick={() => onUseSupply(supplyType)}
                disabled={!canUse}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${getSupplyColor(supplyType)}
                  ${
                    canUse
                      ? 'cursor-pointer hover:shadow-md hover:shadow-current'
                      : 'opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className='text-lg mb-1'>{getSupplyIcon(supplyType)}</div>
                <p className='text-xs font-mono font-bold'>{getSupplyInfo(supplyType).name}</p>
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {disabled && (
        <p className='text-xs text-yellow-400 mt-3 border-t border-yellow-900 pt-2'>
          ⚠️ Supplies unavailable in this context
        </p>
      )}
    </div>
  );
};

export default SupplyInventory;
