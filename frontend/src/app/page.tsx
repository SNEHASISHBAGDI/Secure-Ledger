// src/app/page.tsx
import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';

// Update interface to include onRegisterClick
interface PageProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export default function Home({ onLoginClick, onRegisterClick }: PageProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />
      
      <div className="flex-grow pt-20">
        <Hero onRegisterClick={onRegisterClick} />
        <Features />
      </div>
    </div>
  );
}