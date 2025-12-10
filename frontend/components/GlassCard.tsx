import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  isHoverable?: boolean;
  noPadding?: boolean;
}

/**
 * Updated for Luxury Vibe with Softer Edges:
 * - Rounded corners (rounded-xl)
 * - Subtle border
 */
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "", 
  isHoverable = false,
  noPadding = false
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        backdrop-blur-md
        bg-luxury-charcoal/60
        border border-glass-border
        rounded-xl
        transition-all duration-300 ease-out
        ${isHoverable ? 'hover:bg-luxury-charcoal/80 hover:border-luxury-goldDim/30 hover:shadow-lg hover:shadow-black/20 cursor-pointer group' : ''}
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
    >
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-noise"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};