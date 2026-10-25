import React from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';

export const ReconciliationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Reconciliation Center</h2>
        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-highlight border border-primary/30 uppercase">
          Preview
        </span>
      </div>
      <p className="text-content-secondary">Compare internal PostgreSQL records against external settlement files.</p>

      <div className="bg-status-pending/10 border border-status-pending/20 rounded-2xl p-6 flex items-start gap-4">
        <AlertTriangle className="text-status-pending shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-content-primary font-medium mb-1">CSV Upload Disabled</h4>
          <p className="text-content-secondary text-sm">
            The reconciliation engine is not yet implemented on the backend. You cannot upload external reference files or execute matching rules at this time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-app-card border border-app-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] border-dashed">
           <UploadCloud size={48} className="text-content-secondary mb-4 opacity-50" />
           <h3 className="text-lg font-medium text-content-primary mb-2">Drop Settlement File Here</h3>
           <p className="text-content-secondary text-sm mb-6 text-center max-w-sm">
             Upload a CSV containing external reference transactions to run the matching algorithm.
           </p>
           <button disabled className="px-6 py-2.5 bg-app-elevated text-content-secondary font-medium rounded-lg cursor-not-allowed">
             Select File
           </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-content-primary uppercase tracking-wider text-xs mb-2">Previous Runs</h3>
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="p-4 bg-app-card border border-app-border rounded-xl opacity-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-content-primary">Run #{1042 - i}</span>
                <span className="text-xs bg-app-elevated px-2 py-0.5 rounded">Pending</span>
              </div>
              <p className="text-xs text-content-secondary font-mono">No data available.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};