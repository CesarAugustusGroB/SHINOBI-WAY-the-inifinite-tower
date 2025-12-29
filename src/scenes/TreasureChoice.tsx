import React, { useState, useEffect, useCallback } from 'react';
import {
  TreasureActivity,
  TreasureHunt,
  TreasureType,
  Player,
  CharacterStats,
  Rarity,
  Item,
} from '../game/types';
import { Lock, Eye, Swords, Dices, Sparkles, MapPin, Coins, Map, X } from 'lucide-react';
import Tooltip from '../components/shared/Tooltip';
import { formatStatName } from '../game/utils/tooltipFormatters';

interface TreasureChoiceProps {
  treasure: TreasureActivity;
  treasureHunt: TreasureHunt | null;
  player: Player;
  playerStats: CharacterStats;
  huntDeclined: boolean;
  onReveal: () => void;
  onSelectItem: (index: number) => void;
  onSelectRyo: () => void;
  onFightGuardian: () => void;
  onRollDice: () => void;
  onStartHunt: () => void;
  onDeclineHunt: () => void;
  getRarityColor: (rarity: Rarity) => string;
}

const TreasureChoice: React.FC<TreasureChoiceProps> = ({
  treasure,
  treasureHunt,
  player,
  playerStats,
  huntDeclined,
  onReveal,
  onSelectItem,
  onSelectRyo,
  onFightGuardian,
  onRollDice,
  onStartHunt,
  onDeclineHunt,
  getRarityColor,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<number | null>(null);

  const canAffordReveal = player.currentChakra >= treasure.revealCost;

  // If hunt was declined, treat all treasures as locked chests
  const effectiveType = huntDeclined ? TreasureType.LOCKED_CHEST : treasure.type;
  const isLockedChest = effectiveType === TreasureType.LOCKED_CHEST;
  const isTreasureHunter = effectiveType === TreasureType.TREASURE_HUNTER;

  // Show initial prompt when: treasure is hunter type, no hunt active yet, and hunt not declined
  const showHuntPrompt = treasure.type === TreasureType.TREASURE_HUNTER && !treasureHunt && !huntDeclined;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Y/N keys for hunt prompt
      if (showHuntPrompt) {
        if (e.key === 'y' || e.key === 'Y') {
          onStartHunt();
          return;
        }
        if (e.key === 'n' || e.key === 'N') {
          onDeclineHunt();
          return;
        }
        return; // Block other keys when prompt is showing
      }

      // Number keys for quick select (1-4)
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (treasure.isRevealed && idx < treasure.choices.length) {
          onSelectItem(idx);
        } else if (idx === treasure.choices.length) {
          // Last number = ryo option
          onSelectRyo();
        }
      }

      // R for reveal
      if (e.key === 'r' || e.key === 'R') {
        if (!treasure.isRevealed && canAffordReveal) {
          onReveal();
        }
      }

      // Space to pick random (when not revealed)
      if (e.code === 'Space' && !treasure.isRevealed && isLockedChest) {
        e.preventDefault();
        const randomIdx = Math.floor(Math.random() * treasure.choices.length);
        onSelectItem(randomIdx);
      }

      // F for Fight Guardian (treasure hunter)
      if ((e.key === 'f' || e.key === 'F') && isTreasureHunter && treasure.mapPieceAvailable) {
        onFightGuardian();
      }

      // D for Dice Roll (treasure hunter)
      if ((e.key === 'd' || e.key === 'D') && isTreasureHunter && treasure.mapPieceAvailable) {
        onRollDice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [treasure, canAffordReveal, onReveal, onSelectItem, onSelectRyo, onFightGuardian, onRollDice, isLockedChest, isTreasureHunter, showHuntPrompt, onStartHunt, onDeclineHunt]);

  const handlePickRandom = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * treasure.choices.length);
    onSelectItem(randomIdx);
  }, [treasure.choices.length, onSelectItem]);

  // Unified card base styles - fixed dimensions for consistent sizing
  const cardBaseClass = `
    relative rounded-xl overflow-hidden
    transition-all duration-300 ease-out cursor-pointer
    border border-amber-800/40
    bg-gradient-to-b from-zinc-900/95 via-zinc-900 to-zinc-950
    w-[11rem] min-w-[11rem] max-w-[11rem]
    h-[14rem] min-h-[14rem] max-h-[14rem]
    flex-shrink-0
  `;

  const cardHoverClass = 'scale-[1.03] border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.15)]';
  const cardNumberClass = `
    absolute top-3 left-3 w-7 h-7 rounded-lg
    bg-gradient-to-br from-amber-600/30 to-amber-900/50
    border border-amber-600/40
    flex items-center justify-center
    text-amber-400 text-xs font-bold
  `;

  // Render item card (hidden or revealed)
  const renderItemCard = (index: number) => {
    const choice = treasure.choices[index];
    const isRevealed = treasure.isRevealed;
    const isSelected = selectedIndex === index;
    const isHovered = isHovering === index;

    if (!isRevealed) {
      // Hidden card
      return (
        <div
          key={index}
          className={`${cardBaseClass} ${isHovered ? cardHoverClass : ''}`}
          onMouseEnter={() => setIsHovering(index)}
          onMouseLeave={() => setIsHovering(null)}
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600/30 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600/30 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600/30 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600/30 rounded-br-xl" />

          {/* Mystery pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(245,158,11,0.3)_8px,rgba(245,158,11,0.3)_16px)]" />
          </div>

          {/* Card number */}
          <div className={cardNumberClass}>{index + 1}</div>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-900/30 to-amber-950/50 border border-amber-700/30">
              <Lock className="w-8 h-8 text-amber-500/70" />
            </div>
            <span className="text-amber-500/60 text-4xl font-serif">?</span>
            <span className="text-zinc-500 text-[10px] uppercase tracking-[0.2em]">Unknown</span>
          </div>

          {/* Bottom glow on hover */}
          {isHovered && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          )}
        </div>
      );
    }

    // Revealed card
    const item = choice.item;
    return (
      <Tooltip
        key={index}
        content={
          <div className="space-y-2 p-1 max-w-[260px]">
            <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
            </div>
            {item.description && (
              <div className="text-xs text-zinc-400 italic">{item.description}</div>
            )}
            <div className="border-t border-zinc-700 pt-2 space-y-1">
              {Object.entries(item.stats).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">{formatStatName(key)}</span>
                  <span className="text-zinc-200">+{val}</span>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <button
          type="button"
          onClick={() => onSelectItem(index)}
          onMouseEnter={() => setIsHovering(index)}
          onMouseLeave={() => setIsHovering(null)}
          className={`
            ${cardBaseClass}
            ${isSelected ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.03]' : ''}
            ${isHovered && !isSelected ? cardHoverClass : ''}
            ${choice.isArtifact ? 'ring-1 ring-purple-500/20' : ''}
          `}
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600/30 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600/30 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600/30 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600/30 rounded-br-xl" />

          {/* Artifact sparkle effect */}
          {choice.isArtifact && (
            <div className="absolute -top-1 -right-1 z-10">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          )}

          {/* Card number */}
          <div className={cardNumberClass}>{index + 1}</div>

          {/* Card content */}
          <div className="absolute inset-0 flex flex-col items-center pt-12 pb-4 px-3">
            {/* Item icon */}
            <div className="text-4xl mb-3">{item.icon || '📦'}</div>

            {/* Item name */}
            <div className={`text-center text-sm font-semibold ${getRarityColor(item.rarity)} leading-tight mb-2 px-1`}>
              {item.name}
            </div>

            {/* Divider */}
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent mb-2" />

            {/* Key stat preview */}
            <div className="text-[11px] text-zinc-400 space-y-1 w-full px-2">
              {Object.entries(item.stats).slice(0, 2).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-zinc-500">{formatStatName(key).slice(0, 3)}</span>
                  <span className="text-amber-300/80 font-medium">+{val}</span>
                </div>
              ))}
            </div>

            {/* Rarity badge */}
            <div className="mt-auto pt-2">
              <span className={`text-[10px] uppercase tracking-wider font-medium ${getRarityColor(item.rarity)}`}>
                {item.rarity}
                {choice.isArtifact && <span className="ml-1 text-purple-400">★</span>}
              </span>
            </div>
          </div>

          {/* Bottom glow on hover */}
          {isHovered && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          )}
        </button>
      </Tooltip>
    );
  };

  // Render ryo option card - unified with item cards
  const renderRyoCard = () => {
    const isHovered = isHovering === 99;

    return (
      <button
        type="button"
        onClick={onSelectRyo}
        onMouseEnter={() => setIsHovering(99)}
        onMouseLeave={() => setIsHovering(null)}
        className={`${cardBaseClass} ${isHovered ? cardHoverClass : ''}`}
      >
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600/30 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600/30 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600/30 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600/30 rounded-br-xl" />

        {/* Card number */}
        <div className={cardNumberClass}>{treasure.choices.length + 1}</div>

        {/* Card content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {/* Coin icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-yellow-500/20 rounded-full scale-150" />
            <Coins className="relative w-12 h-12 text-yellow-500" />
          </div>

          {/* Amount */}
          <div className="text-yellow-400 text-3xl font-bold tracking-tight">
            {treasure.ryoBonus}
          </div>

          {/* Label */}
          <div className="text-yellow-600/80 text-xs uppercase tracking-[0.15em] font-medium">
            Ryō
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent my-1" />

          {/* Subtitle */}
          <div className="text-zinc-500 text-[10px]">
            Take gold instead
          </div>
        </div>

        {/* Bottom glow on hover */}
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        )}
      </button>
    );
  };

  // Render map progress for treasure hunter
  const renderMapProgress = () => {
    if (!treasureHunt) return null;

    const pieces = [];
    for (let i = 0; i < treasureHunt.requiredPieces; i++) {
      pieces.push(
        <div
          key={i}
          className={`
            w-8 h-8 rounded border-2 flex items-center justify-center
            transition-all duration-300
            ${i < treasureHunt.collectedPieces
              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
              : 'bg-zinc-900 border-zinc-700 text-zinc-600'
            }
          `}
        >
          <MapPin className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className="bg-zinc-900/80 border border-amber-900/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-amber-400 text-sm uppercase tracking-wider font-bold">
            🗺️ Treasure Map
          </span>
          <span className="text-zinc-400 text-xs">
            {treasureHunt.collectedPieces}/{treasureHunt.requiredPieces} pieces
          </span>
        </div>
        <div className="flex gap-2 justify-center">
          {pieces}
        </div>
        {treasureHunt.collectedPieces === treasureHunt.requiredPieces && (
          <div className="mt-3 text-center text-amber-300 text-sm animate-pulse">
            Map Complete! Claim your reward!
          </div>
        )}
      </div>
    );
  };

  // Render treasure hunter action buttons
  const renderTreasureHunterActions = () => {
    if (!treasure.mapPieceAvailable) {
      return (
        <div className="text-center text-zinc-500 text-sm">
          No map piece available in this room.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 items-center">
        <div className="text-zinc-400 text-sm text-center mb-2">
          Choose how to obtain the map piece:
        </div>

        <div className="flex gap-4">
          {/* Fight Guardian */}
          <button
            type="button"
            onClick={onFightGuardian}
            className="
              group relative px-6 py-4 bg-gradient-to-b from-red-900/40 to-red-950/60
              border-2 border-red-800/50 rounded-lg
              hover:border-red-600 hover:shadow-lg hover:shadow-red-900/30
              transition-all duration-300
              flex flex-col items-center gap-2 w-44
            "
          >
            <Swords className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-red-300 font-bold uppercase text-sm">Fight Guardian</span>
            <span className="text-red-400/70 text-[10px]">Guaranteed piece</span>
            <span className="text-zinc-600 text-[10px]">[F] key</span>
          </button>

          {/* Roll Dice */}
          <button
            type="button"
            onClick={onRollDice}
            className="
              group relative px-6 py-4 bg-gradient-to-b from-purple-900/40 to-purple-950/60
              border-2 border-purple-800/50 rounded-lg
              hover:border-purple-600 hover:shadow-lg hover:shadow-purple-900/30
              transition-all duration-300
              flex flex-col items-center gap-2 w-44
            "
          >
            <Dices className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-purple-300 font-bold uppercase text-sm">Roll the Dice</span>
            <div className="text-[9px] space-y-0.5 text-center">
              <div className="text-green-400/70">30% piece</div>
              <div className="text-zinc-500">40% nothing</div>
              <div className="text-red-400/70">30% trap</div>
            </div>
            <span className="text-zinc-600 text-[10px]">[D] key</span>
          </button>
        </div>
      </div>
    );
  };

  // Hunt initiation prompt
  if (showHuntPrompt) {
    return (
      <div className="w-full max-w-4xl mx-auto z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-900/20 border-2 border-amber-600/50">
            <Map className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl text-amber-400 font-serif tracking-[0.3em] uppercase mb-2">
            🗺️ Ancient Map Fragment
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            You've discovered an ancient treasure map! Collecting all pieces will reveal a grand treasure.
          </p>
        </div>

        {/* Prompt card */}
        <div className="bg-zinc-900/80 border border-amber-900/40 rounded-lg p-8 max-w-lg mx-auto">
          <div className="text-center mb-6">
            <p className="text-amber-200 text-lg mb-2">Do you want to begin the treasure hunt?</p>
            <p className="text-zinc-500 text-xs">
              Treasure hunt rooms will appear throughout this location.
              <br />
              Collect map pieces through combat or luck to unlock rewards!
            </p>
          </div>

          {/* Choice buttons */}
          <div className="flex gap-4 justify-center">
            {/* Accept hunt */}
            <button
              type="button"
              onClick={onStartHunt}
              className="
                group px-8 py-4 bg-gradient-to-b from-amber-900/50 to-amber-950/70
                border-2 border-amber-700/60 rounded-lg
                hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/40
                transition-all duration-300
                flex flex-col items-center gap-2
              "
            >
              <Map className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-amber-200 font-bold uppercase">Yes, Start Hunt</span>
              <span className="text-amber-500/60 text-[10px]">Seek the grand treasure</span>
              <span className="text-zinc-600 text-[10px]">[Y]</span>
            </button>

            {/* Decline hunt */}
            <button
              type="button"
              onClick={onDeclineHunt}
              className="
                group px-8 py-4 bg-gradient-to-b from-zinc-800/50 to-zinc-900/70
                border-2 border-zinc-700/60 rounded-lg
                hover:border-zinc-500 hover:shadow-lg hover:shadow-zinc-900/40
                transition-all duration-300
                flex flex-col items-center gap-2
              "
            >
              <X className="w-8 h-8 text-zinc-400 group-hover:scale-110 transition-transform" />
              <span className="text-zinc-300 font-bold uppercase">No, Regular Loot</span>
              <span className="text-zinc-500 text-[10px]">Take simple treasure instead</span>
              <span className="text-zinc-600 text-[10px]">[N]</span>
            </button>
          </div>

          {/* Info note */}
          <div className="mt-6 text-center text-zinc-600 text-[10px]">
            Declining will turn all treasure rooms into regular locked chests
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto z-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl text-amber-400 font-serif tracking-[0.3em] uppercase mb-2">
          {isLockedChest ? '💰 Treasure Found' : '🗺️ Treasure Hunter'}
        </h2>
        <p className="text-zinc-500 text-sm">
          {isLockedChest
            ? (treasure.isRevealed ? 'Select your reward' : 'Reveal the contents or pick blindly')
            : 'Collect map pieces to unlock the grand treasure'
          }
        </p>
      </div>

      {/* Treasure Hunter: Map Progress */}
      {isTreasureHunter && renderMapProgress()}

      {/* Locked Chest: Item Cards */}
      {isLockedChest && (
        <>
          <div className="flex flex-row justify-center items-stretch gap-5 mb-10">
            {treasure.choices.map((_, index) => renderItemCard(index))}
            {treasure.isRevealed && renderRyoCard()}
          </div>

          {/* Action Buttons for Locked Chest */}
          {!treasure.isRevealed && (
            <div className="flex justify-center gap-4 mb-6">
              {/* Pick Randomly */}
              <button
                type="button"
                onClick={handlePickRandom}
                className="
                  group px-6 py-3 bg-gradient-to-b from-zinc-800 to-zinc-900
                  border-2 border-zinc-700 rounded-lg
                  hover:border-zinc-500 hover:shadow-lg hover:shadow-zinc-900/50
                  transition-all duration-300
                  flex items-center gap-3
                "
              >
                <Lock className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                <div className="text-left">
                  <div className="text-zinc-200 font-bold text-sm uppercase">Pick Randomly</div>
                  <div className="text-zinc-500 text-[10px]">Free • Trust your luck</div>
                </div>
                <span className="text-zinc-600 text-[10px] ml-2">[SPACE]</span>
              </button>

              {/* Reveal All */}
              <button
                type="button"
                onClick={onReveal}
                disabled={!canAffordReveal}
                className={`
                  group px-6 py-3 bg-gradient-to-b rounded-lg
                  border-2 transition-all duration-300
                  flex items-center gap-3
                  ${canAffordReveal
                    ? 'from-amber-900/40 to-amber-950/60 border-amber-800/50 hover:border-amber-600 hover:shadow-lg hover:shadow-amber-900/30'
                    : 'from-zinc-900 to-zinc-950 border-zinc-800 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <Eye className={`w-5 h-5 ${canAffordReveal ? 'text-amber-400' : 'text-zinc-600'} group-hover:text-amber-300 transition-colors`} />
                <div className="text-left">
                  <div className={`font-bold text-sm uppercase ${canAffordReveal ? 'text-amber-200' : 'text-zinc-600'}`}>
                    Reveal All
                  </div>
                  <div className={`text-[10px] ${canAffordReveal ? 'text-amber-500/70' : 'text-zinc-700'}`}>
                    {treasure.revealCost} Chakra • See all options
                  </div>
                </div>
                <span className="text-zinc-600 text-[10px] ml-2">[R]</span>
              </button>
            </div>
          )}

          {/* Player Chakra Display */}
          {!treasure.isRevealed && (
            <div className="text-center text-zinc-500 text-xs">
              Your Chakra: <span className={canAffordReveal ? 'text-blue-400' : 'text-red-400'}>{player.currentChakra}</span>
              {!canAffordReveal && <span className="text-red-400/70 ml-2">(Need {treasure.revealCost - player.currentChakra} more)</span>}
            </div>
          )}
        </>
      )}

      {/* Treasure Hunter: Action Buttons */}
      {isTreasureHunter && renderTreasureHunterActions()}

      {/* Ryo bonus display for treasure hunter */}
      {isTreasureHunter && treasure.ryoBonus > 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/20 border border-yellow-900/30 rounded-lg">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-400 text-sm">+{treasure.ryoBonus} Ryō bonus</span>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="mt-8 text-center text-zinc-700 text-[10px] uppercase tracking-wider">
        {isLockedChest && treasure.isRevealed && (
          <span>[1-{treasure.choices.length}] Select item • [{treasure.choices.length + 1}] Take Ryō</span>
        )}
      </div>
    </div>
  );
};

export default TreasureChoice;
