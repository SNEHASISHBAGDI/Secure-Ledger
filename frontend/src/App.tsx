import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppLayout } from './components/layout/AppLayout';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransferPage } from './pages/TransferPage';
import { SettingsPage } from './pages/SettingsPage';
import { LedgerExplorerPage } from './pages/LedgerExplorerPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { ReconciliationPage } from './pages/ReconciliationPage';
import { RiskReviewPage } from './pages/RiskReviewPage';

interface User {
  _id: string; // From the API, maps to UUID
  email: string;
  name: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Track path in state for SPA navigation
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setIsChecking(false);
  }, []);

  const handleAuthSuccess = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    setIsAuthenticated(true);
    navigate('/dashboard'); // Go to dashboard on login
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error("Error during backend logout:", error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/'); // Go back to root
    }
  };

  // Safe navigation function
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  if (isChecking) {
    return <div className="min-h-screen bg-app-bg flex items-center justify-center text-content-secondary">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleAuthSuccess} />;
  }

  return (
    <AppLayout 
      user={user} 
      onLogout={handleLogout} 
      currentPath={currentPath}
      onNavigate={navigate}
    >
      {/* Route matching simulation using state */}
      {currentPath === '/dashboard' || currentPath === '/' ? (
        <DashboardPage />
      ) : currentPath === '/accounts' ? (
        <AccountsPage />
      ) : currentPath === '/transactions' ? (
        <TransactionsPage />
      ) : currentPath === '/transfer' ? (
        <TransferPage />
      ) : currentPath === '/settings' ? (
        <SettingsPage />
      ) : currentPath === '/explorer' ? (
        <LedgerExplorerPage />
      ) : currentPath === '/audit' ? (
        <AuditTrailPage />
      ) : currentPath === '/reconciliation' ? (
        <ReconciliationPage />
      ) : currentPath === '/risk' ? (
        <RiskReviewPage />
      ) : (
         <div className="flex flex-col items-center justify-center py-20">
           <h2 className="text-2xl font-semibold text-content-primary mb-2">Page Not Found</h2>
           <button 
             onClick={() => navigate('/dashboard')}
             className="px-4 py-2 mt-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-highlight transition-colors"
           >
             Return to Dashboard
           </button>
         </div>
      )}
    </AppLayout>
  );
}