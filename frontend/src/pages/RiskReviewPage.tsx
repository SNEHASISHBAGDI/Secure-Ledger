import React from 'react';
import { ShieldAlert, Shield, AlertOctagon } from 'lucide-react';

export const RiskReviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Risk Review</h2>
        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-highlight border border-primary/30 uppercase">
          Preview
        </span>
      </div>
      <p className="text-content-secondary">Inspect and action transactions flagged by deterministic rules.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-app-card border border-app-border rounded-xl p-5">
           <div className="flex items-center gap-2 mb-2">
             <AlertOctagon size={16} className="text-status-critical" />
             <span className="text-sm font-medium text-content-secondary">High Risk Cases</span>
           </div>
           <p className="text-3xl font-bold text-content-primary opacity-50">--</p>
        </div>
        <div className="bg-app-card border border-app-border rounded-xl p-5">
           <div className="flex items-center gap-2 mb-2">
             <ShieldAlert size={16} className="text-status-pending" />
             <span className="text-sm font-medium text-content-secondary">Needs Review</span>
           </div>
           <p className="text-3xl font-bold text-content-primary opacity-50">--</p>
        </div>
        <div className="bg-app-card border border-app-border rounded-xl p-5">
           <div className="flex items-center gap-2 mb-2">
             <Shield size={16} className="text-status-success" />
             <span className="text-sm font-medium text-content-secondary">Cleared Today</span>
           </div>
           <p className="text-3xl font-bold text-content-primary opacity-50">--</p>
        </div>
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl p-12 text-center mt-8">
         <h3 className="text-lg font-medium text-content-primary mb-2">Rule Engine Disconnected</h3>
         <p className="text-content-secondary max-w-lg mx-auto mb-6 text-sm leading-relaxed">
           Risk scoring and case assignment cannot proceed. The backend currently executes transactions immediately and does not possess a risk-flagging queue or authorization state machine. Reviewer actions are disabled.
         </p>
         <div className="flex justify-center gap-4">
           <button disabled className="px-4 py-2 bg-status-success/10 text-status-success rounded-lg font-medium text-sm border border-status-success/20 cursor-not-allowed opacity-50">Approve Selected</button>
           <button disabled className="px-4 py-2 bg-status-critical/10 text-status-critical rounded-lg font-medium text-sm border border-status-critical/20 cursor-not-allowed opacity-50">Reject Selected</button>
         </div>
      </div>
    </div>
  );
};