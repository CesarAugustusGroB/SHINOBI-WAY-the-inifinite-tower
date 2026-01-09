import React from 'react';
import './shared.css';

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

  const colorToModifier: Record<string, string> = {
    red: 'stat-bar__fill--hp',
    blue: 'stat-bar__fill--chakra',
    green: 'stat-bar__fill--xp',
    yellow: 'stat-bar__fill--yellow'
  };

  return (
    <div className={`stat-bar ${className}`}>
      {(label || showValue) && (
        <div className="stat-bar__header">
          {label && <span className="stat-bar__label">{label}</span>}
          {showValue && <span className="stat-bar__value">{Math.floor(current)} / {max}</span>}
        </div>
      )}
      <div className="stat-bar__track">
        <div
          className={`stat-bar__fill ${colorToModifier[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default StatBar;
