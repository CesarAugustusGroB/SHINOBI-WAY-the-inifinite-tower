import React, { useEffect, memo } from 'react';

export type FloatingTextType = 'damage' | 'crit' | 'heal' | 'miss' | 'block' | 'status' | 'chakra';

export interface FloatingTextItem {
  id: string;
  text: string;
  type: FloatingTextType;
  position: { x: number; y: number };
}

interface FloatingTextProps {
  id: string;
  value: string;
  type: FloatingTextType;
  position: { x: number; y: number };
  onComplete: (id: string) => void;
}

const FloatingText: React.FC<FloatingTextProps> = memo(({ id, value, type, position, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, 1200);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  const getTypeStyles = (): string => {
    switch (type) {
      case 'damage':
        return 'text-red-500 text-xl font-bold floating-text';
      case 'crit':
        return 'text-orange-400 text-3xl font-black floating-text-crit';
      case 'heal':
        return 'text-green-400 text-xl font-bold floating-text';
      case 'miss':
        return 'text-zinc-400 text-lg italic floating-text-fade';
      case 'block':
        return 'text-blue-400 text-lg font-bold floating-text';
      case 'status':
        return 'text-purple-400 text-sm font-semibold floating-text';
      case 'chakra':
        return 'text-cyan-400 text-lg font-bold floating-text';
      default:
        return 'text-white text-lg floating-text';
    }
  };

  const getPrefix = (): string => {
    switch (type) {
      case 'heal':
        return '+';
      case 'chakra':
        return '-';
      case 'block':
        return '🛡️ ';
      case 'miss':
        return '';
      default:
        return '';
    }
  };

  const getSuffix = (): string => {
    switch (type) {
      case 'crit':
        return '!';
      default:
        return '';
    }
  };

  return (
    <div
      className={`fixed pointer-events-none z-50 ${getTypeStyles()}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
      }}
    >
      {getPrefix()}{value}{getSuffix()}
    </div>
  );
});

FloatingText.displayName = 'FloatingText';

export default FloatingText;
