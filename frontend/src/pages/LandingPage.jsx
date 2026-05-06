// src/pages/LandingPage.jsx
import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { LandingFooter } from '../components/layout/LandingFooter';

export default function LandingPage({ onLoginClick, onRegisterClick }) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />
      
      <div className="flex-grow pt-20">
        <Hero onRegisterClick={onRegisterClick} />
        <Features />
      </div>

      <LandingFooter />
    </div>
  );
}