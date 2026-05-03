// src/components/layout/Header.jsx
import React from 'react';

export default function Header({ onLogout }) {
  // Retrieve user info saved during login
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Create initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-sm text-white flex items-center justify-center font-bold text-xs">S</div>
          <h1 className="text-xl font-bold text-blue-950">Secure Ledger Portal</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-sm text-gray-600 hidden sm:inline">
              Welcome, <strong>{user.name}</strong>
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
            {getInitials(user?.name)}
          </div>
          <button 
            onClick={onLogout}
            className="border border-gray-300 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}