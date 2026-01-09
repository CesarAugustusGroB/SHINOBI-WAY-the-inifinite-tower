import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FeatureFlags } from '../../config/featureFlags';
import './shared.css';

type TooltipPosition = 'bottom' | 'right' | 'top' | 'left';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: TooltipPosition;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = "w-full", position: tooltipPosition = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // If tooltips are disabled, just render children without tooltip functionality
  if (!FeatureFlags.ENABLE_TOOLTIPS) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (tooltipPosition === 'right') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8
      });
    } else if (tooltipPosition === 'left') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.left - 8
      });
    } else if (tooltipPosition === 'top') {
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    } else {
      // bottom (default)
      setCoords({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
    setIsVisible(true);
  };

  // Build tooltip class based on position
  const tooltipClass = `tooltip tooltip--${tooltipPosition}`;
  const arrowClass = `tooltip__arrow tooltip__arrow--${tooltipPosition}`;

  return (
    <>
      <div
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className={tooltipClass}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
          <div className={arrowClass} />
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;