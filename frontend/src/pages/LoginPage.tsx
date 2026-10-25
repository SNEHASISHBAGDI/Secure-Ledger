import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  initialMode?: boolean; // true = login, false = register
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, initialMode = true }) => {
  const [isLoginMode, setIsLoginMode] = useState(initialMode); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
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
    <div className="min-h-screen bg-app-bg flex flex-col md:flex-row font-sans">
      {/* Left Branding Panel (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-app-sidebar border-r border-app-border flex-col justify-center items-start p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center font-bold text-white text-xl shadow-[0_0_20px_rgba(147,51,234,0.4)]">
              S
            </div>
            <h1 className="text-2xl font-bold text-content-primary tracking-wide">SECURE LEDGER</h1>
          </div>
          
          <h2 className="text-4xl font-semibold text-content-primary leading-tight mb-6">
            Enterprise-grade financial operations platform.
          </h2>
          <p className="text-content-secondary text-lg mb-10 leading-relaxed max-w-md">
            Manage ledgers, orchestrate transfers, and conduct risk reviews seamlessly within a unified, secure ecosystem.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-content-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Immutable Ledger Records</span>
            </div>
            <div className="flex items-center gap-3 text-content-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Double-entry Transaction Core</span>
            </div>
            <div className="flex items-center gap-3 text-content-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Automated Audit Trails</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login/Register Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-app-bg">
        
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2 mb-10 w-full max-w-sm">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-white text-lg">
              S
            </div>
            <span className="font-bold text-content-primary tracking-wide text-lg">SECURE LEDGER</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-content-primary mb-2">
              {isLoginMode ? 'Sign In' : 'Create an Account'}
            </h2>
            <p className="text-content-secondary text-sm">
              {isLoginMode 
                ? 'Welcome back. Enter your credentials to access your workspace.' 
                : 'Enter your details to provision a new workspace.'}
            </p>
          </div>

          {error && (
            <div className="bg-status-critical/10 text-status-critical border border-status-critical/20 p-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">Full Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-app-elevated text-content-primary px-4 py-2.5 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors placeholder:text-content-secondary/50"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
                className="w-full bg-app-elevated text-content-primary px-4 py-2.5 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors placeholder:text-content-secondary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-app-elevated text-content-primary px-4 py-2.5 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors placeholder:text-content-secondary/50"
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">Confirm Password</label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-app-elevated text-content-primary px-4 py-2.5 border border-app-border rounded-lg focus:outline-none focus:border-primary-highlight transition-colors placeholder:text-content-secondary/50"
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isProcessing}
              className={`w-full text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 ${
                isProcessing
                  ? 'bg-primary/50 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-highlight'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{isLoginMode ? 'Authenticating...' : 'Provisioning...'}</span>
                </>
              ) : (
                <span>{isLoginMode ? 'Sign In' : 'Create Workspace'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-content-secondary">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={toggleMode}
              className="text-primary-highlight hover:text-white transition-colors font-medium"
            >
              {isLoginMode ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};