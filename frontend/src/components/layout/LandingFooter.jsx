// src/components/layout/LandingFooter.jsx
import React from 'react';

export function LandingFooter() {
  return (
    <footer className="bg-white pt-16 pb-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600">Features</a></li>
              <li><a href="#" className="hover:text-blue-600">Security</a></li>
              <li><a href="#" className="hover:text-blue-600">Rates</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600">About</a></li>
              <li><a href="#" className="hover:text-blue-600">Careers</a></li>
              <li><a href="#" className="hover:text-blue-600">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600">Support Center</a></li>
              <li><a href="#" className="hover:text-blue-600">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600">Terms</a></li>
              <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}