import React from 'react';
import { ExplorationNode, NodeType } from '../game/types';
import {
  Sword,
  Heart,
  MapPin,
  Crown,
  AlertTriangle,
  Zap,
  HelpCircle,
  Eye,
  Sparkles,
  GraduationCap,
  Dumbbell,
  Award,
  Gift,
  Target,
  LogIn,
  LogOut,
} from 'lucide-react';

interface NodeMarkerProps {
  node: ExplorationNode;
  isCurrent: boolean;
  isSelected: boolean;
  isAccessible: boolean;
  isVisited: boolean;
  isRevealed: boolean;
  onClick: () => void;
}

const NodeMarker: React.FC<NodeMarkerProps> = ({
  node,
  isCurrent,
  isSelected,
  isAccessible,
  isVisited,
  isRevealed,
  onClick,
}) => {
  // Compute display type at component level for consistent use
  const displayType = node.type === NodeType.MYSTERY && node.revealedType
    ? node.revealedType
    : node.type;

  // Get node icon based on type
  const getNodeIcon = (): React.ReactNode => {
    // Mystery nodes show "?" unless revealed
    if (node.type === NodeType.MYSTERY && !isVisited && !node.revealedType) {
      return <HelpCircle className="w-5 h-5" />;
    }

    switch (displayType) {
      case NodeType.START:
        return <LogIn className="w-5 h-5" />;
      case NodeType.EXIT:
        return <LogOut className="w-5 h-5" />;
      case NodeType.COMBAT:
        return <Sword className="w-5 h-5" />;
      case NodeType.ELITE:
        return <Zap className="w-5 h-5" />;
      case NodeType.BOSS:
        return <Crown className="w-5 h-5" />;
      case NodeType.REST:
        return <Heart className="w-5 h-5" />;
      case NodeType.EVENT:
        return <MapPin className="w-5 h-5" />;
      case NodeType.MYSTERY:
        return <HelpCircle className="w-5 h-5" />;
      case NodeType.HIDDEN:
        return <Eye className="w-5 h-5" />;
      case NodeType.TRAP:
        return <AlertTriangle className="w-5 h-5" />;
      case NodeType.SHRINE:
        return <Sparkles className="w-5 h-5" />;
      case NodeType.TRAINING:
        return <Dumbbell className="w-5 h-5" />;
      case NodeType.TRIAL:
        return <Award className="w-5 h-5" />;
      case NodeType.ANOMALY:
        return <Eye className="w-5 h-5" />;
      case NodeType.SENSEI:
        return <GraduationCap className="w-5 h-5" />;
      case NodeType.AMBUSH_POINT:
        return <Target className="w-5 h-5" />;
      case NodeType.CACHE:
        return <Gift className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  // Get node colors based on type and state
  const getNodeColors = (): { bg: string; border: string; text: string } => {
    // Cleared/visited nodes are dimmed
    if (node.isCleared) {
      return {
        bg: 'bg-zinc-800',
        border: 'border-zinc-600',
        text: 'text-zinc-500',
      };
    }

    switch (displayType) {
      case NodeType.START:
        return { bg: 'bg-cyan-900/50', border: 'border-cyan-500', text: 'text-cyan-400' };
      case NodeType.EXIT:
        return { bg: 'bg-emerald-900/50', border: 'border-emerald-500', text: 'text-emerald-400' };
      case NodeType.COMBAT:
        return { bg: 'bg-orange-900/50', border: 'border-orange-500', text: 'text-orange-400' };
      case NodeType.ELITE:
        return { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-400' };
      case NodeType.BOSS:
        return { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-400' };
      case NodeType.REST:
        return { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-400' };
      case NodeType.EVENT:
        return { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-400' };
      case NodeType.MYSTERY:
        return { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-400' };
      case NodeType.HIDDEN:
        return { bg: 'bg-amber-900/50', border: 'border-amber-500', text: 'text-amber-400' };
      case NodeType.TRAP:
        return { bg: 'bg-rose-900/50', border: 'border-rose-500', text: 'text-rose-400' };
      case NodeType.SHRINE:
        return { bg: 'bg-indigo-900/50', border: 'border-indigo-500', text: 'text-indigo-400' };
      case NodeType.TRAINING:
        return { bg: 'bg-teal-900/50', border: 'border-teal-500', text: 'text-teal-400' };
      case NodeType.TRIAL:
        return { bg: 'bg-fuchsia-900/50', border: 'border-fuchsia-500', text: 'text-fuchsia-400' };
      case NodeType.ANOMALY:
        return { bg: 'bg-violet-900/50', border: 'border-violet-500', text: 'text-violet-400' };
      case NodeType.SENSEI:
        return { bg: 'bg-sky-900/50', border: 'border-sky-500', text: 'text-sky-400' };
      case NodeType.AMBUSH_POINT:
        return { bg: 'bg-lime-900/50', border: 'border-lime-500', text: 'text-lime-400' };
      case NodeType.CACHE:
        return { bg: 'bg-amber-900/50', border: 'border-amber-400', text: 'text-amber-300' };
      default:
        return { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-zinc-400' };
    }
  };

  // Get node label
  const getNodeLabel = (): string => {
    if (node.type === NodeType.MYSTERY && !isVisited && !node.revealedType) {
      return '???';
    }

    return displayType.replace('_', ' ');
  };

  const colors = getNodeColors();

  // Calculate cursor style
  const getCursor = (): string => {
    if (isCurrent) return 'cursor-default';
    if (!isAccessible) return 'cursor-not-allowed';
    return 'cursor-pointer';
  };

  return (
    <button
      onClick={onClick}
      disabled={isCurrent}
      className={`
        absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2
        rounded-full border-2 transition-all duration-200
        flex items-center justify-center
        ${colors.bg} ${colors.border} ${colors.text}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''}
        ${isCurrent ? 'ring-2 ring-cyan-400 scale-110' : ''}
        ${isAccessible && !isCurrent ? 'hover:scale-110 hover:brightness-125' : ''}
        ${!isAccessible && !isCurrent ? 'opacity-50' : ''}
        ${node.isCleared ? 'opacity-60' : ''}
        ${getCursor()}
        group
      `}
      style={{
        left: `${node.position.x}%`,
        top: `${node.position.y}%`,
      }}
    >
      {/* Icon */}
      {getNodeIcon()}

      {/* Label (shown on hover) */}
      <div className="
        absolute -bottom-6 left-1/2 -translate-x-1/2
        bg-black/90 border border-zinc-700 rounded px-2 py-0.5
        text-[10px] font-mono text-zinc-300 whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none z-10
      ">
        {getNodeLabel()}
      </div>

      {/* Visited checkmark */}
      {isVisited && node.isCleared && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px]">✓</span>
        </div>
      )}

      {/* Elite/Boss pulse effect - uses displayType to handle revealed mystery nodes */}
      {(displayType === NodeType.ELITE || displayType === NodeType.BOSS) && !node.isCleared && (
        <div className={`
          absolute inset-0 rounded-full
          ${displayType === NodeType.BOSS ? 'bg-red-500' : 'bg-yellow-500'}
          animate-ping opacity-30
        `} />
      )}

      {/* Mystery shimmer effect - only for unrevealed mysteries */}
      {node.type === NodeType.MYSTERY && !node.revealedType && !isVisited && (
        <div className="absolute inset-0 rounded-full bg-purple-400 animate-pulse opacity-20" />
      )}
    </button>
  );
};

export default NodeMarker;
