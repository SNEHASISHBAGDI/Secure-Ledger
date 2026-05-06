// src/components/sections/Features.jsx
import React from 'react';
import { Zap, ShieldCheck, PieChart } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-7 h-7 text-[#3b82f6]" />,
    title: 'Instant Transfers',
    description: 'Send money globally in seconds.',
    bgColor: 'bg-blue-50'
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-[#6366f1]" />,
    title: 'Uncompromised Security',
    description: 'Advanced multi-factor authentication and fraud protection.',
    bgColor: 'bg-indigo-50'
  },
  {
    icon: <PieChart className="w-7 h-7 text-[#8b5cf6]" />,
    title: 'Smart Insights',
    description: 'Real-time financial analytics to understand your spending.',
    bgColor: 'bg-purple-50'
  }
];

export function Features() {
  return (
    <section className="relative z-20 -mt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-start gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow"
            >
              <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${feature.bgColor}`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1.5">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}