// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import BalanceCard from '../components/Dashboard/BalanceCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import TransferForm from '../components/transaction/TransferForm';
import { Loader2, PlusCircle } from 'lucide-react'; 

export default function DashboardPage({ onLogout }) {
  const [accountId, setAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [isCreatingAccount, setIsCreatingAccount] = useState(false); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // ✅ MOVED: State must be inside the component function
  const [activity, setActivity] = useState([]);

  const fetchAccount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/accounts/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (response.ok && data.accounts && data.accounts.length > 0) {
        setAccountId(data.accounts[0]._id); 
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the user's account ID when the dashboard loads
  useEffect(() => {
    fetchAccount();
  }, []);

  // ✅ NEW: Fetch Activity whenever accountId changes OR money is sent
  useEffect(() => {
    if (!accountId) return; // Don't fetch if no account exists yet

    const fetchActivity = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/accounts/activity/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setActivity(data.activity);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
    };

    fetchActivity();
  }, [accountId, refreshTrigger]); // Re-runs when these variables change

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    try {
      const response = await fetch('http://localhost:3000/api/accounts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchAccount(); 
      } else {
        console.error("Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header onLogout={onLogout} />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            
            {isLoading ? (
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center space-x-3 text-gray-500">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading account details...</span>
              </div>
            ) : accountId ? (
              <BalanceCard accountId={accountId} refreshTrigger={refreshTrigger} />
            ) : (
              <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
                <p className="text-gray-600">You don't have an active bank account yet.</p>
                <button 
                  onClick={handleCreateAccount}
                  disabled={isCreatingAccount}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition flex items-center justify-center space-x-2 mx-auto disabled:bg-blue-400"
                >
                  {isCreatingAccount ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <PlusCircle size={18} />
                  )}
                  <span>Create Account</span>
                </button>
              </div>
            )}
            
            {/* ✅ FIXED: Pass the fetched activity array to the component */}
            <RecentActivity activities={activity} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <h2 className="text-xl font-normal text-gray-700 mb-4">Create Transaction</h2>
            {accountId ? (
              <TransferForm 
                fromAccountId={accountId} 
                onTransactionSuccess={handleTransactionSuccess} 
              />
            ) : (
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-center">
                Please create an account first to initiate transfers.
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}