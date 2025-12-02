import React, { useState, useMemo } from 'react';
import {
  FloorLayout,
  ExplorationNode,
  NodeType,
  Player,
  CharacterStats,
  TerrainType,
} from '../game/types';
import NodeMarker from './NodeMarker';
import NodeDetailPanel from './NodeDetailPanel';
import { getTerrain } from '../game/constants/terrain';

interface ExplorationMapProps {
  layout: FloorLayout;
  currentNodeId: string;
  player: Player;
  playerStats: CharacterStats;
  onNodeSelect: (nodeId: string) => void;
  onNodeEnter: (nodeId: string) => void;
}

const ExplorationMap: React.FC<ExplorationMapProps> = ({
  layout,
  currentNodeId,
  player,
  playerStats,
  onNodeSelect,
  onNodeEnter,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // All hooks must be called before any conditional returns (React Rules of Hooks)
  // These hooks safely handle undefined layout
  const nodes = layout?.nodes ?? [];

  // Derive visited and revealed nodes from layout
  const visitedNodes = useMemo(
    () => nodes.filter(n => n.isVisited).map(n => n.id),
    [nodes]
  );

  const revealedNodes = useMemo(
    () => nodes.filter(n => n.isRevealed).map(n => n.id),
    [nodes]
  );

  // Get the current node
  const currentNode = useMemo(
    () => nodes.find(n => n.id === currentNodeId),
    [nodes, currentNodeId]
  );

  // Get adjacent nodes from current position
  const adjacentNodeIds = useMemo(() => {
    if (!currentNode) return [];
    return currentNode.connections;
  }, [currentNode]);

  // Get selected node details
  const selectedNode = useMemo(
    () => selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null,
    [nodes, selectedNodeId]
  );

  // Guard against undefined layout - MUST be after all hooks
  if (!layout || !layout.nodes) {
    return (
      <div className="w-full max-w-6xl z-10 flex items-center justify-center h-full">
        <p className="text-zinc-500">Loading floor layout...</p>
      </div>
    );
  }

  // Check if current node is cleared (required to move to adjacent nodes)
  const isCurrentNodeCleared = currentNode?.isCleared ?? false;

  // Check if a node is accessible (adjacent to current OR is current node for boss floors)
  // Adjacent nodes are only accessible if current node is cleared
  const isNodeAccessible = (nodeId: string): boolean => {
    // Always allow accessing current node (to interact with its content)
    if (nodeId === currentNodeId) return true;
    // Adjacent nodes only accessible if current node is cleared
    if (!isCurrentNodeCleared) return false;
    return adjacentNodeIds.includes(nodeId);
  };

  // Check if a node should be visible
  const isNodeVisible = (node: ExplorationNode): boolean => {
    // Always show the current node (safety for boss floors with no connections)
    if (node.id === currentNodeId) return true;

    // Always show visited nodes
    if (node.isVisited) return true;

    // Show revealed nodes
    if (node.isRevealed) return true;

    // Hidden nodes stay hidden until discovered
    if (node.visibility === 'HIDDEN' && !node.isRevealed) return false;

    // Show adjacent nodes
    if (isNodeAccessible(node.id)) return true;

    // Show nodes connected to visited nodes (one step ahead visibility)
    for (const visitedId of visitedNodes) {
      const visitedNode = layout.nodes.find(n => n.id === visitedId);
      if (visitedNode?.connections.includes(node.id)) return true;
    }

    return false;
  };

  // Handle node click
  const handleNodeClick = (node: ExplorationNode) => {
    if (!isNodeVisible(node)) return;

    setSelectedNodeId(node.id);
    onNodeSelect(node.id);
  };

  // Handle enter node
  const handleEnterNode = () => {
    if (!selectedNode || !isNodeAccessible(selectedNode.id)) return;
    onNodeEnter(selectedNode.id);
  };

  // Get biome-based background style
  const getBiomeBackground = (): string => {
    switch (layout.arc) {
      case 'ACADEMY_ARC':
        return 'from-slate-900 via-zinc-900 to-slate-950';
      case 'WAVES_ARC':
        return 'from-slate-900 via-blue-950 to-slate-950';
      case 'EXAMS_ARC':
        return 'from-emerald-950 via-zinc-900 to-slate-950';
      case 'ROGUE_ARC':
        return 'from-slate-900 via-orange-950 to-slate-950';
      case 'WAR_ARC':
        return 'from-red-950 via-zinc-900 to-slate-950';
      default:
        return 'from-slate-900 via-zinc-900 to-slate-950';
    }
  };

  return (
    <div className="w-full max-w-6xl z-10 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getBiomeBackground()} border-b border-zinc-700 p-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-zinc-200 tracking-[0.2em]">
              FLOOR {layout.floor}
            </h2>
            <p className="text-sm text-zinc-500 font-mono">
              {layout.biome} | {layout.nodes.length} Chambers
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">
              {visitedNodes.length} / {layout.nodes.filter(n => n.visibility !== 'HIDDEN').length} Explored
            </p>
            {layout.hiddenNodeCount > 0 && (
              <p className="text-xs text-amber-500/70">
                Secrets remain hidden...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Map + Detail Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative p-4 overflow-hidden">
          {/* SVG Map Container */}
          <div className="w-full h-full relative bg-zinc-950/50 rounded-lg border border-zinc-800">
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {layout.connections.map((conn, idx) => {
                const fromNode = layout.nodes.find(n => n.id === conn.fromId);
                const toNode = layout.nodes.find(n => n.id === conn.toId);

                if (!fromNode || !toNode) return null;
                if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

                const getPathColor = () => {
                  switch (conn.difficulty) {
                    case 'SAFE': return 'stroke-green-800';
                    case 'RISKY': return 'stroke-orange-800';
                    case 'DANGEROUS': return 'stroke-red-800';
                    default: return 'stroke-zinc-700';
                  }
                };

                return (
                  <line
                    key={idx}
                    x1={`${fromNode.position.x}%`}
                    y1={`${fromNode.position.y}%`}
                    x2={`${toNode.position.x}%`}
                    y2={`${toNode.position.y}%`}
                    className={`${getPathColor()} stroke-2 opacity-60`}
                    strokeDasharray={conn.difficulty === 'DANGEROUS' ? '5,5' : undefined}
                  />
                );
              })}
            </svg>

            {/* Node Markers */}
            {layout.nodes.map(node => {
              if (!isNodeVisible(node)) return null;

              return (
                <NodeMarker
                  key={node.id}
                  node={node}
                  isCurrent={node.id === currentNodeId}
                  isSelected={node.id === selectedNodeId}
                  isAccessible={isNodeAccessible(node.id)}
                  isVisited={node.isVisited}
                  isRevealed={node.isRevealed || false}
                  onClick={() => handleNodeClick(node)}
                />
              );
            })}

            {/* Current Position Indicator */}
            {currentNode && (
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                style={{
                  left: `${currentNode.position.x}%`,
                  top: `${currentNode.position.y}%`,
                }}
              >
                <div className="w-full h-full rounded-full bg-cyan-500 animate-ping opacity-75" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-black/80 border border-zinc-700 rounded p-2 text-xs">
            <div className="flex gap-3 text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-800 rounded-full" /> Safe
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-zinc-700 rounded-full" /> Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-800 rounded-full" /> Risky
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-800 rounded-full" /> Danger
              </span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <NodeDetailPanel
          node={selectedNode || null}
          terrain={selectedNode ? getTerrain(selectedNode.terrain) : null}
          isAccessible={selectedNode ? isNodeAccessible(selectedNode.id) : false}
          isVisited={selectedNode ? selectedNode.isVisited : false}
          playerStats={playerStats}
          player={player}
          onEnter={handleEnterNode}
        />
      </div>
    </div>
  );
};

export default ExplorationMap;
