import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowRight, Wallet, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface Account {
  _id: string;
  currency: string;
  status: string;
}

export const TransferPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Form State
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  
  // Transaction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'timeout', message: string, txId?: string } | null>(null);
  const isTransferInFlight = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Step 1: Fetch source accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/accounts`, { headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.accounts) {
          setAccounts(data.accounts);
          if (data.accounts.length === 1) {
            setFromAccount(data.accounts[0]._id); // Auto-select if only one
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

  const handleTransfer = async () => {
    if (isTransferInFlight.current) return;
    isTransferInFlight.current = true;
    setIsProcessing(true);
    setStep(4); // Move to processing/result step

    try {
      // Reuse this key when retrying a request whose result was not confirmed.
      const requestIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID();
      idempotencyKey.current = requestIdempotencyKey;
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount: Number(amount),
          idempotencyKey: requestIdempotencyKey
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
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof TypeError) {
        setResult({
          type: 'timeout',
          message: 'The transaction status could not be confirmed because of a network error. The backend may still be processing it. Check your ledger history before retrying.'
        });
      } else {
        setResult({
          type: 'error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred.'
        });
      }
    } finally {
      isTransferInFlight.current = false;
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setToAccount('');
    setAmount('');
    setResult(null);
    idempotencyKey.current = null;
    setStep(1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Transfer Money</h2>
        <p className="text-content-secondary mt-1">Initiate a secure, ACID-compliant ledger transfer.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-app-border z-0" />
        {[1, 2, 3, 4].map((num) => (
          <div 
            key={num} 
            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
              step === num ? 'bg-primary border-primary text-white' :
              step > num ? 'bg-primary-highlight border-primary-highlight text-white' :
              'bg-app-bg border-app-border text-content-secondary'
            }`}
          >
            {step > num && num !== 4 ? <CheckCircle size={16} /> : num}
          </div>
        ))}
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl p-8 shadow-xl">
        
        {/* STEP 1: SOURCE ACCOUNT */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-content-primary mb-4">1. Select Source Account</h3>
            {isLoadingAccounts ? (
              <div className="flex items-center gap-3 text-content-secondary">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading operational accounts...</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="bg-status-critical/10 border border-status-critical/20 p-4 rounded-xl text-status-critical">
                You do not have an active account to transfer from.
              </div>
            ) : (
              <div className="grid gap-4">
                {accounts.map(acc => (
                  <label 
                    key={acc._id} 
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                      fromAccount === acc._id
                        ? 'border-primary bg-primary/10'
                        : 'border-app-border bg-app-elevated hover:border-content-secondary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sourceAccount"
                      value={acc._id}
                      checked={fromAccount === acc._id}
                      onChange={(event) => setFromAccount(event.target.value)}
                      disabled={acc.status !== 'ACTIVE'}
                      className="sr-only"
                    />
                    <Wallet className={fromAccount === acc._id ? 'text-primary' : 'text-content-secondary'} size={24} />
                    <div className="ml-4 flex-1">
                      <p className="text-content-primary font-medium">Customer Account</p>
                      <p className="text-content-secondary text-sm font-mono mt-0.5">{acc._id}</p>
                    </div>
                    <span className="text-sm font-medium text-status-success">{acc.status}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!accounts.some((account) => account._id === fromAccount && account.status === 'ACTIVE')}
                className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-content-primary">2. Enter Destination Account</h3>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-content-secondary">Recipient account ID</span>
              <input
                type="text"
                value={toAccount}
                onChange={(event) => setToAccount(event.target.value.trim())}
                placeholder="Enter the recipient account ID"
                className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-3 text-content-primary focus:outline-none focus:border-primary"
              />
            </label>
            {toAccount === fromAccount && toAccount !== '' && (
              <p className="text-sm text-status-critical">Choose an account different from the source account.</p>
            )}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-lg border border-app-border text-content-secondary hover:text-content-primary transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!toAccount || toAccount === fromAccount}
                className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-content-primary">3. Confirm Transfer</h3>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-content-secondary">Amount</span>
              <div className="flex items-center bg-app-bg border border-app-border rounded-lg px-4 focus-within:border-primary">
                <span className="text-content-secondary">{accounts.find((account) => account._id === fromAccount)?.currency ?? 'USD'}</span>
                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent px-3 py-3 text-content-primary focus:outline-none"
                />
              </div>
            </label>
            <div className="rounded-xl border border-app-border bg-app-elevated p-4 space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-secondary">From</span>
                <span className="text-content-primary font-mono break-all">{fromAccount}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-secondary">To</span>
                <span className="text-content-primary font-mono break-all">{toAccount}</span>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-lg border border-app-border text-content-secondary hover:text-content-primary transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!/^\d{1,15}(?:\.\d{1,4})?$/.test(amount) || Number(amount) <= 0 || isProcessing}
                className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} /> Transfer
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-8 text-center space-y-5">
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin text-primary mx-auto" size={40} />
                <h3 className="text-lg font-semibold text-content-primary">Processing transfer</h3>
                <p className="text-content-secondary">Please keep this page open while the ledger confirms the transaction.</p>
              </>
            ) : result ? (
              <>
                {result.type === 'success' ? (
                  <CheckCircle className="text-status-success mx-auto" size={40} />
                ) : (
                  <AlertCircle className={result.type === 'timeout' ? 'text-amber-500 mx-auto' : 'text-status-critical mx-auto'} size={40} />
                )}
                <h3 className="text-lg font-semibold text-content-primary">
                  {result.type === 'success' ? 'Transfer complete' : result.type === 'timeout' ? 'Status not confirmed' : 'Transfer failed'}
                </h3>
                <p className="text-content-secondary">{result.message}</p>
                {result.txId && <p className="text-sm text-content-secondary font-mono">Transaction ID: {result.txId}</p>}
                <div className="flex justify-center gap-3 pt-3">
                  {result.type === 'timeout' && (
                    <button
                      type="button"
                      onClick={handleTransfer}
                      className="px-5 py-2.5 rounded-lg border border-app-border text-content-primary hover:border-primary transition-colors"
                    >
                      Retry safely
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-highlight transition-colors"
                  >
                    Start another transfer
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};