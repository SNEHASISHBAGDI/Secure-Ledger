import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Wallet, ShieldCheck, Activity } from 'lucide-react';

interface Account {
  _id: string; // The UUID mapped to _id from the API
  currency: string;
  status: string;
  createdAt: string;
}

export const AccountsPage: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const fetchAccount = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        window.location.assign('/');
        return;
      }
      const response = await fetch(`${API_BASE}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.assign('/');
        return;
      }
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
            ? data.message
            : `Account service returned HTTP ${response.status}.`
        );
      }
      if (
        typeof data !== 'object' ||
        data === null ||
        !('accounts' in data) ||
        !Array.isArray(data.accounts)
      ) {
        throw new Error('Account service returned an invalid response.');
      }
      setAccount(data.accounts[0] ?? null);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      setError(error instanceof Error ? error.message : 'Unable to load your account. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        window.location.assign('/');
        return;
      }
      const response = await fetch(`${API_BASE}/api/accounts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.assign('/');
        return;
      }
      if (!response.ok) {
        const data: { message?: string } = await response.json();
        throw new Error(data.message || `Account service returned HTTP ${response.status}.`);
      }
      await fetchAccount();
    } catch (error) {
      console.error("Error creating account:", error);
      setError(error instanceof Error ? error.message : 'Unable to provision an account. Please retry.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-content-secondary">
        <Loader2 className="animate-spin mb-4 text-primary" size={32} />
        <p>Retrieving account configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-content-primary tracking-tight">Account Configuration</h2>
          <p className="text-content-secondary mt-1">Manage your operational ledger identities.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-status-critical/10 border border-status-critical/20 rounded-2xl p-6 text-status-critical">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchAccount}
            className="mt-3 font-medium underline underline-offset-2"
          >
            Retry account loading
          </button>
        </div>
      ) : !account ? (
        <div className="bg-app-card border border-app-border rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-app-elevated border border-app-border rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="text-content-secondary" size={28} />
          </div>
          <h3 className="text-xl font-semibold text-content-primary mb-3">No Operational Account</h3>
          <p className="text-content-secondary max-w-md mx-auto mb-8">
            You must provision a ledger account before executing transfers or interacting with the reconciliation center.
          </p>
          <button
            onClick={handleCreateAccount}
            disabled={isCreatingAccount}
            className="flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors mx-auto disabled:opacity-50"
          >
            {isCreatingAccount ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Provision Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-app-card border border-app-border rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
             
             <div className="flex justify-between items-start mb-8 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-app-elevated border border-app-border rounded-lg flex items-center justify-center">
                    <Wallet size={20} className="text-primary-highlight" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-content-primary">Primary Customer Account</h3>
                    <p className="text-sm text-content-secondary font-mono mt-0.5">{account._id}</p>
                  </div>
               </div>
             </div>

             <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-app-border">
                  <span className="text-sm text-content-secondary">Status</span>
                  <span className="text-sm font-medium text-status-success flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block"></span>
                    {account.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-app-border">
                  <span className="text-sm text-content-secondary">Base Currency</span>
                  <span className="text-sm font-medium text-content-primary">{account.currency}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-app-border">
                  <span className="text-sm text-content-secondary">Provisioned On</span>
                  <span className="text-sm font-medium text-content-primary">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </span>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-status-success bg-status-success/10 px-3 py-1.5 rounded-md border border-status-success/20">
                  <ShieldCheck size={14} />
                  KYC Verified
                </div>
                <div className="flex items-center gap-2 text-xs text-primary-highlight bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
                  <Activity size={14} />
                  Operational
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};