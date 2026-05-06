// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onLogin, onBack, initialMode = true }) {
  const [isLoginMode, setIsLoginMode] = useState(initialMode); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    if (!isLoginMode && password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setIsProcessing(false);
      return;
    }

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const bodyData = isLoginMode ? { email, password } : { name, email, password };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please check your details.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin();

    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans text-gray-800 p-4 relative bg-[#f8f9fa]">
      
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        
        {/* SECURE LEDGER BRANDING UPDATED HERE */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg text-white flex items-center justify-center font-bold text-xl mb-4 italic">
            S
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Secure Ledger Portal</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLoginMode ? 'Sign in to access your accounts' : 'Create an account to get started'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-100 text-rose-800 p-3 rounded-md mb-6 text-sm font-medium text-center border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isProcessing}
            className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 mt-2 ${
              isProcessing
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{isLoginMode ? 'Authenticating...' : 'Registering...'}</span>
              </>
            ) : (
              <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={toggleMode}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLoginMode ? 'Register here' : 'Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
}