import React, { useState, useEffect, useCallback } from 'react';
import {
  TreasureActivity,
  TreasureHunt,
  TreasureType,
  Player,
  Rarity,
} from '../../game/types';
import {
  Lock,
  Eye,
  Swords,
  Dices,
  Sparkles,
  MapPin,
  Coins,
  Map,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { PendingBagFullItem } from '../../hooks/useTreasureHandlers';
import Tooltip from '../../components/shared/Tooltip';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import './treasure.css';

interface TreasureChoiceProps {
  treasure: TreasureActivity;
  treasureHunt: TreasureHunt | null;
  player: Player;
  huntDeclined: boolean;
  onReveal: () => void;
  onSelectItem: (index: number) => void;
  onFightGuardian: () => void;
  onRollDice: () => void;
  onStartHunt: () => void;
  onDeclineHunt: () => void;
  pendingBagFullItem: PendingBagFullItem | null;
  onBagFullSell: () => void;
  onBagFullLeave: () => void;
  getRarityColor: (rarity: Rarity) => string;
}

const TreasureChoice: React.FC<TreasureChoiceProps> = ({
  treasure,
  treasureHunt,
  player,
  huntDeclined,
  onReveal,
  onSelectItem,
  onFightGuardian,
  onRollDice,
  onStartHunt,
  onDeclineHunt,
  pendingBagFullItem,
  onBagFullSell,
  onBagFullLeave,
  getRarityColor,
}) => {
  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);

  const canAffordReveal = player.currentChakra >= treasure.revealCost;

  // If hunt was declined, treat all treasures as locked chests
  const effectiveType = huntDeclined ? TreasureType.LOCKED_CHEST : treasure.type;
  const isLockedChest = effectiveType === TreasureType.LOCKED_CHEST;
  const isTreasureHunter = effectiveType === TreasureType.TREASURE_HUNTER;

  // Show initial prompt when: treasure is hunter type, no hunt active yet, and hunt not declined
  const showHuntPrompt = treasure.type === TreasureType.TREASURE_HUNTER && !treasureHunt && !huntDeclined;

  // Carousel navigation
  const goToPrev = useCallback(() => {
    setCarouselIndex(i => (i > 0 ? i - 1 : treasure.choices.length - 1));
  }, [treasure.choices.length]);

  const goToNext = useCallback(() => {
    setCarouselIndex(i => (i < treasure.choices.length - 1 ? i + 1 : 0));
  }, [treasure.choices.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Bag full panel keys take priority
      if (pendingBagFullItem) {
        if (e.key === 's' || e.key === 'S') {
          onBagFullSell();
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          onBagFullLeave();
          return;
        }
        return; // Block other keys when bag full panel is shown
      }

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
        return;
      }

      // Arrow keys for carousel
      if (e.key === 'ArrowLeft') {
        goToPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        goToNext();
        return;
      }

      // Number keys for quick select (1-4)
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (treasure.isRevealed && idx < treasure.choices.length) {
          onSelectItem(idx);
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
  }, [treasure, canAffordReveal, onReveal, onSelectItem, onFightGuardian, onRollDice, isLockedChest, isTreasureHunter, showHuntPrompt, onStartHunt, onDeclineHunt, goToPrev, goToNext, pendingBagFullItem, onBagFullSell, onBagFullLeave]);

  const handlePickRandom = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * treasure.choices.length);
    onSelectItem(randomIdx);
  }, [treasure.choices.length, onSelectItem]);

  // Render treasure card (carousel item)
  const renderTreasureCard = (index: number) => {
    const choice = treasure.choices[index];
    const isRevealed = treasure.isRevealed;
    const item = choice.item;

    if (!isRevealed) {
      // Hidden card
      return (
        <button
          type="button"
          className="treasure-card treasure-card--hidden"
          onClick={() => onSelectItem(index)}
        >
          <div className="treasure-card__frame" />
          <div className="treasure-card__corner treasure-card__corner--tl" />
          <div className="treasure-card__corner treasure-card__corner--tr" />
          <div className="treasure-card__corner treasure-card__corner--bl" />
          <div className="treasure-card__corner treasure-card__corner--br" />
          <span className="treasure-card__number">{index + 1}</span>
          <div className="treasure-card__mystery">
            <div className="treasure-card__lock-wrapper">
              <Lock className="treasure-card__lock-icon" />
            </div>
            <span className="treasure-card__mystery-symbol">?</span>
            <span className="treasure-card__mystery-label">Unknown</span>
          </div>
        </button>
      );
    }

    // Revealed card
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
          className="treasure-card treasure-card--revealed"
          onClick={() => onSelectItem(index)}
        >
          <div className="treasure-card__frame" />
          <div className="treasure-card__corner treasure-card__corner--tl" />
          <div className="treasure-card__corner treasure-card__corner--tr" />
          <div className="treasure-card__corner treasure-card__corner--bl" />
          <div className="treasure-card__corner treasure-card__corner--br" />
          <span className="treasure-card__number">{index + 1}</span>

          {choice.isArtifact && (
            <div className="treasure-card__artifact-badge">
              <Sparkles className="w-6 h-6" />
            </div>
          )}

          <div className="treasure-card__content">
            <span className="treasure-card__item-icon">{item.icon || '📦'}</span>
            <span className={`treasure-card__item-name ${getRarityColor(item.rarity)}`}>
              {item.name}
            </span>
            <div className="treasure-card__divider" />
            <div className="treasure-card__item-stats">
              {Object.entries(item.stats).slice(0, 2).map(([key, val]) => (
                <div key={key} className="treasure-card__stat">
                  <span className="treasure-card__stat-label">{formatStatName(key).slice(0, 3)}</span>
                  <span className="treasure-card__stat-value">+{val}</span>
                </div>
              ))}
            </div>
            <span className={`treasure-card__rarity ${getRarityColor(item.rarity)}`}>
              {item.rarity}
              {choice.isArtifact && <span className="ml-1 text-purple-400">★</span>}
            </span>
          </div>
        </button>
      </Tooltip>
    );
  };

  // Render map progress
  const renderMapProgress = () => {
    if (!treasureHunt) return null;

    return (
      <div className="map-progress">
        <div className="map-progress__header">
          <span className="map-progress__title">
            <Map className="map-progress__title-icon" />
            Treasure Map
          </span>
          <span className="map-progress__count">
            {treasureHunt.collectedPieces}/{treasureHunt.requiredPieces} pieces
          </span>
        </div>
        <div className="map-progress__pieces">
          {Array.from({ length: treasureHunt.requiredPieces }).map((_, i) => (
            <div
              key={i}
              className={`map-progress__piece ${
                i < treasureHunt.collectedPieces
                  ? 'map-progress__piece--collected'
                  : 'map-progress__piece--empty'
              }`}
            >
              <MapPin className="map-progress__piece-icon" />
            </div>
          ))}
        </div>
        {treasureHunt.collectedPieces === treasureHunt.requiredPieces && (
          <div className="map-progress__complete">
            Map Complete! Claim your reward!
          </div>
        )}
      </div>
    );
  };

  // Hunt initiation prompt
  if (showHuntPrompt) {
    return (
      <div className="treasure-modal">
        <div className="treasure-modal__backdrop" />
        <div className="treasure-modal__container">
          <div className="treasure-modal__body">
            <div className="hunt-prompt">
              <div className="hunt-prompt__icon-wrapper">
                <Map className="hunt-prompt__icon" />
              </div>

              <h2 className="hunt-prompt__title">Treasure Map Found</h2>

              <p className="hunt-prompt__description">
                You've discovered an ancient treasure map! Collecting all pieces
                will reveal the location of a grand treasure.
              </p>

              <div className="hunt-prompt__card">
                <p className="hunt-prompt__card-text">
                  Do you want to begin the treasure hunt?
                </p>
                <p className="hunt-prompt__card-hint">
                  Treasure hunt rooms will appear throughout this location.
                  <br />
                  Collect map pieces through combat or luck to unlock rewards!
                </p>
              </div>

              <div className="hunt-prompt__actions">
                <button
                  type="button"
                  className="treasure-btn treasure-btn--gold"
                  onClick={onStartHunt}
                >
                  <Map className="treasure-btn__icon" />
                  <span className="treasure-btn__label">Begin Hunt</span>
                  <span className="treasure-btn__hint">Seek the grand treasure</span>
                  <span className="treasure-btn__key">[Y]</span>
                </button>

                <button
                  type="button"
                  className="treasure-btn treasure-btn--neutral"
                  onClick={onDeclineHunt}
                >
                  <X className="treasure-btn__icon" />
                  <span className="treasure-btn__label">Skip Hunt</span>
                  <span className="treasure-btn__hint">Take simple loot instead</span>
                  <span className="treasure-btn__key">[N]</span>
                </button>
              </div>

              <p className="hunt-prompt__note">
                Declining will turn all treasure rooms into regular locked chests
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main treasure UI
  return (
    <div className="treasure-modal">
      <div className="treasure-modal__backdrop" />
      <div className="treasure-modal__container">
        <div className="treasure-modal__header">
          <h2 className="treasure-modal__title">
            {isLockedChest ? '💰 Treasure Chest' : '🗺️ Treasure Hunter'}
          </h2>
          <p className="treasure-modal__subtitle">
            {isLockedChest
              ? (treasure.isRevealed ? 'Select your reward' : 'Reveal the contents or pick blindly')
              : 'Collect map pieces to unlock the grand treasure'
            }
          </p>
        </div>

        <div className="treasure-modal__body">
          {/* Treasure Hunter: Map Progress */}
          {isTreasureHunter && renderMapProgress()}

          {/* Locked Chest: Item Carousel */}
          {isLockedChest && (
            <>
              <div className="treasure-carousel">
                {treasure.choices.length > 1 && (
                  <button
                    type="button"
                    className="treasure-carousel__nav treasure-carousel__nav--prev"
                    onClick={goToPrev}
                    aria-label="Previous item"
                  >
                    <ChevronLeft className="treasure-carousel__nav-icon" />
                  </button>
                )}

                <div className="treasure-carousel__viewport">
                  <div className="treasure-carousel__track">
                    {renderTreasureCard(carouselIndex)}
                  </div>
                </div>

                {treasure.choices.length > 1 && (
                  <button
                    type="button"
                    className="treasure-carousel__nav treasure-carousel__nav--next"
                    onClick={goToNext}
                    aria-label="Next item"
                  >
                    <ChevronRight className="treasure-carousel__nav-icon" />
                  </button>
                )}

                {treasure.choices.length > 1 && (
                  <div className="treasure-carousel__dots">
                    {treasure.choices.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`treasure-carousel__dot ${
                          i === carouselIndex ? 'treasure-carousel__dot--active' : ''
                        }`}
                        onClick={() => setCarouselIndex(i)}
                        aria-label={`Go to item ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                <div className="treasure-carousel__counter">
                  Item {carouselIndex + 1} of {treasure.choices.length}
                </div>
              </div>

              {/* Action Buttons for Locked Chest */}
              {!treasure.isRevealed && (
                <div className="chest-actions">
                  <button
                    type="button"
                    className="treasure-btn treasure-btn--neutral"
                    onClick={handlePickRandom}
                  >
                    <Lock className="treasure-btn__icon" />
                    <span className="treasure-btn__label">Pick Random</span>
                    <span className="treasure-btn__hint">Free • Trust your luck</span>
                    <span className="treasure-btn__key">[SPACE]</span>
                  </button>

                  <button
                    type="button"
                    className="treasure-btn treasure-btn--gold"
                    onClick={onReveal}
                    disabled={!canAffordReveal}
                  >
                    <Eye className="treasure-btn__icon" />
                    <span className="treasure-btn__label">Reveal All</span>
                    <span className="treasure-btn__hint">{treasure.revealCost} Chakra</span>
                    <span className="treasure-btn__key">[R]</span>
                  </button>
                </div>
              )}

              {/* Chakra Display */}
              {!treasure.isRevealed && (
                <div className="chest-actions__chakra-display">
                  Your Chakra:{' '}
                  <span className={`chest-actions__chakra-value${!canAffordReveal ? '--low' : ''}`}>
                    {player.currentChakra}
                  </span>
                  {!canAffordReveal && (
                    <span className="chest-actions__chakra-needed">
                      (Need {treasure.revealCost - player.currentChakra} more)
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Treasure Hunter: Guardian vs Dice Choice */}
          {isTreasureHunter && treasure.mapPieceAvailable && (
            <div className="guardian-choice">
              <div className="guardian-choice__header">
                <h3 className="guardian-choice__title">Choose Your Path</h3>
              </div>

              <div className="guardian-choice__split">
                {/* Fight Guardian Option */}
                <button
                  type="button"
                  className="guardian-choice__option guardian-choice__option--fight"
                  onClick={onFightGuardian}
                >
                  <div className="guardian-choice__icon-wrapper">
                    <Swords className="guardian-choice__icon" />
                  </div>
                  <span className="guardian-choice__option-title">Fight Guardian</span>
                  <div className="guardian-choice__odds">
                    <span className="guardian-choice__odds-item guardian-choice__odds-item--success">
                      ✓ Guaranteed map piece
                    </span>
                  </div>
                  <span className="guardian-choice__key-hint">[F] key</span>
                </button>

                {/* Roll Dice Option */}
                <button
                  type="button"
                  className="guardian-choice__option guardian-choice__option--dice"
                  onClick={onRollDice}
                >
                  <div className="guardian-choice__icon-wrapper">
                    <Dices className="guardian-choice__icon" />
                  </div>
                  <span className="guardian-choice__option-title">Roll the Dice</span>
                  <div className="guardian-choice__odds">
                    <span className="guardian-choice__odds-item guardian-choice__odds-item--success">
                      30% map piece
                    </span>
                    <span className="guardian-choice__odds-item guardian-choice__odds-item--neutral">
                      40% nothing
                    </span>
                    <span className="guardian-choice__odds-item guardian-choice__odds-item--danger">
                      30% trap damage
                    </span>
                  </div>
                  <span className="guardian-choice__key-hint">[D] key</span>
                </button>
              </div>
            </div>
          )}

          {/* No map piece available */}
          {isTreasureHunter && !treasure.mapPieceAvailable && (
            <div className="text-center text-zinc-500 text-sm py-8">
              No map piece available in this room.
            </div>
          )}

          {/* Ryo bonus display */}
          {isTreasureHunter && treasure.ryoBonus > 0 && (
            <div className="text-center">
              <div className="ryo-bonus">
                <Coins className="ryo-bonus__icon" />
                <span className="ryo-bonus__value">+{treasure.ryoBonus} Ryō bonus</span>
              </div>
            </div>
          )}

          {/* Keyboard hints */}
          {isLockedChest && treasure.isRevealed && !pendingBagFullItem && (
            <div className="keyboard-hints">
              [1-{treasure.choices.length}] Select item • [←→] Navigate
            </div>
          )}

          {/* Bag Full Options */}
          {pendingBagFullItem && (
            <div className="bag-full-panel">
              <div className="bag-full-panel__header">
                <AlertTriangle className="bag-full-panel__warning-icon" />
                <h3 className="bag-full-panel__title">Bag is Full!</h3>
              </div>

              <div className="bag-full-panel__item">
                <span className="bag-full-panel__item-icon">{pendingBagFullItem.item.icon || '📦'}</span>
                <span className={`bag-full-panel__item-name ${getRarityColor(pendingBagFullItem.item.rarity)}`}>
                  {pendingBagFullItem.item.name}
                </span>
              </div>

              <p className="bag-full-panel__description">
                Choose what to do with this item:
              </p>

              <div className="bag-full-panel__actions">
                <button
                  type="button"
                  className="treasure-btn treasure-btn--gold"
                  onClick={onBagFullSell}
                >
                  <Coins className="treasure-btn__icon" />
                  <span className="treasure-btn__label">Sell</span>
                  <span className="treasure-btn__hint">+{Math.floor(pendingBagFullItem.item.value * 0.6)} Ryo</span>
                  <span className="treasure-btn__key">[S]</span>
                </button>

                <button
                  type="button"
                  className="treasure-btn treasure-btn--neutral"
                  onClick={onBagFullLeave}
                >
                  <Package className="treasure-btn__icon" />
                  <span className="treasure-btn__label">Leave</span>
                  <span className="treasure-btn__hint">Abandon item</span>
                  <span className="treasure-btn__key">[L]</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreasureChoice;
