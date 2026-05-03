// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`)', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Save token and user details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Trigger the App.jsx state update to show the Dashboard
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans text-gray-800 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-md text-white flex items-center justify-center font-bold text-xl mb-4">
            S
          </div>
          <h2 className="text-2xl font-bold text-blue-950">Secure Ledger Portal</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to access your accounts</p>
        </div>

        {error && (
          <div className="bg-rose-100 text-rose-800 p-3 rounded-md mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            className={`w-full text-white font-medium py-3 px-4 rounded-md transition flex items-center justify-center space-x-2 mt-2 ${isProcessing ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#2a68d4] hover:bg-blue-700'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          Backend Ledger Service | Immutable Transaction Engine
        </div>
      </div>
    </div>
  );
}