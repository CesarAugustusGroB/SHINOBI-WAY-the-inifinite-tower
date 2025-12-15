import React from 'react';

interface StatBarProps {
  current: number;
  max: number;
  label?: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  className?: string;
  showValue?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({
  current,
  max,
  label,
  color,
  className = "",
  showValue = true
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  const colorClasses = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.floor(current)} / {max}</span>}
        </div>
      )}
      <div className="w-full bg-gray-900/80 rounded-full h-3 border border-zinc-700 overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;
