// src/components/layout/Navbar.tsx
import React from 'react';
import { Button } from '../ui/Button';

// 1. Define the props interface
interface NavbarProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

// 2. Apply the interface to the component parameters
export function Navbar({ onLoginClick, onRegisterClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* UPDATED BRANDING HERE */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold italic">S</div>
            <span className="text-2xl font-bold text-slate-800">Secure Ledger</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="primary" onClick={onRegisterClick} className="px-6 shadow-sm shadow-blue-500/20">
              Get Started
            </Button>
            <Button variant="outline" onClick={onLoginClick} className="px-6 shadow-sm">
              Log In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}