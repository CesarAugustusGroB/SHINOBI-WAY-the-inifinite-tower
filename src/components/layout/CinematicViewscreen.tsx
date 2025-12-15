import React from 'react';

interface CinematicViewscreenProps {
  image?: string;
  title?: string;
  subtitle?: string;
  overlayContent?: React.ReactNode;
  children?: React.ReactNode;
}

export const CinematicViewscreen: React.FC<CinematicViewscreenProps> = ({
  image,
  overlayContent,
  children
}) => {
  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[21/8] lg:h-[380px] bg-black border-y-2 border-zinc-800 overflow-hidden group shrink-0 shadow-2xl">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        {image ? (
          <img
            src={image}
            alt="Scene Background"
            className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-1000 transform group-hover:scale-105 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 font-mono uppercase tracking-widest">
            No Visual Data
          </div>
        )}
      </div>

      {/* FX Layer: Scanlines & CRT Texture - Extremely subtle */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.02)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_4px,6px_100%] mix-blend-overlay opacity-30"></div>

      {/* FX Layer: Vignette & Gradients for Text Readability */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-zinc-950/60 via-transparent to-zinc-950/20"></div>
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-zinc-950/50 via-transparent to-zinc-950/50"></div>

      {/* Content Overlay Layer */}
      <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between">
        {overlayContent}
      </div>

      {children}
    </div>
  );
};
