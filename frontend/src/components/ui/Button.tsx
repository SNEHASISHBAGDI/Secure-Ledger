// src/components/ui/Button.tsx
import React from 'react';

// Define the exact props this component accepts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 py-2.5";
  
  // TypeScript will now know 'variant' exactly matches one of these keys
  const variants = {
    primary: "bg-[#3b82f6] text-white hover:bg-blue-600",
    outline: "bg-white border border-gray-200 text-slate-700 hover:bg-gray-50",
    ghost: "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}