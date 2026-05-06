// src/App.jsx
import React, { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [authMode, setAuthMode] = useState(null); // null (landing), 'login', or 'register'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setAuthMode(null);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call the backend to blacklist the token securely
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
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
      // Always clear local state regardless of backend success
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  };

  if (isChecking) return null;

  // 1. If logged in, show Dashboard
  if (isAuthenticated) {
    return <DashboardPage onLogout={handleLogout} />;
  }

  // 2. If user clicked a button, show Auth Page in correct mode
  if (authMode) {
    return (
      <LoginPage 
        onLogin={handleAuthSuccess} 
        onBack={() => setAuthMode(null)} 
        initialMode={authMode === 'login'} 
      />
    );
  }

  // 3. Default: Show Landing Page
  return (
    <LandingPage 
      onLoginClick={() => setAuthMode('login')} 
      onRegisterClick={() => setAuthMode('register')}
    />
  );
}

export default App;