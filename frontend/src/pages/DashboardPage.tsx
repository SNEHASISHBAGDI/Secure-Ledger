import React, { useState, useEffect } from 'react';
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, Send, Wallet } from 'lucide-react';

interface Account {
  _id: string; // The UUID mapped to _id from the API
  currency: string;
  status: string;
}

interface ActivityEntry {
  _id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transaction?: string;
  createdAt: string;
}

export const DashboardPage: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Account
      const accRes = await fetch(`${API_BASE}/api/accounts`, { headers });
      const accData = await accRes.json();
      
      if (accRes.ok && accData.accounts?.length > 0) {
        const activeAcc = accData.accounts[0];
        setAccount(activeAcc);

        // 2. Fetch Balance
        const balRes = await fetch(`${API_BASE}/api/accounts/balance/${activeAcc._id}`, { headers });
        if (balRes.ok) {
          const balData = await balRes.json();
          setBalance(balData.balance || 0);
        }

        // 3. Fetch Activity
        const actRes = await fetch(`${API_BASE}/api/accounts/activity/${activeAcc._id}`, { headers });
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivity(actData.activity || []);
        }
      }
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/accounts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: account?.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-content-secondary">
        <Loader2 className="animate-spin mb-4 text-primary" size={32} />
        <p>Loading workspace data...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-app-elevated border border-app-border rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-app-card rounded-full border border-app-border flex items-center justify-center mx-auto mb-6">
            <Wallet className="text-content-secondary" size={28} />
          </div>
          <h2 className="text-xl font-semibold text-content-primary mb-3">No Active Account</h2>
          <p className="text-content-secondary text-sm mb-8">
            You need to provision an operational ledger account before you can process transfers or view balances.
          </p>
          <button
            onClick={handleCreateAccount}
            disabled={isCreatingAccount}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-4 rounded-lg font-medium hover:bg-primary-highlight transition-colors disabled:opacity-50"
          >
            {isCreatingAccount ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Provision Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Section: Balance & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-app-card border border-app-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-1">
                Available Balance
              </p>
              <div className="flex items-end gap-3">
                <h2 className="text-4xl sm:text-5xl font-bold text-content-primary tracking-tight">
                  {balance !== null ? formatCurrency(balance) : '---'}
                </h2>
                <span className="text-sm text-content-secondary mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>
                  {account.status}
                </span>
              </div>
            </div>
            
            <button 
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2 text-content-secondary hover:text-content-primary hover:bg-app-elevated rounded-lg transition-colors"
              title="Sync Ledger"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 relative z-10">
             <div className="bg-app-elevated border border-app-border px-4 py-2 rounded-lg flex items-center gap-3">
               <span className="text-xs text-content-secondary">Account ID</span>
               <span className="text-sm font-mono text-content-primary bg-app-bg px-2 py-0.5 rounded">
                 {account._id.substring(0, 13)}...
               </span>
             </div>
             <p className="text-xs text-content-secondary">Derived dynamically from ledger integrity.</p>
          </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="bg-app-card border border-app-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/transfer" className="flex flex-col items-center justify-center p-4 bg-app-elevated border border-app-border rounded-xl hover:border-primary/50 transition-colors group">
                <Send size={24} className="text-content-secondary group-hover:text-primary mb-2" />
                <span className="text-sm font-medium text-content-primary">Transfer</span>
              </a>
              <a href="/accounts" className="flex flex-col items-center justify-center p-4 bg-app-elevated border border-app-border rounded-xl hover:border-primary/50 transition-colors group">
                <Wallet size={24} className="text-content-secondary group-hover:text-primary mb-2" />
                <span className="text-sm font-medium text-content-primary">Details</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Transactions */}
      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-elevated">
          <h3 className="text-sm font-medium text-content-primary">Recent Transactions</h3>
          <a href="/transactions" className="text-xs font-medium text-primary-highlight hover:text-white transition-colors">
            View All
          </a>
        </div>
        
        <div className="overflow-x-auto">
          {activity.length === 0 ? (
            <div className="p-8 text-center text-sm text-content-secondary">
              No recent ledger activity found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-app-border bg-app-bg/50">
                  <th className="px-6 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Reference ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {activity.map((entry) => (
                  <tr key={entry._id} className="hover:bg-app-elevated/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {entry.type === 'CREDIT' ? (
                          <ArrowDownLeft size={16} className="text-status-success" />
                        ) : (
                          <ArrowUpRight size={16} className="text-content-primary" />
                        )}
                        <span className={`text-sm font-medium ${entry.type === 'CREDIT' ? 'text-status-success' : 'text-content-primary'}`}>
                          {entry.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-content-primary">
                        {entry.type === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-content-secondary bg-app-bg px-2 py-1 rounded">
                        {entry.transaction ? entry.transaction.substring(0, 8) : 'N/A'}...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-content-secondary">
                        {formatDate(entry.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};