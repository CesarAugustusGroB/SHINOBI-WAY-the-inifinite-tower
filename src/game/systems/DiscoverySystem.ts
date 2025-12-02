import {
  FloorLayout,
  ExplorationNode,
  NodeType,
  TerrainDefinition,
  CharacterStats,
  Player,
} from '../types';
import { TERRAIN_DEFINITIONS } from '../constants/terrain';

// ============================================================================
// DISCOVERY SYSTEM
// Handles hidden room detection, mystery node revelation, and trap awareness
// ============================================================================

// ============================================================================
// DISCOVERY RESULT TYPES
// ============================================================================

export interface DiscoveryResult {
  nodeId: string;
  discovered: boolean;
  newType?: NodeType;
  description: string;
}

export interface TrapDetectionResult {
  detected: boolean;
  avoided: boolean;
  damageReduced: number;
  description: string;
}

export interface MysteryRevealResult {
  nodeId: string;
  revealed: boolean;
  actualType: NodeType;
  description: string;
}

// ============================================================================
// HIDDEN ROOM DETECTION
// ============================================================================

/**
 * Calculate base discovery chance from player stats
 * Formula: 15% + (Intelligence × 1.5%) + terrain bonus
 */
export function calculateDiscoveryChance(
  playerStats: CharacterStats,
  terrain: TerrainDefinition
): number {
  const baseChance = 15;
  const intelligenceBonus = playerStats.primary.intelligence * 1.5;
  const terrainBonus = terrain.effects.hiddenRoomBonus || 0;

  // Cap at 85% - there should always be some mystery
  return Math.min(85, baseChance + intelligenceBonus + terrainBonus);
}

/**
 * Attempt to discover hidden rooms when entering a node
 * Checks all adjacent unrevealed nodes
 */
export function attemptDiscovery(
  currentNodeId: string,
  layout: FloorLayout,
  playerStats: CharacterStats
): DiscoveryResult[] {
  const results: DiscoveryResult[] = [];
  const currentNode = layout.nodes.find(n => n.id === currentNodeId);

  if (!currentNode) return results;

  // Get adjacent nodes that are hidden
  const adjacentHiddenNodes = layout.nodes.filter(node =>
    node.type === NodeType.HIDDEN &&
    !node.isRevealed &&
    currentNode.connections.includes(node.id)
  );

  for (const hiddenNode of adjacentHiddenNodes) {
    const terrain = TERRAIN_DEFINITIONS[hiddenNode.terrain];
    const discoveryChance = calculateDiscoveryChance(playerStats, terrain);
    const roll = Math.random() * 100;

    if (roll < discoveryChance) {
      results.push({
        nodeId: hiddenNode.id,
        discovered: true,
        newType: hiddenNode.revealedType || NodeType.CACHE,
        description: generateDiscoveryDescription(hiddenNode.revealedType || NodeType.CACHE),
      });
    }
  }

  return results;
}

/**
 * Apply discovery results to floor layout
 * Returns updated layout with revealed nodes
 */
export function applyDiscoveryResults(
  layout: FloorLayout,
  results: DiscoveryResult[]
): FloorLayout {
  if (results.length === 0) return layout;

  const updatedNodes = layout.nodes.map(node => {
    const result = results.find(r => r.nodeId === node.id && r.discovered);
    if (result) {
      return {
        ...node,
        isRevealed: true,
        type: result.newType || node.type,
      };
    }
    return node;
  });

  return {
    ...layout,
    nodes: updatedNodes,
  };
}

// ============================================================================
// MYSTERY NODE REVELATION
// ============================================================================

/**
 * Calculate chance to identify a mystery node before entering
 * Higher Intelligence = better chance to know what's ahead
 */
export function calculateMysteryRevealChance(
  playerStats: CharacterStats,
  terrain: TerrainDefinition
): number {
  const baseChance = 20;
  const intelligenceBonus = playerStats.primary.intelligence * 2;
  const calmnessBonus = playerStats.primary.calmness * 0.5;
  const terrainVisibility = 100 - ((terrain.effects.visibilityRange || 2) * 20); // Lower visibility = harder to reveal

  // Clamp to 0-90 range (terrain penalty can cause negative values)
  return Math.max(0, Math.min(90, baseChance + intelligenceBonus + calmnessBonus - terrainVisibility));
}

/**
 * Attempt to reveal what a mystery node actually contains
 */
export function attemptMysteryReveal(
  mysteryNode: ExplorationNode,
  playerStats: CharacterStats
): MysteryRevealResult {
  if (mysteryNode.type !== NodeType.MYSTERY) {
    return {
      nodeId: mysteryNode.id,
      revealed: false,
      actualType: mysteryNode.type,
      description: 'This node is not mysterious.',
    };
  }

  const terrain = TERRAIN_DEFINITIONS[mysteryNode.terrain];
  const revealChance = calculateMysteryRevealChance(playerStats, terrain);
  const roll = Math.random() * 100;

  const actualType = mysteryNode.revealedType || NodeType.EVENT;

  if (roll < revealChance) {
    return {
      nodeId: mysteryNode.id,
      revealed: true,
      actualType,
      description: generateMysteryRevealDescription(actualType),
    };
  }

  return {
    nodeId: mysteryNode.id,
    revealed: false,
    actualType,
    description: 'The chamber remains shrouded in mystery...',
  };
}

/**
 * Apply mystery reveal to floor layout
 */
export function applyMysteryReveal(
  layout: FloorLayout,
  result: MysteryRevealResult
): FloorLayout {
  if (!result.revealed) return layout;

  const updatedNodes = layout.nodes.map(node => {
    if (node.id === result.nodeId) {
      return {
        ...node,
        revealedType: result.actualType,
      };
    }
    return node;
  });

  return {
    ...layout,
    nodes: updatedNodes,
  };
}

// ============================================================================
// TRAP DETECTION
// ============================================================================

/**
 * Calculate chance to detect a trap before triggering it
 * Based on Dexterity and Intelligence
 */
export function calculateTrapDetectionChance(
  playerStats: CharacterStats,
  terrain: TerrainDefinition
): number {
  const baseChance = 25;
  const dexterityBonus = playerStats.primary.dexterity * 1.2;
  const intelligenceBonus = playerStats.primary.intelligence * 0.8;
  const terrainPenalty = terrain.effects.hazard ? 10 : 0;

  return Math.min(95, baseChance + dexterityBonus + intelligenceBonus - terrainPenalty);
}

/**
 * Calculate chance to avoid a detected trap
 * Based on Speed and Dexterity
 */
export function calculateTrapAvoidanceChance(
  playerStats: CharacterStats
): number {
  const baseChance = 30;
  const speedBonus = playerStats.primary.speed * 1.5;
  const dexterityBonus = playerStats.primary.dexterity * 1.0;

  return Math.min(90, baseChance + speedBonus + dexterityBonus);
}

/**
 * Attempt to detect and avoid a trap
 */
export function handleTrapEncounter(
  trapNode: ExplorationNode,
  playerStats: CharacterStats,
  baseTrapDamage: number
): TrapDetectionResult {
  const terrain = TERRAIN_DEFINITIONS[trapNode.terrain];

  // First, try to detect
  const detectionChance = calculateTrapDetectionChance(playerStats, terrain);
  const detectionRoll = Math.random() * 100;
  const detected = detectionRoll < detectionChance;

  if (!detected) {
    // Trap triggers at full damage
    return {
      detected: false,
      avoided: false,
      damageReduced: 0,
      description: 'A hidden trap springs! You take the full impact.',
    };
  }

  // Detected - now try to avoid
  const avoidanceChance = calculateTrapAvoidanceChance(playerStats);
  const avoidanceRoll = Math.random() * 100;
  const avoided = avoidanceRoll < avoidanceChance;

  if (avoided) {
    return {
      detected: true,
      avoided: true,
      damageReduced: baseTrapDamage,
      description: 'Your keen senses detect the trap! You deftly avoid it.',
    };
  }

  // Detected but not avoided - reduced damage
  const damageReduction = Math.floor(baseTrapDamage * 0.5);
  return {
    detected: true,
    avoided: false,
    damageReduced: damageReduction,
    description: 'You spot the trap but react too slowly! Partial damage taken.',
  };
}

// ============================================================================
// VISIBILITY & FOG OF WAR
// ============================================================================

/**
 * Calculate how many nodes away the player can see
 * Based on terrain visibility range and player Intelligence
 */
export function calculateVisibilityRange(
  currentTerrain: TerrainDefinition,
  playerStats: CharacterStats
): number {
  const baseRange = currentTerrain.effects.visibilityRange || 2;
  const intelligenceBonus = Math.floor(playerStats.primary.intelligence / 20);

  return Math.min(4, baseRange + intelligenceBonus);
}

/**
 * Get all nodes visible from current position
 * Uses BFS to find nodes within visibility range
 */
export function getVisibleNodes(
  currentNodeId: string,
  layout: FloorLayout,
  visibilityRange: number
): string[] {
  const visible: Set<string> = new Set([currentNodeId]);
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: currentNodeId, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;

    if (depth >= visibilityRange) continue;

    const node = layout.nodes.find(n => n.id === nodeId);
    if (!node) continue;

    for (const connectedId of node.connections) {
      if (!visible.has(connectedId)) {
        visible.add(connectedId);
        queue.push({ nodeId: connectedId, depth: depth + 1 });
      }
    }
  }

  return Array.from(visible);
}

/**
 * Update floor layout with visibility information
 */
export function updateNodeVisibility(
  layout: FloorLayout,
  currentNodeId: string,
  playerStats: CharacterStats
): FloorLayout {
  const currentNode = layout.nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return layout;

  const terrain = TERRAIN_DEFINITIONS[currentNode.terrain];
  const visibilityRange = calculateVisibilityRange(terrain, playerStats);
  const visibleNodeIds = getVisibleNodes(currentNodeId, layout, visibilityRange);

  const updatedNodes = layout.nodes.map(node => ({
    ...node,
    isVisible: visibleNodeIds.includes(node.id) || node.isVisited,
  }));

  return {
    ...layout,
    nodes: updatedNodes,
  };
}

// ============================================================================
// DESCRIPTION GENERATORS
// ============================================================================

function generateDiscoveryDescription(nodeType: NodeType): string {
  const descriptions: Partial<Record<NodeType, string[]>> = {
    [NodeType.CACHE]: [
      'Your sharp eyes spot a hidden cache behind loose stones!',
      'A concealed supply stash reveals itself to you.',
      'Previous travelers left supplies here, hidden from plain sight.',
    ],
    [NodeType.SHRINE]: [
      'Ancient chakra emanates from a hidden shrine!',
      'A secret sanctuary reveals itself to your trained senses.',
      'You discover a forgotten place of power.',
    ],
    [NodeType.TRAINING]: [
      'A hidden training ground awaits those who seek it.',
      'You uncover a secret dojo built into the walls.',
      'A place for self-improvement, hidden from the unworthy.',
    ],
    [NodeType.SENSEI]: [
      'A hidden master awaits those with eyes to see.',
      'Your perception reveals a concealed sage.',
      'Someone powerful has been watching from the shadows.',
    ],
    [NodeType.REST]: [
      'A safe haven, concealed from danger.',
      'You discover a hidden resting spot.',
      'A secret alcove offers respite from the tower.',
    ],
  };

  const options = descriptions[nodeType] || ['You discover a hidden chamber!'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMysteryRevealDescription(nodeType: NodeType): string {
  const descriptions: Partial<Record<NodeType, string[]>> = {
    [NodeType.COMBAT]: [
      'Your instincts warn you: combat awaits within.',
      'You sense hostile chakra signatures ahead.',
      'The mystery fades - an enemy lurks there.',
    ],
    [NodeType.ELITE]: [
      'A powerful presence... this is no ordinary foe.',
      'You sense formidable chakra. An elite awaits.',
      'Your danger sense screams. A worthy opponent is inside.',
    ],
    [NodeType.REST]: [
      'You sense calm ahead. A place to recover.',
      'No danger detected. This place offers rest.',
      'The chamber feels peaceful. Safety awaits.',
    ],
    [NodeType.EVENT]: [
      'Something unusual lies ahead, but not hostile.',
      'Your intuition suggests a strange encounter awaits.',
      'Neither safe nor dangerous... curious.',
    ],
    [NodeType.TRAP]: [
      'Your trained eye spots the telltale signs of a trap.',
      'Danger! This chamber is rigged with traps.',
      'Your senses scream: approach with caution.',
    ],
    [NodeType.SHRINE]: [
      'Ancient power resonates from within.',
      'You sense sacred chakra. A shrine awaits.',
      'Blessings may await those who enter.',
    ],
  };

  const options = descriptions[nodeType] || ['The mystery reveals itself to you.'];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// SCAN ABILITY (Active Discovery)
// ============================================================================

/**
 * Player can spend chakra to actively scan for secrets
 * More effective than passive detection
 */
export interface ScanResult {
  chakraCost: number;
  discoveredNodes: DiscoveryResult[];
  revealedMysteries: MysteryRevealResult[];
  description: string;
}

export function performScan(
  currentNodeId: string,
  layout: FloorLayout,
  player: Player,
  playerStats: CharacterStats
): ScanResult {
  const chakraCost = 15;

  if (player.currentChakra < chakraCost) {
    return {
      chakraCost: 0,
      discoveredNodes: [],
      revealedMysteries: [],
      description: 'Not enough chakra to perform a scan.',
    };
  }

  // Boost discovery chance for active scan
  const boostedStats: CharacterStats = {
    ...playerStats,
    primary: {
      ...playerStats.primary,
      intelligence: playerStats.primary.intelligence + 15, // Temporary boost
    },
  };

  // Try to discover hidden nodes
  const discoveries = attemptDiscovery(currentNodeId, layout, boostedStats);

  // Try to reveal adjacent mystery nodes
  const currentNode = layout.nodes.find(n => n.id === currentNodeId);
  const mysteryReveals: MysteryRevealResult[] = [];

  if (currentNode) {
    const adjacentMysteries = layout.nodes.filter(
      n => n.type === NodeType.MYSTERY &&
        !n.revealedType &&
        currentNode.connections.includes(n.id)
    );

    for (const mystery of adjacentMysteries) {
      const reveal = attemptMysteryReveal(mystery, boostedStats);
      if (reveal.revealed) {
        mysteryReveals.push(reveal);
      }
    }
  }

  const totalFindings = discoveries.length + mysteryReveals.length;
  let description = '';

  if (totalFindings === 0) {
    description = 'Your chakra-enhanced senses find nothing new nearby.';
  } else {
    const parts: string[] = [];
    if (discoveries.length > 0) {
      parts.push(`discovered ${discoveries.length} hidden chamber${discoveries.length > 1 ? 's' : ''}`);
    }
    if (mysteryReveals.length > 0) {
      parts.push(`revealed ${mysteryReveals.length} mystery node${mysteryReveals.length > 1 ? 's' : ''}`);
    }
    description = `Your chakra pulse reveals secrets! You ${parts.join(' and ')}.`;
  }

  return {
    chakraCost,
    discoveredNodes: discoveries,
    revealedMysteries: mysteryReveals,
    description,
  };
}
