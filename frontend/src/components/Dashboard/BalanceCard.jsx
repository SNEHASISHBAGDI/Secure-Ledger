import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function BalanceCard({ accountId, refreshTrigger }) {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/accounts/balance/${accountId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data = await response.json();

      setBalance(data.balance || 0);
      setLastSynced(new Date());

    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setError("Unable to load balance");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchBalance();
    }
  }, [accountId, refreshTrigger]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-[#2a68d4] text-white p-6">
        <p className="text-xs font-semibold tracking-wider opacity-90 mb-1 uppercase">
          Available Balance
        </p>

        <h3 className="text-4xl font-bold mb-1">
          {isLoading
            ? "..."
            : error
            ? "Error"
            : `₹ ${balance.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}`}
        </h3>

        <p className="text-sm opacity-90 mb-6">
          derived dynamically from ledger aggregation
        </p>

        <div className="flex items-end justify-between border-t border-blue-400/50 pt-4">
          <div>
            <p className="text-sm opacity-90">
              Last synced: {lastSynced.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={fetchBalance}
            className="p-1 hover:bg-blue-700 rounded transition text-white"
          >
            <RefreshCw
              size={18}
              className={isLoading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>
    </div>
  );
}