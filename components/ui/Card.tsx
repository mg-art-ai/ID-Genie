
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-[--color-background-card] border border-[--color-border] rounded-xl p-6 shadow-lg transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
};