import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Account {
  _id: string;
  currency: string;
  status: string;
}

export const TransferPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);

  // Form State
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  
  // Transaction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'timeout', message: string, txId?: string } | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const response = await fetch(`${API_BASE}/api/accounts`, { headers });
        const data = await response.json();
        
        if (response.ok && data.accounts) {
          setAccounts(data.accounts);
          if (data.accounts.length > 0) {
            const firstAcc = data.accounts[0]._id;
            setFromAccount(firstAcc);
            fetchBalance(firstAcc, token);
          }
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, [API_BASE]);

  // Fetch balance when source account changes
  const fetchBalance = async (accountId: string, token: string | null) => {
    try {
      const balRes = await fetch(`${API_BASE}/api/accounts/balance/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData.balance || 0);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setFromAccount(selected);
    setBalance(null); // Clear until fetched
    fetchBalance(selected, localStorage.getItem('token'));
  };

  const handleTransfer = async () => {
    setIsProcessing(true);
    setStep(4);
    
    const idempotencyKey = crypto.randomUUID();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount: Number(amount),
          idempotencyKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Transaction failed or was rejected by the ledger engine.');
      }

      setResult({
        type: 'success',
        message: 'Transaction completed and committed to the ledger.',
        txId: data.transaction?._id
      });
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('fetch')) {
        setResult({
          type: 'timeout',
          message: 'The transaction request timed out. The backend may still be processing it. Please check your ledger history in a few minutes before retrying.'
        });
      } else {
        setResult({
          type: 'error',
          message: error.message || 'An unexpected error occurred.'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setToAccount('');
    setAmount('');
    setResult(null);
    setStep(1);
  };

  // Helper formatting for masking
  const maskId = (id: string) => `•••• ${id.slice(-4)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Transfer Money</h2>
        <p className="text-content-secondary mt-1">Move funds between accounts in four steps.</p>
      </div>

      {/* Progress Indicator matching design reference */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { num: 1, title: 'Source', desc: fromAccount ? maskId(fromAccount) : 'Select account' },
          { num: 2, title: 'Destination & amount', desc: '' },
          { num: 3, title: 'Review', desc: '' },
          { num: 4, title: 'Confirm', desc: '' }
        ].map((s) => (
          <div 
            key={s.num} 
            className={`p-4 rounded-xl border transition-colors ${
              step === s.num 
                ? 'border-primary-highlight bg-app-card' 
                : 'border-app-border bg-app-elevated opacity-70'
            }`}
          >
            <p className={`text-sm font-medium ${step === s.num ? 'text-content-primary' : 'text-content-secondary'}`}>
              {s.num} · {s.title}
            </p>
            {s.desc && step === s.num && (
              <p className="text-xs text-content-secondary mt-2 font-mono">{s.desc}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl p-6 lg:p-8 max-w-2xl">
        
        {/* COMBINED STEPS 1 & 2 (Form Entry) */}
        {step < 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Source Account Dropdown */}
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">From account</label>
              {isLoadingAccounts ? (
                <div className="flex items-center gap-3 text-content-secondary py-3">
                  <Loader2 className="animate-spin" size={18} /> Loading...
                </div>
              ) : accounts.length === 0 ? (
                <div className="bg-status-critical/10 border border-status-critical/20 p-3 rounded-lg text-status-critical text-sm">
                  No active accounts found.
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={fromAccount}
                    onChange={handleSourceChange}
                    className="w-full bg-app-elevated text-content-primary px-4 py-3 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors appearance-none cursor-pointer text-sm"
                  >
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {maskId(acc._id)} - Available {balance !== null ? `₹${balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '...'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-content-secondary">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">To account</label>
              <input 
                type="text"
                required
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                placeholder="Destination account"
                className="w-full bg-app-elevated text-content-primary px-4 py-3 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors font-mono text-sm placeholder:text-content-secondary/50 placeholder:font-sans"
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">Amount (INR)</label>
              <input 
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-app-elevated text-content-primary px-4 py-3 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors text-sm placeholder:text-content-secondary/50"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setStep(3)} 
                disabled={!fromAccount || !toAccount || !amount || Number(amount) <= 0}
                className="bg-primary-highlight text-white py-2.5 px-8 rounded-lg font-medium hover:bg-primary transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>

            <div className="pt-6 mt-6 border-t border-app-border">
              <p className="text-xs text-content-secondary leading-relaxed max-w-lg">
                Success is shown only after the backend confirms the transaction. After a timeout the app checks status or retries with the same idempotency key.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Review Transfer</h3>
            
            <div className="bg-app-elevated border border-app-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-app-border">
                <span className="text-content-secondary text-sm">Source Account</span>
                <span className="text-content-primary font-mono text-sm">{fromAccount}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-app-border">
                <span className="text-content-secondary text-sm">Destination</span>
                <span className="text-content-primary font-mono text-sm">{toAccount}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-content-secondary text-sm">Amount to Send</span>
                <span className="text-3xl font-bold text-content-primary">₹{Number(amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(2)} 
                className="text-content-secondary hover:text-content-primary py-2.5 px-4 font-medium transition-colors text-sm"
              >
                Back
              </button>
              <button 
                onClick={handleTransfer}
                className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors text-sm"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PROCESSING & RESULT */}
        {step === 4 && (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            {isProcessing ? (
              <>
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <Loader2 className="animate-spin text-primary-highlight" size={40} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-content-primary mb-2">Executing ACID Transaction...</h3>
                <p className="text-status-pending text-sm max-w-sm">
                  Waiting for backend confirmation. This may take ~15 seconds due to ledger synchronization. Do not close this page.
                </p>
              </>
            ) : result ? (
              <>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${
                  result.type === 'success' ? 'bg-status-success/10 text-status-success' :
                  result.type === 'timeout' ? 'bg-status-pending/10 text-status-pending' :
                  'bg-status-critical/10 text-status-critical'
                }`}>
                  {result.type === 'success' ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
                </div>
                
                <h3 className="text-xl font-semibold text-content-primary mb-3">
                  {result.type === 'success' ? 'Transfer Successful' : result.type === 'timeout' ? 'Processing Timeout' : 'Transfer Failed'}
                </h3>
                
                <p className="text-content-secondary mb-6 max-w-sm text-sm">
                  {result.message}
                </p>

                {result.txId && (
                  <div className="bg-app-elevated border border-app-border px-4 py-2 rounded-lg mb-8 inline-block">
                    <span className="text-xs text-content-secondary mr-2">Ref ID:</span>
                    <span className="text-sm font-mono text-content-primary">{result.txId}</span>
                  </div>
                )}

                <button 
                  onClick={resetFlow}
                  className="bg-app-elevated border border-app-border text-content-primary py-2.5 px-6 rounded-lg font-medium hover:border-primary-highlight transition-colors text-sm"
                >
                  {result.type === 'success' ? 'Make Another Transfer' : 'Try Again'}
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};