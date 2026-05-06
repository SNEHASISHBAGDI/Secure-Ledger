// src/components/ui/Button.jsx
import React from 'react';

export function Button({ variant = 'primary', children, className = '', ...props }) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 py-2.5";
  
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