import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, AlertCircle, Send, AlertTriangle } from 'lucide-react';

interface Account {
  _id: string;
  currency: string;
  status: string;
}

interface AccountFetchError {
  type: 'forbidden' | 'network' | 'server' | 'invalid-response';
  message: string;
}

interface PendingTransferAttempt {
  idempotencyKey: string;
  fromAccount: string;
  toAccount: string;
  amount: string;
}

const pendingTransferStorageKey = 'secure-ledger.pending-transfer';

function readPendingTransferAttempt(): PendingTransferAttempt | null {
  try {
    const storedAttempt = window.sessionStorage.getItem(pendingTransferStorageKey);
    if (!storedAttempt) return null;

    const attempt: unknown = JSON.parse(storedAttempt);
    if (
      typeof attempt === 'object' &&
      attempt !== null &&
      'idempotencyKey' in attempt &&
      typeof attempt.idempotencyKey === 'string' &&
      'fromAccount' in attempt &&
      typeof attempt.fromAccount === 'string' &&
      'toAccount' in attempt &&
      typeof attempt.toAccount === 'string' &&
      'amount' in attempt &&
      typeof attempt.amount === 'string'
    ) {
      return {
        idempotencyKey: attempt.idempotencyKey,
        fromAccount: attempt.fromAccount,
        toAccount: attempt.toAccount,
        amount: attempt.amount
      };
    }

    console.error('Stored transfer attempt has an invalid format.');
    window.sessionStorage.removeItem(pendingTransferStorageKey);
  } catch (error) {
    console.error('Could not restore a pending transfer attempt:', error);
  }
  return null;
}

function clearPendingTransferAttempt() {
  try {
    window.sessionStorage.removeItem(pendingTransferStorageKey);
  } catch (error) {
    console.error('Could not clear the pending transfer attempt:', error);
  }
}

export const TransferPage: React.FC = () => {
  const [restoredAttempt] = useState<PendingTransferAttempt | null>(readPendingTransferAttempt);
  const [step, setStep] = useState(restoredAttempt ? 4 : 1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [fetchError, setFetchError] = useState<AccountFetchError | null>(null);
  const [accountLoadAttempt, setAccountLoadAttempt] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);

  const [fromAccount, setFromAccount] = useState<string>(restoredAttempt?.fromAccount ?? '');
  const [toAccount, setToAccount] = useState<string>(restoredAttempt?.toAccount ?? '');
  const [amount, setAmount] = useState<string>(restoredAttempt?.amount ?? '');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'timeout', message: string, txId?: string } | null>(
    restoredAttempt
      ? {
          type: 'timeout',
          message: 'A transfer was awaiting confirmation when this page was last open. Retry it safely with the saved request key.'
        }
      : null
  );
  const isTransferInFlight = useRef(false);
  const idempotencyKey = useRef<string | null>(restoredAttempt?.idempotencyKey ?? null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    let isCancelled = false;
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true);
      setFetchError(null);
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
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.assign('/');
            return;
          }
          if (response.status === 403) {
            setFetchError({
              type: 'forbidden',
              message: 'Your account is not authorized to view these accounts.'
            });
            return;
          }
          const errorData: unknown = await response.json().catch(() => null);
          const errorCode = typeof errorData === 'object' && errorData !== null && 'code' in errorData
            ? errorData.code
            : undefined;
          setFetchError({
            type: 'server',
            message: errorCode === 'DATABASE_ERROR'
              ? 'The database could not retrieve your accounts. Please try again later.'
              : 'The server could not retrieve your accounts. Please try again.'
          });
          return;
        }

        const data: unknown = await response.json();
        if (
          typeof data !== 'object' ||
          data === null ||
          !('accounts' in data) ||
          !Array.isArray(data.accounts) ||
          !data.accounts.every((account) =>
            typeof account === 'object' &&
            account !== null &&
            '_id' in account &&
            typeof account._id === 'string' &&
            'currency' in account &&
            typeof account.currency === 'string' &&
            'status' in account &&
            typeof account.status === 'string'
          )
        ) {
          setFetchError({
            type: 'invalid-response',
            message: 'The server returned an invalid accounts response.'
          });
          return;
        }
        if (isCancelled) return;
        const eligibleAccounts = data.accounts.filter((account) => account.status === 'ACTIVE');
        setAccounts(eligibleAccounts);
        if (eligibleAccounts.length > 0) {
          const sourceAccount = eligibleAccounts.find(
            account => account._id === restoredAttempt?.fromAccount
          ) ?? eligibleAccounts[0];
          if (!restoredAttempt) setFromAccount(sourceAccount._id);
          void fetchBalance(sourceAccount._id, token);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch accounts:", error);
        if (!isCancelled) {
          setFetchError({
            type: error instanceof TypeError ? 'network' : 'server',
            message: error instanceof TypeError
              ? 'Could not reach the account service. Check your network connection or API configuration.'
              : 'The account service returned an unexpected response. Please retry.'
          });
        }
      } finally {
        if (!isCancelled) setIsLoadingAccounts(false);
      }
    };
    void fetchAccounts();
    return () => {
      isCancelled = true;
    };
  }, [API_BASE, accountLoadAttempt, restoredAttempt]);

  const fetchBalance = async (accountId: string, token: string | null) => {
    if (!token) return;
    try {
      const balRes = await fetch(`${API_BASE}/api/accounts/balance/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (balRes.ok) {
        const balData = await balRes.json();
        const parsedBalance = Number(balData.balance);
        setBalance(Number.isFinite(parsedBalance) ? parsedBalance : 0);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setFromAccount(selected);
    setBalance(null);
    void fetchBalance(selected, localStorage.getItem('token'));
  };

  const handleTransfer = async () => {
    if (isTransferInFlight.current || isProcessing) return;
    if (
      !fromAccount ||
      !toAccount ||
      fromAccount === toAccount ||
      !/^\d{1,15}(?:\.\d{1,4})?$/.test(amount) ||
      Number(amount) <= 0
    ) {
      setResult({ type: 'error', message: 'Enter a valid source, destination, and positive amount before submitting.' });
      setStep(4);
      return;
    }

    isTransferInFlight.current = true;
    setIsProcessing(true);
    setStep(4);

    let responseReceived = false;
    let responseWasSuccessful = false;
    let pendingServerOperation = false;
    let serverFailureUnknown = false;
    let requestSent = false;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        window.location.assign('/');
        return;
      }
      const requestIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID();
      idempotencyKey.current = requestIdempotencyKey;
      window.sessionStorage.setItem(
        pendingTransferStorageKey,
        JSON.stringify({
          idempotencyKey: requestIdempotencyKey,
          fromAccount,
          toAccount,
          amount
        } satisfies PendingTransferAttempt)
      );
      requestSent = true;
      const response = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount,
          idempotencyKey: requestIdempotencyKey
        })
      });

      responseReceived = true;
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.assign('/');
        return;
      }
      responseWasSuccessful = response.ok;
      if (response.status >= 500) serverFailureUnknown = true;
      const payload: unknown = await response.json();
      let responseMessage: string | undefined;
      let transactionId: string | undefined;
      if (typeof payload === 'object' && payload !== null) {
        if ('message' in payload && typeof payload.message === 'string') {
          responseMessage = payload.message;
        }
        if (
          'transaction' in payload &&
          typeof payload.transaction === 'object' &&
          payload.transaction !== null &&
          '_id' in payload.transaction &&
          typeof payload.transaction._id === 'string'
        ) {
          transactionId = payload.transaction._id;
        }
      }

      if (!response.ok) {
        if (response.status === 409 && responseMessage?.includes('still processing')) {
          pendingServerOperation = true;
          throw new Error(responseMessage);
        }
        if (response.status === 409 && responseMessage?.includes('already exists')) {
          throw new Error("A transfer with this payload conflicts with an existing request. Please modify the transfer or review your transaction history.");
        }
        throw new Error(responseMessage || 'Transaction failed or was rejected by the ledger engine.');
      }

      if (!transactionId) {
        throw new Error('The server accepted the request but did not return a transaction record.');
      }

      setResult({
        type: 'success',
        message: responseMessage === "Transaction already processed"
          ? 'Transfer previously completed. State safely recovered.'
          : 'Transaction completed and committed to the ledger.',
        txId: transactionId
      });
      clearPendingTransferAttempt();
      idempotencyKey.current = null;
    } catch (error: unknown) {
      console.error(error);
      if (
        pendingServerOperation ||
        serverFailureUnknown ||
        (requestSent && !responseReceived) ||
        responseWasSuccessful ||
        (responseReceived && !(error instanceof Error))
      ) {
        setResult({
          type: 'timeout',
          message: pendingServerOperation
            ? 'The server reports this transfer is still processing. Retry safely with the same request key or check transaction history.'
            : 'The transfer outcome could not be confirmed. Check transaction history before retrying; a retry will reuse the same request key.'
        });
      } else {
        clearPendingTransferAttempt();
        idempotencyKey.current = null;
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
    setStep(1);
    clearPendingTransferAttempt();
    idempotencyKey.current = null;
  };

  const maskId = (id: string) => `•••• ${id.slice(-4)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Transfer Money</h2>
        <p className="text-content-secondary mt-1">Move funds between accounts safely.</p>
      </div>

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
        {step < 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">From account</label>
              {isLoadingAccounts ? (
                <div className="flex items-center gap-3 text-content-secondary py-3">
                  <Loader2 className="animate-spin" size={18} /> Loading...
                </div>
              ) : fetchError ? (
                <div className="bg-status-critical/10 border border-status-critical/20 p-3 rounded-lg text-status-critical text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-3">
                    <p>{fetchError.message}</p>
                    {(fetchError.type === 'network' || fetchError.type === 'server' || fetchError.type === 'invalid-response') && (
                      <button
                        type="button"
                        onClick={() => setAccountLoadAttempt((attempt) => attempt + 1)}
                        className="font-medium underline underline-offset-2 hover:text-content-primary"
                      >
                        Retry account loading
                      </button>
                    )}
                  </div>
                </div>
              ) : accounts.length === 0 ? (
                <div className="bg-status-pending/10 border border-status-pending/20 p-3 rounded-lg text-status-pending text-sm flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block mb-1">No active accounts found.</span>
                    <span>This was confirmed by the account service. Provision an account to make transfers.</span>
                    <a href="/accounts" className="mt-2 inline-block font-medium underline underline-offset-2 hover:text-content-primary">
                      Open account setup
                    </a>
                  </div>
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
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">To account</label>
              <input 
                type="text"
                required
                value={toAccount}
                onChange={(e) => {
                  setToAccount(e.target.value);
                }}
                placeholder="Destination account UUID"
                className="w-full bg-app-elevated text-content-primary px-4 py-3 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors font-mono text-sm placeholder:text-content-secondary/50 placeholder:font-sans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">Amount (INR)</label>
              <input 
                type="number"
                required
                min="0.0001"
                step="0.0001"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                placeholder="0.00"
                className="w-full bg-app-elevated text-content-primary px-4 py-3 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors text-sm placeholder:text-content-secondary/50"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setStep(3)} 
                disabled={
                  !fromAccount ||
                  !toAccount ||
                  fromAccount === toAccount ||
                  !/^\d{1,15}(?:\.\d{1,4})?$/.test(amount) ||
                  Number(amount) <= 0
                }
                className="bg-primary-highlight text-white py-2.5 px-8 rounded-lg font-medium hover:bg-primary transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

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
                disabled={isProcessing}
                className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors text-sm"
              >
                <Send size={18} /> Confirm & Transfer
              </button>
            </div>
          </div>
        )}

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
                  Waiting for the backend to atomically post both ledger entries. Do not submit another transfer while this one is processing.
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

                {result.type === 'timeout' ? (
                  <button
                    type="button"
                    onClick={handleTransfer}
                    disabled={isProcessing}
                    className="bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-primary-highlight transition-colors text-sm disabled:opacity-50"
                  >
                    Retry same transfer safely
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="bg-app-elevated border border-app-border text-content-primary py-2.5 px-6 rounded-lg font-medium hover:border-primary-highlight transition-colors text-sm"
                  >
                    {result.type === 'success' ? 'Make Another Transfer' : 'Start a new transfer'}
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};