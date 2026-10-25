import React from 'react';
import { Activity, Search, Filter } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 shrink-0">
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Audit Trail</h2>
        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-highlight border border-primary/30 uppercase">
          Preview
        </span>
      </div>
      <p className="text-content-secondary shrink-0">Inspect immutable records of operational actions and state changes.</p>

      <div className="flex-1 bg-app-card border border-app-border rounded-2xl flex flex-col overflow-hidden relative">
        
        {/* Banner Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-app-bg/80 backdrop-blur-sm text-center p-6">
          <div className="w-16 h-16 bg-primary/20 text-primary-highlight rounded-full flex items-center justify-center mb-4">
             <Activity size={28} />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-2">Audit Backend Not Available</h3>
          <p className="text-content-secondary max-w-md mx-auto">
            Audit logging writes must be controlled server-side. This interface will remain disabled until the Node.js backend implements proper audit persistence.
          </p>
        </div>

        {/* Disabled UI Background */}
        <div className="p-4 border-b border-app-border flex gap-4 bg-app-elevated opacity-30">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
            <input disabled type="text" placeholder="Search correlation IDs..." className="w-full bg-app-bg border border-app-border rounded-lg pl-10 pr-4 py-2 text-sm" />
          </div>
          <button disabled className="px-4 py-2 bg-app-bg border border-app-border rounded-lg flex items-center gap-2 text-sm">
            <Filter size={16} /> Filters
          </button>
        </div>
        <div className="flex-1 p-8 opacity-30">
          <div className="h-full border border-dashed border-app-border rounded-xl flex items-center justify-center">
            [ Audit Event Stream ]
          </div>
        </div>
      </div>
    </div>
  );
};