import React, { useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipPosition = 'bottom' | 'right' | 'top';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: TooltipPosition;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = "w-full", position: tooltipPosition = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (tooltipPosition === 'right') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8
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

  const getTooltipClasses = () => {
    const base = "fixed z-50 bg-black border border-zinc-700 text-zinc-200 rounded p-3 shadow-2xl pointer-events-none min-w-[200px] max-w-[300px]";
    if (tooltipPosition === 'right') {
      return `${base} transform -translate-y-1/2`;
    }
    if (tooltipPosition === 'top') {
      return `${base} transform -translate-x-1/2 -translate-y-full`;
    }
    return `${base} transform -translate-x-1/2`;
  };

  const getArrowClasses = () => {
    if (tooltipPosition === 'right') {
      return "absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-black border-l border-b border-zinc-700";
    }
    if (tooltipPosition === 'top') {
      return "absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black border-r border-b border-zinc-700";
    }
    return "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-black border-l border-t border-zinc-700";
  };

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
          className={getTooltipClasses()}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
          <div className={getArrowClasses()}></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;