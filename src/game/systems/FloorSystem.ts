import {
  FloorLayout,
  ExplorationNode,
  NodeType,
  TerrainType,
  Connection,
  NodePosition,
  Player,
  NodeVisibility,
  PathDifficulty,
} from '../types';
import { BOSS_NAMES, ENHANCED_EVENTS } from '../constants';
import { BIOME_TERRAINS, getRandomTerrainForArc } from '../constants/terrain';
import { generateEnemy, getStoryArc } from './EnemySystem';
import { getEventsForArc } from './EventSystem';

// ============================================================================
// FLOOR GENERATION CONSTANTS
// ============================================================================

/**
 * Get node count based on floor (variable sizing from plan)
 */
export function getFloorNodeCount(floor: number): number {
  if (floor <= 10) return 3 + Math.floor(floor / 5);      // 3-4 nodes
  if (floor <= 25) return 4 + Math.floor(floor / 10);     // 5-6 nodes
  if (floor <= 50) return 5 + Math.floor(floor / 15);     // 6-8 nodes
  if (floor <= 75) return 5 + Math.floor((floor - 50) / 15); // 5-7 nodes
  return 7 + Math.floor((floor - 75) / 25);               // 7-10 nodes
}

/**
 * Node type distribution weights
 */
const NODE_TYPE_WEIGHTS: Record<NodeType, number> = {
  [NodeType.START]: 0,      // Always exactly 1
  [NodeType.EXIT]: 0,       // Always exactly 1
  [NodeType.COMBAT]: 35,
  [NodeType.EVENT]: 20,
  [NodeType.MYSTERY]: 15,
  [NodeType.REST]: 10,
  [NodeType.ELITE]: 8,
  [NodeType.TRAP]: 5,
  [NodeType.HIDDEN]: 7,     // Not in regular pool, added separately
  [NodeType.BOSS]: 0,       // Only on boss floors
  [NodeType.SHRINE]: 3,
  [NodeType.TRAINING]: 3,
  [NodeType.TRIAL]: 2,
  [NodeType.ANOMALY]: 4,
  [NodeType.SENSEI]: 2,
  [NodeType.AMBUSH_POINT]: 3,
  [NodeType.CACHE]: 3,
};

// ============================================================================
// MAIN FLOOR GENERATION
// ============================================================================

/**
 * Generate a complete floor layout with nodes and connections
 */
export function generateFloorLayout(
  floor: number,
  difficulty: number,
  player?: Player,
  maxHp?: number
): FloorLayout {
  const arc = getStoryArc(floor);

  // Boss floor - single boss node
  if (BOSS_NAMES[floor as keyof typeof BOSS_NAMES]) {
    return generateBossFloor(floor, difficulty, arc);
  }

  // Regular floor - generate node map
  const nodeCount = getFloorNodeCount(floor);
  const nodes: ExplorationNode[] = [];
  const connections: Connection[] = [];

  // Generate node positions in a grid-like pattern
  const positions = generateNodePositions(nodeCount);

  // Create START node
  const startNode = createNode('start', NodeType.START, positions[0], arc.name, floor);
  nodes.push(startNode);

  // Create EXIT node (always last position)
  const exitNode = createNode('exit', NodeType.EXIT, positions[positions.length - 1], arc.name, floor);
  nodes.push(exitNode);

  // Generate middle nodes
  const middlePositions = positions.slice(1, -1);
  const nodeTypes = selectNodeTypes(nodeCount - 2, floor, arc.name);

  for (let i = 0; i < middlePositions.length; i++) {
    const nodeType = nodeTypes[i];
    const node = createNode(
      `node_${i}`,
      nodeType,
      middlePositions[i],
      arc.name,
      floor,
      difficulty
    );
    nodes.push(node);
  }

  // Generate connections
  const generatedConnections = generateConnections(nodes);
  connections.push(...generatedConnections);

  // Add hidden nodes (1-2 per floor based on density)
  const hiddenCount = Math.random() < 0.5 ? 1 : 2;
  for (let i = 0; i < hiddenCount; i++) {
    const hiddenNode = createHiddenNode(floor, arc.name, nodes, difficulty);
    if (hiddenNode) {
      nodes.push(hiddenNode);
      // Connect hidden node to a random visible node
      const visibleNodes = nodes.filter(n =>
        n.visibility === 'VISIBLE' &&
        n.type !== NodeType.START &&
        n.type !== NodeType.EXIT
      );
      if (visibleNodes.length > 0) {
        const connectTo = visibleNodes[Math.floor(Math.random() * visibleNodes.length)];
        connections.push({
          fromId: connectTo.id,
          toId: hiddenNode.id,
          difficulty: 'RISKY',
        });
        connectTo.connections.push(hiddenNode.id);
        hiddenNode.connections.push(connectTo.id);
      }
    }
  }

  // Ensure path to exit exists
  ensurePathToExit(nodes, connections, startNode.id, exitNode.id);

  return {
    floor,
    arc: arc.name,
    biome: arc.biome,
    nodes,
    connections,
    entryNodeId: startNode.id,
    exitNodeId: exitNode.id,
    hiddenNodeCount: nodes.filter(n => n.visibility === 'HIDDEN').length,
    totalCombatNodes: nodes.filter(n =>
      n.type === NodeType.COMBAT ||
      n.type === NodeType.ELITE ||
      n.type === NodeType.BOSS
    ).length,
  };
}

// ============================================================================
// NODE CREATION
// ============================================================================

/**
 * Create a single exploration node
 */
function createNode(
  id: string,
  type: NodeType,
  position: NodePosition,
  arcName: string,
  floor: number,
  difficulty: number = 50
): ExplorationNode {
  const terrain = getRandomTerrainForArc(arcName);

  const node: ExplorationNode = {
    id,
    type,
    terrain,
    visibility: getNodeVisibility(type),
    position,
    connections: [],
    isVisited: false,
    isCleared: false,
  };

  // Add content based on type
  switch (type) {
    case NodeType.COMBAT:
      node.enemy = generateEnemy(floor, 'NORMAL', difficulty);
      break;

    case NodeType.ELITE:
      node.enemy = generateEnemy(floor, 'ELITE', difficulty + 20);
      if (node.enemy) {
        node.enemy.dropRateBonus = 50;
      }
      break;

    case NodeType.AMBUSH_POINT:
      node.enemy = generateEnemy(floor, 'NORMAL', difficulty - 10);
      break;

    case NodeType.EVENT:
      const arcEvents = getEventsForArc(ENHANCED_EVENTS, arcName);
      if (arcEvents.length > 0) {
        const selectedEvent = arcEvents[Math.floor(Math.random() * arcEvents.length)];
        node.event = selectedEvent as any;
      }
      break;

    case NodeType.MYSTERY:
      // Mystery nodes have a hidden true type
      const hiddenTypes = [NodeType.COMBAT, NodeType.EVENT, NodeType.REST, NodeType.CACHE, NodeType.TRAP];
      node.revealedType = hiddenTypes[Math.floor(Math.random() * hiddenTypes.length)];
      node.intelligenceToReveal = 12 + Math.floor(floor * 0.3);
      // Pre-generate content based on revealed type
      if (node.revealedType === NodeType.COMBAT) {
        node.enemy = generateEnemy(floor, 'NORMAL', difficulty);
      }
      break;

    case NodeType.SHRINE:
      node.blessings = generateShrineBlessings(floor);
      break;

    case NodeType.TRAINING:
      node.trainingOptions = generateTrainingOptions(floor);
      break;

    case NodeType.TRIAL:
      node.trial = generateTrialDefinition(floor);
      break;

    case NodeType.ANOMALY:
      node.anomalyRevealed = false;
      node.trueNature = Math.random() < 0.5
        ? 'BENEFICIAL'
        : Math.random() < 0.5 ? 'NEUTRAL' : 'HARMFUL';
      break;

    case NodeType.TRAP:
      // Traps have a dexterity threshold to disarm
      node.detectionThreshold = 12 + Math.floor(floor * 0.4);
      break;
  }

  return node;
}

/**
 * Create a hidden node
 */
function createHiddenNode(
  floor: number,
  arcName: string,
  existingNodes: ExplorationNode[],
  difficulty: number
): ExplorationNode | null {
  // Find a suitable position near existing nodes
  const visibleNodes = existingNodes.filter(n => n.visibility === 'VISIBLE');
  if (visibleNodes.length === 0) return null;

  const referenceNode = visibleNodes[Math.floor(Math.random() * visibleNodes.length)];

  // Offset position slightly
  const position: NodePosition = {
    x: Math.min(95, Math.max(5, referenceNode.position.x + (Math.random() - 0.5) * 20)),
    y: Math.min(95, Math.max(5, referenceNode.position.y + (Math.random() - 0.5) * 20)),
  };

  // Hidden rooms are usually caches or shrines with good rewards
  const hiddenTypes = [NodeType.CACHE, NodeType.SHRINE, NodeType.COMBAT];
  const type = hiddenTypes[Math.floor(Math.random() * hiddenTypes.length)];

  const node = createNode(
    `hidden_${Math.random().toString(36).substr(2, 9)}`,
    type,
    position,
    arcName,
    floor,
    difficulty
  );

  node.visibility = 'HIDDEN';
  node.detectionThreshold = 15 + Math.floor(floor * 0.3);

  // Hidden combat rooms have elite enemies
  if (type === NodeType.COMBAT && node.enemy) {
    node.enemy.dropRateBonus = 100;
    node.enemy.tier = 'Hidden Elite';
  }

  return node;
}

// ============================================================================
// NODE POSITIONING & CONNECTIONS
// ============================================================================

/**
 * Generate positions for nodes in a flowing pattern
 */
function generateNodePositions(count: number): NodePosition[] {
  const positions: NodePosition[] = [];

  // Start at left side
  positions.push({ x: 10, y: 50 });

  // Exit at right side
  const exitPos: NodePosition = { x: 90, y: 50 };

  // Distribute middle nodes
  const middleCount = count - 2;
  const xStep = 70 / (middleCount + 1); // Spread across 70% of width

  for (let i = 0; i < middleCount; i++) {
    const x = 15 + (i + 1) * xStep;
    // Add vertical variation
    const yVariation = (Math.random() - 0.5) * 50;
    const y = 50 + yVariation;

    positions.push({
      x: Math.min(85, Math.max(15, x)),
      y: Math.min(85, Math.max(15, y)),
    });
  }

  positions.push(exitPos);

  return positions;
}

/**
 * Generate connections between nodes
 * Ensures progression from left to right with some branches
 */
function generateConnections(nodes: ExplorationNode[]): Connection[] {
  const connections: Connection[] = [];

  // Sort nodes by x position
  const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);

  // Connect each node to 1-2 nodes further right
  for (let i = 0; i < sortedNodes.length - 1; i++) {
    const currentNode = sortedNodes[i];

    // Find nodes to the right
    const rightNodes = sortedNodes.slice(i + 1);

    // Connect to at least 1 node, maybe 2
    const connectCount = Math.random() < 0.4 ? 2 : 1;

    // Sort by distance and take closest
    const byDistance = rightNodes
      .map(n => ({
        node: n,
        dist: Math.sqrt(
          Math.pow(n.position.x - currentNode.position.x, 2) +
          Math.pow(n.position.y - currentNode.position.y, 2)
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    for (let j = 0; j < Math.min(connectCount, byDistance.length); j++) {
      const targetNode = byDistance[j].node;

      // Avoid duplicate connections
      if (!currentNode.connections.includes(targetNode.id)) {
        currentNode.connections.push(targetNode.id);
        targetNode.connections.push(currentNode.id);

        connections.push({
          fromId: currentNode.id,
          toId: targetNode.id,
          difficulty: calculatePathDifficulty(currentNode, targetNode),
        });
      }
    }
  }

  return connections;
}

/**
 * Ensure there's a valid path from start to exit
 */
function ensurePathToExit(
  nodes: ExplorationNode[],
  connections: Connection[],
  startId: string,
  exitId: string
): void {
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === exitId) return; // Path exists

    if (visited.has(current)) continue;
    visited.add(current);

    const node = nodes.find(n => n.id === current);
    if (node) {
      for (const connId of node.connections) {
        if (!visited.has(connId)) {
          queue.push(connId);
        }
      }
    }
  }

  // No path found - create direct connection
  const startNode = nodes.find(n => n.id === startId);
  const exitNode = nodes.find(n => n.id === exitId);

  if (startNode && exitNode) {
    // Find the node closest to exit that is reachable from start
    const reachableNodes = nodes.filter(n => visited.has(n.id));
    const closest = reachableNodes
      .sort((a, b) =>
        Math.sqrt(Math.pow(exitNode.position.x - a.position.x, 2) + Math.pow(exitNode.position.y - a.position.y, 2)) -
        Math.sqrt(Math.pow(exitNode.position.x - b.position.x, 2) + Math.pow(exitNode.position.y - b.position.y, 2))
      )[0];

    if (closest) {
      closest.connections.push(exitId);
      exitNode.connections.push(closest.id);
      connections.push({
        fromId: closest.id,
        toId: exitId,
        difficulty: 'NORMAL',
      });
    }
  }
}

// ============================================================================
// NODE TYPE SELECTION
// ============================================================================

/**
 * Select node types based on weights and floor
 */
function selectNodeTypes(count: number, floor: number, arcName: string): NodeType[] {
  const types: NodeType[] = [];
  const weightedPool: NodeType[] = [];

  // Build weighted pool
  for (const [type, weight] of Object.entries(NODE_TYPE_WEIGHTS)) {
    const nodeType = type as NodeType;

    // Skip special types
    if (nodeType === NodeType.START || nodeType === NodeType.EXIT ||
        nodeType === NodeType.BOSS || nodeType === NodeType.HIDDEN) {
      continue;
    }

    // Elite only after floor 5
    if (nodeType === NodeType.ELITE && floor < 5) continue;

    // Sensei less common early
    if (nodeType === NodeType.SENSEI && floor < 10 && Math.random() > 0.3) continue;

    // Add to pool based on weight
    for (let i = 0; i < weight; i++) {
      weightedPool.push(nodeType);
    }
  }

  // Ensure at least one COMBAT node
  let hasCombat = false;

  for (let i = 0; i < count; i++) {
    if (i === 0 && !hasCombat) {
      // First node is guaranteed combat
      types.push(NodeType.COMBAT);
      hasCombat = true;
    } else {
      const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)];

      // Limit REST to 1 per floor
      if (selected === NodeType.REST && types.includes(NodeType.REST)) {
        types.push(NodeType.EVENT);
      } else {
        types.push(selected);
        if (selected === NodeType.COMBAT || selected === NodeType.ELITE) {
          hasCombat = true;
        }
      }
    }
  }

  return types;
}

// ============================================================================
// BOSS FLOOR GENERATION
// ============================================================================

/**
 * Generate a boss floor (single node)
 */
function generateBossFloor(
  floor: number,
  difficulty: number,
  arc: { name: string; biome: string }
): FloorLayout {
  const bossData = BOSS_NAMES[floor as keyof typeof BOSS_NAMES];
  const terrain = getRandomTerrainForArc(arc.name);

  const bossNode: ExplorationNode = {
    id: 'boss',
    type: NodeType.BOSS,
    terrain,
    visibility: 'VISIBLE',
    position: { x: 50, y: 50 },
    connections: [],
    isVisited: false,
    isCleared: false,
    enemy: generateEnemy(floor, 'BOSS', difficulty),
  };

  // Override enemy name with boss name
  if (bossNode.enemy && bossData) {
    bossNode.enemy.name = bossData.name;
    bossNode.enemy.isBoss = true;
    if (bossData.skill) {
      bossNode.enemy.skills = [bossData.skill, ...bossNode.enemy.skills.slice(1)];
    }
  }

  return {
    floor,
    arc: arc.name,
    biome: arc.biome,
    nodes: [bossNode],
    connections: [],
    entryNodeId: 'boss',
    exitNodeId: 'boss',
    hiddenNodeCount: 0,
    totalCombatNodes: 1,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get initial visibility for a node type
 */
function getNodeVisibility(type: NodeType): NodeVisibility {
  if (type === NodeType.HIDDEN) return 'HIDDEN';
  if (type === NodeType.MYSTERY) return 'OBSCURED';
  return 'VISIBLE';
}

/**
 * Calculate path difficulty between two nodes
 */
function calculatePathDifficulty(from: ExplorationNode, to: ExplorationNode): PathDifficulty {
  // Paths to elite/boss are dangerous
  if (to.type === NodeType.ELITE || to.type === NodeType.BOSS) return 'DANGEROUS';

  // Paths through certain terrains are risky
  const riskyTerrains = [TerrainType.SWAMP, TerrainType.CORRUPTED_ZONE, TerrainType.VOID_SPACE];
  if (riskyTerrains.includes(to.terrain)) return 'RISKY';

  // Paths to rest/cache are safe
  if (to.type === NodeType.REST || to.type === NodeType.CACHE) return 'SAFE';

  return 'NORMAL';
}

// ============================================================================
// CONTENT GENERATORS
// ============================================================================

import { PrimaryStat, ShrineBlessing, TrainingOption, TrialDefinition } from '../types';

/**
 * Generate shrine blessings for a floor
 */
function generateShrineBlessings(floor: number): ShrineBlessing[] {
  const stats = Object.values(PrimaryStat);
  const selectedStats = stats.sort(() => Math.random() - 0.5).slice(0, 3);

  return selectedStats.map((stat, i) => ({
    id: `blessing_${stat.toLowerCase()}`,
    name: `${stat} Blessing`,
    description: `Permanently increase ${stat} by 1`,
    requirement: i === 2 ? { stat: PrimaryStat.WILLPOWER, value: 15 + Math.floor(floor * 0.3) } : undefined,
    effect: {
      permanentStatBonus: { [stat.toLowerCase()]: 1 },
    },
    cost: {
      chakra: 20 + i * 10,
    },
  }));
}

/**
 * Generate training options for a floor
 */
function generateTrainingOptions(floor: number): TrainingOption[] {
  const stats = [PrimaryStat.STRENGTH, PrimaryStat.SPEED, PrimaryStat.DEXTERITY];
  const selectedStat = stats[Math.floor(Math.random() * stats.length)];

  return [
    {
      id: 'light_training',
      name: 'Light Training',
      targetStat: selectedStat,
      intensity: 'LIGHT',
      willpowerRequired: 10,
      hpCost: 10,
      chakraCost: 5,
      statGain: 1,
    },
    {
      id: 'intense_training',
      name: 'Intense Training',
      targetStat: selectedStat,
      intensity: 'INTENSE',
      willpowerRequired: 20 + Math.floor(floor * 0.2),
      hpCost: 25,
      chakraCost: 15,
      statGain: 2,
    },
  ];
}

/**
 * Generate a trial definition for a floor
 */
function generateTrialDefinition(floor: number): TrialDefinition {
  const trialTypes = [
    { type: 'ENDURANCE' as const, stat: PrimaryStat.WILLPOWER },
    { type: 'PRECISION' as const, stat: PrimaryStat.ACCURACY },
    { type: 'SPEED' as const, stat: PrimaryStat.SPEED },
    { type: 'WISDOM' as const, stat: PrimaryStat.INTELLIGENCE },
  ];

  const selected = trialTypes[Math.floor(Math.random() * trialTypes.length)];

  return {
    id: `trial_${selected.type.toLowerCase()}`,
    name: `Trial of ${selected.type}`,
    description: `Test your ${selected.stat}. Overcome this challenge for a reward.`,
    challengeType: selected.type,
    primaryStat: selected.stat,
    threshold: 15 + Math.floor(floor * 0.4),
    passReward: {
      exp: 50 + floor * 5,
      statBonus: { [selected.stat.toLowerCase()]: 2 },
    },
    failPenalty: {
      hpLoss: 15 + Math.floor(floor * 0.3),
    },
  };
}

// ============================================================================
// FLOOR STATE MODIFICATION
// ============================================================================

/**
 * Move player to a node, marking it as visited
 */
export function moveToNode(layout: FloorLayout, nodeId: string): FloorLayout {
  const updatedNodes = layout.nodes.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        isVisited: true,
        isRevealed: true,
        visibility: 'VISIBLE' as NodeVisibility,
      };
    }
    return node;
  });

  return {
    ...layout,
    nodes: updatedNodes,
  };
}

/**
 * Mark a node as cleared (combat won, event resolved, etc.)
 */
export function clearNode(layout: FloorLayout, nodeId: string): FloorLayout {
  const updatedNodes = layout.nodes.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        isCleared: true,
      };
    }
    return node;
  });

  return {
    ...layout,
    nodes: updatedNodes,
  };
}

/**
 * Reveal a hidden node
 */
export function revealNode(layout: FloorLayout, nodeId: string): FloorLayout {
  const updatedNodes = layout.nodes.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        visibility: 'VISIBLE' as NodeVisibility,
        isRevealed: true,
      };
    }
    return node;
  });

  return {
    ...layout,
    nodes: updatedNodes,
  };
}

/**
 * Get current node
 */
export function getCurrentNode(layout: FloorLayout, nodeId: string): ExplorationNode | undefined {
  return layout.nodes.find(n => n.id === nodeId);
}

/**
 * Get adjacent nodes (connected to current)
 */
export function getAdjacentNodes(layout: FloorLayout, nodeId: string): ExplorationNode[] {
  const currentNode = layout.nodes.find(n => n.id === nodeId);
  if (!currentNode) return [];

  return layout.nodes.filter(n => currentNode.connections.includes(n.id));
}

/**
 * Check if a node is adjacent to current
 */
export function isNodeAdjacent(layout: FloorLayout, currentNodeId: string, targetNodeId: string): boolean {
  const currentNode = layout.nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return false;

  return currentNode.connections.includes(targetNodeId);
}
