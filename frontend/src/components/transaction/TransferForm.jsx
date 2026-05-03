import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function TransferForm({ fromAccountId, onTransactionSuccess }) {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage(null);

    // Generate a unique idempotency key for this attempt
    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await fetch('http://localhost:3000/api/transactions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assuming you store the JWT in localStorage, or rely on cookies
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          fromAccount: fromAccountId, // Passed as a prop from the Dashboard
          toAccount: toAccount,
          amount: Number(amount),
          idempotencyKey: idempotencyKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Transaction failed');
      }

      setMessage({ type: 'success', text: 'Transaction completed successfully!' });
      setToAccount('');
      setAmount('');
      
      // Trigger a balance refresh on the parent component
      if (onTransactionSuccess) onTransactionSuccess();

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Money Safely</h3>
      
      {message && (
        <div className={`p-4 rounded-md mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleTransfer}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient's Account ID</label>
          <input 
            type="text" 
            required
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="e.g. 64b9f..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input 
            type="number" 
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹ 0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {isProcessing && (
          <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-md mt-6">
            <p className="font-semibold text-sm mb-1">Executing ACID Transaction Chain...</p>
            <p className="text-xs">(Safe simulation will take 15 seconds due to backend processing)</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={isProcessing}
          className={`w-full text-white font-medium py-3 px-4 rounded-md transition flex items-center justify-center space-x-2 mt-4 ${isProcessing ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#2a68d4] hover:bg-blue-700'}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Processing... (Wait 15s)</span>
            </>
          ) : (
            <span>Send Money</span>
          )}
        </button>
      </form>
    </div>
  );
}