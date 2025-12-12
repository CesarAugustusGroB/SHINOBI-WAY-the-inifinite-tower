/**
 * LootSystem Unit Tests
 * Tests synthesis, disassembly, equipment, and bag management
 */

import { describe, it, expect } from 'vitest';
import {
  synthesize,
  disassemble,
  equipItem,
  addToBag,
  hasBagSpace,
  removeFromBag,
  generateComponent,
} from '../LootSystem';
import { ComponentId, EquipmentSlot, MAX_BAG_SLOTS, Rarity } from '../../types';
import { createMockPlayer, createMockComponent, createMockArtifact } from './testFixtures';

describe('synthesize', () => {
  it('combines two COMMON components into a RARE artifact', () => {
    const compA = createMockComponent(ComponentId.NINJA_STEEL, { strength: 10 });
    compA.rarity = Rarity.COMMON;
    const compB = createMockComponent(ComponentId.NINJA_STEEL, { strength: 10 });
    compB.rarity = Rarity.COMMON;

    const result = synthesize(compA, compB, 1);

    expect(result.success).toBe(true);
    expect(result.item).not.toBeNull();
    expect(result.item!.isComponent).toBe(false);
    expect(result.item!.rarity).toBe(Rarity.RARE);
    expect(result.item!.recipe).toEqual([ComponentId.NINJA_STEEL, ComponentId.NINJA_STEEL]);
    expect(result.cost).toBeGreaterThan(0);
  });

  it('returns failure for non-component items', () => {
    const artifact = createMockArtifact();
    const component = createMockComponent();
    component.rarity = Rarity.COMMON;

    const result = synthesize(artifact, component, 1);

    expect(result.success).toBe(false);
    expect(result.item).toBeUndefined();
  });

  it('combines stats from both components', () => {
    const compA = createMockComponent(ComponentId.NINJA_STEEL, { strength: 10 });
    compA.rarity = Rarity.COMMON;
    const compB = createMockComponent(ComponentId.SPIRIT_TAG, { spirit: 8 });
    compB.rarity = Rarity.COMMON;

    const result = synthesize(compA, compB, 1);

    expect(result.success).toBe(true);
    expect(result.item).not.toBeNull();
    // Stats should be combined (capped to 2 highest)
    const statKeys = Object.keys(result.item!.stats);
    expect(statKeys.length).toBeLessThanOrEqual(2);
  });

  it('scales cost with floor', () => {
    const compA = createMockComponent(ComponentId.NINJA_STEEL, { strength: 10 });
    compA.rarity = Rarity.COMMON;
    const compB = createMockComponent(ComponentId.SPIRIT_TAG, { spirit: 8 });
    compB.rarity = Rarity.COMMON;

    const floor1Result = synthesize(compA, compB, 1);
    const floor10Result = synthesize(compA, compB, 10);

    expect(floor10Result.cost).toBeGreaterThan(floor1Result.cost);
  });
});

describe('disassemble', () => {
  it('breaks artifact into one random component', () => {
    const artifact = createMockArtifact(
      [ComponentId.NINJA_STEEL, ComponentId.SPIRIT_TAG],
      { strength: 20 }
    );

    const component = disassemble(artifact);

    expect(component).not.toBeNull();
    expect(component!.isComponent).toBe(true);
    // Should be one of the recipe components
    expect([ComponentId.NINJA_STEEL, ComponentId.SPIRIT_TAG]).toContain(component!.componentId);
  });

  it('returns null for component items', () => {
    const component = createMockComponent();

    const result = disassemble(component);

    expect(result).toBeNull();
  });

  it('returns 50% of artifact value for the component', () => {
    const artifact = createMockArtifact();
    artifact.value = 400;

    const component = disassemble(artifact);

    expect(component).not.toBeNull();
    // Returned value should be ~200 (50% of 400)
    expect(component!.value).toBe(200); // 400 * 0.5 = 200
  });
});

describe('equipItem', () => {
  it('equips item to empty slot', () => {
    const player = createMockPlayer();
    const item = createMockComponent();

    const result = equipItem(player, item, EquipmentSlot.SLOT_1);

    expect(result.success).toBe(true);
    expect(result.player.equipment[EquipmentSlot.SLOT_1]).toEqual(item);
  });

  it('moves existing item to bag when replacing', () => {
    const existingItem = createMockComponent(ComponentId.NINJA_STEEL, { strength: 5 });
    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: existingItem,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const newItem = createMockComponent(ComponentId.SPIRIT_TAG, { spirit: 10 });

    const result = equipItem(player, newItem, EquipmentSlot.SLOT_1);

    expect(result.success).toBe(true);
    expect(result.player.equipment[EquipmentSlot.SLOT_1]).toEqual(newItem);
    expect(result.player.componentBag).toContain(existingItem);
    expect(result.replacedItem).toEqual(existingItem);
  });

  it('fails if bag is full and slot is occupied', () => {
    // Fill bag to max
    const fullBag = Array(MAX_BAG_SLOTS).fill(null).map(() => createMockComponent());
    const existingItem = createMockComponent();
    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: existingItem,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
      componentBag: fullBag,
    });
    const newItem = createMockComponent();

    const result = equipItem(player, newItem, EquipmentSlot.SLOT_1);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('bag is full');
  });
});

describe('addToBag', () => {
  it('adds item to bag when space available', () => {
    const player = createMockPlayer();
    const item = createMockComponent();

    const result = addToBag(player, item);

    expect(result).not.toBeNull();
    expect(result!.componentBag.length).toBe(1);
    expect(result!.componentBag[0]).toEqual(item);
  });

  it('returns null when bag is full', () => {
    const fullBag = Array(MAX_BAG_SLOTS).fill(null).map(() => createMockComponent());
    const player = createMockPlayer({ componentBag: fullBag });
    const item = createMockComponent();

    const result = addToBag(player, item);

    expect(result).toBeNull();
  });
});

describe('hasBagSpace', () => {
  it('returns true when bag has space', () => {
    const player = createMockPlayer({ componentBag: [] });
    expect(hasBagSpace(player)).toBe(true);
  });

  it('returns false when bag is full', () => {
    const fullBag = Array(MAX_BAG_SLOTS).fill(null).map(() => createMockComponent());
    const player = createMockPlayer({ componentBag: fullBag });
    expect(hasBagSpace(player)).toBe(false);
  });
});

describe('removeFromBag', () => {
  it('removes item by id', () => {
    const item1 = createMockComponent();
    const item2 = createMockComponent();
    const player = createMockPlayer({ componentBag: [item1, item2] });

    const result = removeFromBag(player, item1.id);

    expect(result.componentBag.length).toBe(1);
    expect(result.componentBag[0].id).toBe(item2.id);
  });
});

describe('generateComponent', () => {
  it('generates a component with common rarity', () => {
    const component = generateComponent(1, 50);

    expect(component.isComponent).toBe(true);
    expect(component.rarity).toBe(Rarity.COMMON);
    expect(component.componentId).toBeDefined();
  });

  it('scales value with floor', () => {
    const floor1 = generateComponent(1, 50);
    const floor10 = generateComponent(10, 50);

    // Higher floor should generally have higher value (with some variance)
    // Test multiple times and compare averages
    let floor1Total = floor1.value;
    let floor10Total = floor10.value;
    for (let i = 0; i < 10; i++) {
      floor1Total += generateComponent(1, 50).value;
      floor10Total += generateComponent(10, 50).value;
    }
    expect(floor10Total / 11).toBeGreaterThan(floor1Total / 11);
  });
});
