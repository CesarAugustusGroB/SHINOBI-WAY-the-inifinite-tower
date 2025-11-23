import React from 'react';

interface StatBarProps {
  current: number;
  max: number;
  label: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
}

const StatBar: React.FC<StatBarProps> = ({ current, max, label, color }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  const colorClasses = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
        <span>{label}</span>
        <span>{Math.floor(current)} / {max}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-700 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;
