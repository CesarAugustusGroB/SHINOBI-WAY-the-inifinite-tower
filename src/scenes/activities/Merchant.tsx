import React, { useState, useCallback, useMemo } from 'react';
import {
  Item,
  Player,
  Rarity,
  EquipmentSlot,
  SLOT_MAPPING,
  TreasureQuality,
  MAX_MERCHANT_SLOTS,
} from '../../game/types';
import {
  Coins,
  RefreshCw,
  ShoppingBag,
  Gem,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Store,
} from 'lucide-react';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import { MERCHANT } from '../../game/config';
import { calculateMerchantRerollCost } from '../../game/systems/ScalingSystem';
import './Merchant.css';

interface MerchantProps {
  merchantItems: Item[];
  discountPercent: number;
  player: Player | null;
  dangerLevel: number;
  baseDifficulty: number;
  onBuyItem: (item: Item) => void;
  onLeave: () => void;
  onReroll: () => void;
  onBuySlot: () => void;
  onUpgradeQuality: () => void;
  isProcessing?: boolean;
}

/* ===========================================
   Helper Functions
   =========================================== */

const getRarityClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:
      return 'broken';
    case Rarity.COMMON:
      return 'common';
    case Rarity.RARE:
      return 'rare';
    case Rarity.EPIC:
      return 'epic';
    case Rarity.LEGENDARY:
      return 'legendary';
    case Rarity.CURSED:
      return 'cursed';
    default:
      return 'common';
  }
};

const getRarityLabel = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY:
      return '\u2550\u2550 LEGENDARY \u2550\u2550';
    case Rarity.EPIC:
      return '\u2500\u2500 EPIC \u2500\u2500';
    case Rarity.RARE:
      return '\u2500\u2500 RARE \u2500\u2500';
    case Rarity.CURSED:
      return '\u2620 CURSED \u2620';
    case Rarity.BROKEN:
      return '\u00b7\u00b7 BROKEN \u00b7\u00b7';
    default:
      return '\u00b7\u00b7 COMMON \u00b7\u00b7';
  }
};

/* ===========================================
   Ryo Display Component
   =========================================== */

interface RyoDisplayProps {
  current: number;
  previewCost: number | null;
}

const RyoDisplay: React.FC<RyoDisplayProps> = ({ current, previewCost }) => {
  const afterPurchase = previewCost !== null ? current - previewCost : null;

  return (
    <div className="ryo-display">
      <Coins className="ryo-display__icon" size={18} />
      <span className="ryo-display__amount">{current} Ryo</span>
      {afterPurchase !== null && (
        <div className="ryo-display__preview">
          <span className="ryo-display__arrow">→</span>
          <span className="ryo-display__after">{afterPurchase}</span>
          <span className="ryo-display__cost">(-{previewCost})</span>
        </div>
      )}
    </div>
  );
};

/* ===========================================
   Merchant Status Component
   =========================================== */

interface MerchantStatusProps {
  quality: TreasureQuality;
  slots: number;
  maxSlots: number;
}

const MerchantStatus: React.FC<MerchantStatusProps> = ({
  quality,
  slots,
  maxSlots,
}) => {
  return (
    <div className="merchant-status">
      <span>
        Quality: <span className="merchant-status__value">{quality}</span>
      </span>
      <span>
        Slots:{' '}
        <span className="merchant-status__value">
          {slots}/{maxSlots}
        </span>
      </span>
    </div>
  );
};

/* ===========================================
   Service Button Component
   =========================================== */

interface ServiceButtonProps {
  variant: 'reroll' | 'slot' | 'quality';
  cost: number;
  onClick: () => void;
  disabled: boolean;
  label: string;
}

const ServiceButton: React.FC<ServiceButtonProps> = ({
  variant,
  cost,
  onClick,
  disabled,
  label,
}) => {
  const icons = {
    reroll: <RefreshCw size={14} />,
    slot: <ShoppingBag size={14} />,
    quality: <Gem size={14} />,
  };

  return (
    <button
      type="button"
      className={`service-button service-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="service-button__icon">{icons[variant]}</span>
      <span>{label}</span>
      <span className="service-button__cost">({cost} Ryo)</span>
    </button>
  );
};

/* ===========================================
   Item Card Component
   =========================================== */

interface StatComparison {
  value: number;
  delta: number;
  isNew: boolean;
}

interface ItemCardProps {
  item: Item;
  price: number;
  affordable: boolean;
  statComparisons: Record<string, StatComparison>;
  isSelected: boolean;
  isDimmed: boolean;
  discountPercent: number;
  onSelect: () => void;
  onBuy: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  price,
  affordable,
  statComparisons,
  isSelected,
  isDimmed,
  discountPercent,
  onSelect,
  onBuy,
}) => {
  const rarityClass = getRarityClass(item.rarity);
  const rarityLabel = getRarityLabel(item.rarity);

  const handleClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  const handleBuy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (affordable) {
      onBuy();
    }
  }, [affordable, onBuy]);

  return (
    <div
      className={`item-card item-card--${rarityClass} ${
        isSelected ? 'item-card--selected' : ''
      } ${isDimmed ? 'item-card--dimmed' : ''} ${
        !affordable ? 'item-card--unaffordable' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={isDimmed ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header */}
      <div className="item-card__header">
        <span className={`item-card__rarity-tag item-card__rarity-tag--${rarityClass}`}>
          {rarityLabel}
        </span>
        <span className="item-card__afford-indicator">
          {affordable ? (
            <CheckCircle size={14} className="text-green-500" />
          ) : (
            <AlertTriangle size={14} className="text-red-500" />
          )}
        </span>
      </div>

      {/* Item Info */}
      <div>
        <h3 className={`item-card__name item-card__name--${rarityClass}`}>
          {item.name}
        </h3>
        <p className="item-card__type">{item.type}</p>
      </div>

      {/* Stats */}
      <div className="item-card__stats">
        {Object.entries(statComparisons)
          .filter(([, data]) => data.value !== 0 || data.delta !== 0)
          .map(([key, data]) => (
            <div key={key} className="item-card__stat">
              <span className="item-card__stat-name">{formatStatName(key)}</span>
              <div className="item-card__stat-values">
                <span className="item-card__stat-value">+{data.value}</span>
                {data.delta !== 0 && !data.isNew && (
                  <span
                    className={`item-card__stat-delta ${
                      data.delta > 0
                        ? 'item-card__stat-delta--increase'
                        : 'item-card__stat-delta--decrease'
                    }`}
                  >
                    {data.delta > 0 ? '\u25B2' : '\u25BC'}
                    {Math.abs(data.delta)}
                  </span>
                )}
                {data.isNew && (
                  <span className="item-card__stat-delta item-card__stat-delta--new">
                    NEW
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="item-card__footer">
        <div className="item-card__price">
          <span
            className={`item-card__price-current ${
              affordable
                ? 'item-card__price-current--affordable'
                : 'item-card__price-current--unaffordable'
            }`}
          >
            {price} Ryo
          </span>
          {discountPercent > 0 && (
            <span className="item-card__price-original">{item.value}</span>
          )}
        </div>
        <button
          type="button"
          className={`item-card__buy-button ${
            affordable ? 'item-card__buy-button--affordable' : 'item-card__buy-button--unaffordable'
          }`}
          onClick={handleBuy}
          disabled={!affordable}
        >
          {affordable ? 'Buy' : 'Cannot Afford'}
        </button>
      </div>
    </div>
  );
};

/* ===========================================
   Preview Panel Component
   =========================================== */

interface PreviewPanelProps {
  item: Item;
  price: number;
  affordable: boolean;
  statComparisons: Record<string, StatComparison>;
  discountPercent: number;
  equippedItemName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  item,
  price,
  affordable,
  statComparisons,
  discountPercent,
  equippedItemName,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  const rarityClass = getRarityClass(item.rarity);
  const rarityLabel = getRarityLabel(item.rarity);

  return (
    <div className="preview-panel">
      {/* Header */}
      <div className="preview-panel__header">
        <div className="preview-panel__label">Item Preview</div>
        <div className={`preview-panel__rarity item-card__name--${rarityClass}`}>
          {rarityLabel}
        </div>
        <h2 className={`preview-panel__name item-card__name--${rarityClass}`}>
          {item.name}
        </h2>
        <p className="preview-panel__type">{item.type} Equipment</p>
      </div>

      {/* Description */}
      {item.description && (
        <p className="preview-panel__description">"{item.description}"</p>
      )}

      {/* Stat Comparison */}
      <div className="preview-panel__stats">
        <div className="preview-panel__stats-header">Stat Comparison</div>
        {Object.entries(statComparisons)
          .filter(([, data]) => data.value !== 0 || data.delta !== 0)
          .map(([key, data]) => (
            <div key={key} className="preview-panel__stat">
              <span className="preview-panel__stat-name">{formatStatName(key)}</span>
              <div className="preview-panel__stat-values">
                <span className="preview-panel__stat-value">+{data.value}</span>
                {data.delta !== 0 && !data.isNew && (
                  <span
                    className={`preview-panel__stat-delta ${
                      data.delta > 0
                        ? 'preview-panel__stat-delta--increase'
                        : 'preview-panel__stat-delta--decrease'
                    }`}
                  >
                    ({data.delta > 0 ? '+' : ''}
                    {data.delta})
                  </span>
                )}
                {data.isNew && (
                  <span className="preview-panel__stat-delta preview-panel__stat-delta--new">
                    (NEW)
                  </span>
                )}
              </div>
            </div>
          ))}
        <div className="preview-panel__currently">
          Currently: {equippedItemName || '(Empty Slot)'}
        </div>
      </div>

      {/* Price */}
      <div className="preview-panel__price">
        <div className="preview-panel__price-label">Price</div>
        <span
          className={`preview-panel__price-value ${
            affordable
              ? 'preview-panel__price-value--affordable'
              : 'preview-panel__price-value--unaffordable'
          }`}
        >
          {price} Ryo
        </span>
        {discountPercent > 0 && (
          <>
            <span className="preview-panel__price-original">{item.value}</span>
            <div className="preview-panel__price-discount">
              {discountPercent}% OFF!
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="preview-panel__actions">
        <button
          type="button"
          className="preview-panel__confirm"
          onClick={onConfirm}
          disabled={!affordable || isProcessing}
        >
          <Sparkles size={16} />
          <span>{affordable ? 'Confirm Purchase' : 'Cannot Afford'}</span>
        </button>
        <button type="button" className="preview-panel__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ===========================================
   Main Merchant Component
   =========================================== */

const Merchant: React.FC<MerchantProps> = ({
  merchantItems,
  discountPercent,
  player,
  dangerLevel,
  baseDifficulty,
  onBuyItem,
  onLeave,
  onReroll,
  onBuySlot,
  onUpgradeQuality,
  isProcessing = false,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const rerollCost = calculateMerchantRerollCost(
    dangerLevel,
    baseDifficulty,
    MERCHANT.REROLL_BASE_COST,
    MERCHANT.REROLL_FLOOR_SCALING
  );

  const getPrice = useCallback(
    (item: Item) => {
      const basePrice = item.value * MERCHANT.ITEM_PRICE_MULTIPLIER;
      return Math.floor(basePrice * (1 - discountPercent / 100));
    },
    [discountPercent]
  );

  const canAfford = useCallback(
    (item: Item) => {
      return player !== null && player.ryo >= getPrice(item);
    },
    [player, getPrice]
  );

  const getStatComparisons = useCallback(
    (item: Item): Record<string, StatComparison> => {
      if (!player) return {};

      const targetSlot = item.type ? SLOT_MAPPING[item.type] : EquipmentSlot.SLOT_1;
      const equippedItem = player.equipment[targetSlot];
      const comparisons: Record<string, StatComparison> = {};

      // Add stats from new item
      Object.entries(item.stats).forEach(([key, val]) => {
        const equippedVal =
          equippedItem?.stats[key as keyof typeof equippedItem.stats] || 0;
        comparisons[key] = {
          value: val as number,
          delta: (val as number) - (equippedVal as number),
          isNew: !equippedItem,
        };
      });

      // Add stats that would be lost
      if (equippedItem) {
        Object.entries(equippedItem.stats).forEach(([key, val]) => {
          if (!(key in comparisons) && val) {
            comparisons[key] = {
              value: 0,
              delta: -(val as number),
              isNew: false,
            };
          }
        });
      }

      return comparisons;
    },
    [player]
  );

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return merchantItems.find((item) => item.id === selectedItemId) || null;
  }, [selectedItemId, merchantItems]);

  const selectedPrice = selectedItem ? getPrice(selectedItem) : null;

  const getEquippedItemName = useCallback(
    (item: Item): string | null => {
      if (!player) return null;
      const targetSlot = item.type ? SLOT_MAPPING[item.type] : EquipmentSlot.SLOT_1;
      const equippedItem = player.equipment[targetSlot];
      return equippedItem?.name || null;
    },
    [player]
  );

  const handleSelect = useCallback((itemId: string) => {
    setSelectedItemId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const handleConfirmPurchase = useCallback(() => {
    if (selectedItem) {
      onBuyItem(selectedItem);
      setSelectedItemId(null);
    }
  }, [selectedItem, onBuyItem]);

  const handleCancel = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  if (!player) {
    return null;
  }

  const slotCost = MERCHANT.SLOT_COSTS[player.merchantSlots] || 999999;
  const qualityCost =
    player.treasureQuality === TreasureQuality.BROKEN
      ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
      : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;

  return (
    <div className="merchant">
      {/* Header */}
      <header className="merchant__header">
        <div className="merchant__icon"><Store size={40} /></div>
        <h1 className="merchant__title">
          The Traveling Merchant
          {discountPercent > 0 && (
            <span className="merchant__discount-badge">{discountPercent}% OFF!</span>
          )}
        </h1>
        <p className="merchant__subtitle">
          "Rare treasures from the farthest corners of the shinobi world"
        </p>
      </header>

      {/* Resources Bar */}
      <div className="merchant__resources">
        <RyoDisplay current={player.ryo} previewCost={selectedPrice} />
        <MerchantStatus
          quality={player.treasureQuality}
          slots={player.merchantSlots}
          maxSlots={MAX_MERCHANT_SLOTS}
        />
      </div>

      {/* Services Panel */}
      <div className="merchant__services">
        <ServiceButton
          variant="reroll"
          cost={rerollCost}
          label="Reroll"
          onClick={onReroll}
          disabled={isProcessing || player.ryo < rerollCost}
        />
        {player.merchantSlots < MAX_MERCHANT_SLOTS && (
          <ServiceButton
            variant="slot"
            cost={slotCost}
            label="+1 Slot"
            onClick={onBuySlot}
            disabled={isProcessing || player.ryo < slotCost}
          />
        )}
        {player.treasureQuality !== TreasureQuality.RARE && (
          <ServiceButton
            variant="quality"
            cost={qualityCost}
            label="Quality \u2191"
            onClick={onUpgradeQuality}
            disabled={isProcessing || player.ryo < qualityCost}
          />
        )}
      </div>

      {/* Content Area */}
      {merchantItems.length === 0 ? (
        <div className="merchant__empty">
          The merchant has nothing left to sell.
        </div>
      ) : (
        <div
          className={`merchant__content ${
            selectedItem ? 'merchant__content--with-preview' : ''
          }`}
        >
          {/* Item Grid */}
          <div
            className={`item-grid ${
              selectedItem ? 'item-grid--with-selection' : ''
            }`}
          >
            {merchantItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                price={getPrice(item)}
                affordable={canAfford(item)}
                statComparisons={getStatComparisons(item)}
                isSelected={selectedItemId === item.id}
                isDimmed={selectedItemId !== null && selectedItemId !== item.id}
                discountPercent={discountPercent}
                onSelect={() => handleSelect(item.id)}
                onBuy={() => onBuyItem(item)}
              />
            ))}
          </div>

          {/* Preview Panel */}
          {selectedItem && (
            <PreviewPanel
              item={selectedItem}
              price={getPrice(selectedItem)}
              affordable={canAfford(selectedItem)}
              statComparisons={getStatComparisons(selectedItem)}
              discountPercent={discountPercent}
              equippedItemName={getEquippedItemName(selectedItem)}
              onConfirm={handleConfirmPurchase}
              onCancel={handleCancel}
              isProcessing={isProcessing}
            />
          )}
        </div>
      )}

      {/* Leave Button */}
      <div className="merchant__leave">
        <button
          type="button"
          className="merchant__leave-button"
          onClick={onLeave}
        >
          Leave the Merchant's Cart
        </button>
      </div>
    </div>
  );
};

export default Merchant;
