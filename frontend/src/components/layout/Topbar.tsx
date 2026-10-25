import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, user, onLogout }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-app-bg border-b border-app-border relative z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-content-secondary hover:text-content-primary rounded-lg hover:bg-app-elevated transition-colors"
        >
          <Menu size={20} />
        </button>
        
        {/* Placeholder Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-content-secondary">Secure Ledger</span>
          <span className="text-content-secondary">/</span>
          <span className="font-medium text-content-primary capitalize">
            {window.location.pathname.replace('/', '') || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-content-primary">{user.name}</span>
              <span className="text-xs text-content-secondary">{user.email}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-app-elevated border border-app-border flex items-center justify-center text-primary-highlight">
              <User size={18} />
            </div>
          </div>
        )}
        <div className="w-px h-6 bg-app-border mx-2"></div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-medium text-content-secondary hover:text-status-critical transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};