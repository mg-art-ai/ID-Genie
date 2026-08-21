import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, isLoading, className, ...props }) => {
  const baseClasses = "w-full flex justify-center items-center gap-2 bg-[--color-primary] hover:bg-[--color-primary-hover] disabled:bg-[--color-text-muted] disabled:opacity-60 disabled:cursor-not-allowed text-[--color-text-on-primary] font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-background-body] focus:ring-[--color-primary-focus-ring] transition-all duration-200";

  return (
    <button
      {...props}
      className={`${baseClasses} ${className || ''}`}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
};