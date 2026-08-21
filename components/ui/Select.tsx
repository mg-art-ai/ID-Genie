import React from 'react';
import { SelectOption } from '../../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ options, ...props }) => {
  // Removed w-full and padding from base classes to make the component more reusable.
  const baseClasses = "bg-[--color-background-body] border border-[--color-border] rounded-md text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary-focus-ring] focus:border-[--color-primary] transition duration-200";
  return (
    <select
      {...props}
      className={`${baseClasses} ${props.className || ''}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};