import React from 'react';
import { 
  LayoutDashboard, Wallet, ArrowRightLeft, Send, 
  Search, ShieldAlert, Activity, FileCheck, Settings, X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPath, onNavigate }) => {
  
  // Safe navigation fallback
  const handleNav = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.href = href;
    }
    if (window.innerWidth < 1024) {
       onClose();
    }
  };

  const NavItem = ({ href, icon: Icon, label, preview = false }: { href: string, icon: any, label: string, preview?: boolean }) => {
    const isActive = currentPath === href || window.location.pathname === href;
    return (
      <button 
        onClick={(e) => handleNav(href, e)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-left ${
          isActive 
            ? 'bg-app-elevated text-primary-highlight' 
            : 'text-content-secondary hover:bg-app-elevated hover:text-content-primary'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-primary-highlight' : 'text-content-secondary group-hover:text-content-primary'} />
        <span className="text-sm font-medium flex-1">{label}</span>
        {preview && (
          <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary-highlight border border-primary/20">
            PREVIEW
          </span>
        )}
      </button>
    );
  };

  const NavGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-content-secondary uppercase">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-app-sidebar border-r border-app-border transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-app-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]">
              S
            </div>
            <span className="font-bold text-content-primary tracking-wide">SECURE LEDGER</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-content-secondary hover:text-content-primary">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <NavGroup title="Overview">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/accounts" icon={Wallet} label="Accounts" />
            <NavItem href="/transactions" icon={ArrowRightLeft} label="Transactions" />
          </NavGroup>

          <NavGroup title="Payments">
            <NavItem href="/transfer" icon={Send} label="Transfer Money" />
          </NavGroup>

          <NavGroup title="Ledger">
            <NavItem href="/explorer" icon={Search} label="Ledger Explorer" preview />
          </NavGroup>

          <NavGroup title="Operations">
            <NavItem href="/audit" icon={Activity} label="Audit Trail" preview />
            <NavItem href="/reconciliation" icon={FileCheck} label="Reconciliation" preview />
            <NavItem href="/risk" icon={ShieldAlert} label="Risk Review" preview />
          </NavGroup>

          <NavGroup title="Preferences">
            <NavItem href="/settings" icon={Settings} label="Settings" />
          </NavGroup>
        </nav>
      </aside>
    </>
  );
};