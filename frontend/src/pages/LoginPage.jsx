import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirm password
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    // Form validation for registration
    if (!isLoginMode && password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setIsProcessing(false);
      return;
    }

    // Determine the endpoint and payload based on the current mode
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const bodyData = isLoginMode ? { email, password } : { name, email, password };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}${endpoint}`,
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

      // Save token + user
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
    setError(null); // Clear errors when switching modes
    setPassword(''); // Clear passwords for security
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans text-gray-800 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-md text-white flex items-center justify-center font-bold text-xl mb-4">
            S
          </div>
          <h2 className="text-2xl font-bold text-blue-950">Secure Ledger Portal</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLoginMode ? 'Sign in to access your accounts' : 'Create an account to get started'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-100 text-rose-800 p-3 rounded-md mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Only show the Name field if we are registering */}
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
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

          {/* Only show Confirm Password if we are registering */}
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isProcessing}
            className={`w-full text-white font-medium py-3 px-4 rounded-md transition flex items-center justify-center space-x-2 mt-2 ${
              isProcessing
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-[#2a68d4] hover:bg-blue-700'
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

        {/* Toggle between Login and Register modes */}
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

        <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-100 pt-4">
          Backend Ledger Service | Immutable Transaction Engine
        </div>
      </div>
    </div>
  );
}