// src/components/sections/Hero.jsx
import React from 'react';
import { Button } from '../ui/Button';
// I've corrected the import path to be the right relative link:
import heroImg from "../../../assets/bankingpng.png";

// The : HeroProps tag is gone. The interface is gone.
export function Hero({ onRegisterClick }) {
  return (
    <section className="pt-24 pb-32 bg-gradient-to-b from-[#eef2f6] to-[#f8f9fa] overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-5xl lg:text-6xl font-bold text-[#1e293b] leading-[1.1] mb-6">
            Simple. Secure.<br />Global Banking.
          </h1>
          {/* I've updated the paragraph to use the AeroBank branding */}
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Effortlessly manage and transfer your finances worldwide with AeroBank's intuitive platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button 
              variant="primary" 
              onClick={onRegisterClick} 
              className="w-full sm:w-auto text-lg px-8 py-3.5 shadow-lg shadow-blue-500/30"
            >
              Open a Free Account
            </Button>
          </div>
        </div>
        <div className="flex-1 relative w-full max-w-2xl lg:max-w-none flex justify-center lg:justify-end">
           {/* I've corrected the image source variable to heroImg */}
           <img src={heroImg} alt="Banking App Illustration" className="w-full max-w-lg object-contain drop-shadow-2xl" />
        </div>
      </div>
    </section>
  );
}