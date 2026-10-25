import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string } | null;
  onLogout: () => void;
  currentPath?: string; // Add this
  onNavigate?: (path: string) => void; // Add this
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, user, onLogout, currentPath, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        currentPath={currentPath} // Pass it down
        onNavigate={onNavigate}   // Pass it down
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar 
          user={user} 
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};