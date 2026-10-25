import React from 'react';
import { Search, Database, AlertCircle } from 'lucide-react';

export const LedgerExplorerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-content-primary tracking-tight">Ledger Explorer</h2>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-highlight border border-primary/30 uppercase">
              Preview
            </span>
          </div>
          <p className="text-content-secondary mt-1">Directly query and inspect raw immutable ledger entries.</p>
        </div>
        <button disabled className="bg-app-elevated border border-app-border text-content-secondary py-2 px-4 rounded-lg font-medium text-sm cursor-not-allowed">
          Export CSV
        </button>
      </div>

      <div className="bg-app-card border border-primary/20 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary-highlight shrink-0">
             <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-content-primary font-semibold mb-1">Module Under Construction</h3>
            <p className="text-content-secondary text-sm leading-relaxed">
              The Ledger Explorer requires the upcoming `GET /api/system/ledger/query` endpoint for complex filtering and pagination across all network accounts. Data shown here is a visual placeholder.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries Indexed', val: '---' },
          { label: 'Network Debit Vol', val: '---' },
          { label: 'Network Credit Vol', val: '---' },
          { label: 'Integrity Status', val: 'Unknown' },
        ].map((stat, i) => (
          <div key={i} className="bg-app-card border border-app-border rounded-xl p-5">
            <p className="text-xs text-content-secondary uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-content-primary">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden mt-6 opacity-60 pointer-events-none">
        <div className="p-4 border-b border-app-border flex gap-4 bg-app-elevated">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={16} />
            <input disabled type="text" placeholder="Search by Transaction ID or Account UUID..." className="w-full bg-app-bg border border-app-border rounded-lg pl-10 pr-4 py-2 text-sm" />
          </div>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center text-content-secondary">
          <Database size={32} className="mb-4 text-app-border" />
          <p>Explorer data grid will appear here once backend integration is complete.</p>
        </div>
      </div>
    </div>
  );
};