import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  if (!text) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-[--color-text-heading] text-[--color-background-body] text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-lg border border-[--color-text-muted]" role="tooltip">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[--color-text-heading]"></div>
      </div>
    </div>
  );
};