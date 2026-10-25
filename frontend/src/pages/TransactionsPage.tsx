import { useState, useEffect } from 'react';
import { Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface ActivityEntry {
  _id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transaction?: string;
  createdAt: string;
}

export function TransactionsPage() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const accRes = await fetch(`${API_BASE}/api/accounts`, { headers });
        const accData = await accRes.json();

        if (accRes.ok && accData.accounts?.length > 0) {
          const accountId = accData.accounts[0]._id;

          const actRes = await fetch(`${API_BASE}/api/accounts/activity/${accountId}`, { headers });
          if (actRes.ok) {
            const actData = await actRes.json();
            setActivity(actData.activity || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch transaction history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [API_BASE]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-content-primary tracking-tight">Transaction History</h2>
          <p className="text-content-secondary mt-1">Review your complete ledger entry log.</p>
        </div>
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-content-secondary">
            <Loader2 className="animate-spin mb-4 text-primary" size={32} />
            <p>Loading ledger entries...</p>
          </div>
        ) : activity.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-app-elevated border border-app-border rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpRight className="text-content-secondary" size={24} />
            </div>
            <h3 className="text-lg font-medium text-content-primary mb-2">No Transactions Yet</h3>
            <p className="text-content-secondary max-w-sm">
              Your ledger is empty. Provision funds or receive a transfer to see activity here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-app-border bg-app-bg/50">
                  <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider w-1/4">Direction</th>
                  <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider w-1/4">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider w-1/4">Transaction ID (Ref)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider text-right w-1/4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {activity.map((entry) => (
                  <tr key={entry._id} className="hover:bg-app-elevated/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          entry.type === 'CREDIT' ? 'bg-status-success/10 text-status-success' : 'bg-app-elevated text-content-primary'
                        }`}>
                          {entry.type === 'CREDIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
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
                      <span className="text-sm font-mono text-content-secondary bg-app-bg px-2.5 py-1 rounded border border-app-border">
                        {entry.transaction || entry._id}
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
          </div>
        )}
      </div>
    </div>
  );
}