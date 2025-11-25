import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = "w-full" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.top - 8, 
      left: rect.left + rect.width / 2
    });
    setIsVisible(true);
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
          className="fixed z-50 bg-black border border-zinc-700 text-zinc-200 rounded p-3 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full min-w-[200px] max-w-[250px]"
          style={{ top: position.top, left: position.left }}
        >
          {content}
          {/* Arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black border-r border-b border-zinc-700"></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;