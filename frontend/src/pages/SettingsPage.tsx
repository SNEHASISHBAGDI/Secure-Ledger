import React from 'react';
import { Settings, Shield, Key, Bell, CreditCard } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-content-primary tracking-tight">Preferences & Settings</h2>
        <p className="text-content-secondary mt-1">Manage your workspace configuration and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings Navigation */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-app-elevated text-primary-highlight rounded-xl border border-primary/20 text-left transition-colors">
            <Settings size={18} />
            <span className="font-medium text-sm">General</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-content-secondary hover:bg-app-elevated hover:text-content-primary rounded-xl transition-colors text-left">
            <Shield size={18} />
            <span className="font-medium text-sm">Security</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-content-secondary hover:bg-app-elevated hover:text-content-primary rounded-xl transition-colors text-left">
            <Bell size={18} />
            <span className="font-medium text-sm">Notifications</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-content-secondary hover:bg-app-elevated hover:text-content-primary rounded-xl transition-colors text-left">
            <Key size={18} />
            <span className="font-medium text-sm">API Keys</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-content-secondary hover:bg-app-elevated hover:text-content-primary rounded-xl transition-colors text-left">
            <CreditCard size={18} />
            <span className="font-medium text-sm">Billing</span>
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-app-card border border-app-border rounded-2xl p-6">
             <h3 className="text-lg font-semibold text-content-primary mb-6">Profile Settings</h3>
             <div className="space-y-5">
               <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">Display Name</label>
                  <input 
                    type="text"
                    disabled
                    placeholder="Loaded from session..."
                    className="w-full bg-app-bg text-content-secondary px-4 py-2 border border-app-border rounded-lg cursor-not-allowed opacity-70"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    disabled
                    placeholder="Loaded from session..."
                    className="w-full bg-app-bg text-content-secondary px-4 py-2 border border-app-border rounded-lg cursor-not-allowed opacity-70"
                  />
                  <p className="text-xs text-content-secondary mt-2">Email changes require administrative override.</p>
               </div>
             </div>
          </div>
          
          <div className="bg-app-card border border-app-border rounded-2xl p-6">
             <h3 className="text-lg font-semibold text-content-primary mb-6">Interface Theme</h3>
             <div className="flex gap-4">
               <button className="flex-1 bg-primary/10 border border-primary text-primary-highlight py-2 rounded-lg font-medium text-sm">
                 Dark (Active)
               </button>
               <button disabled className="flex-1 bg-app-bg border border-app-border text-content-secondary py-2 rounded-lg font-medium text-sm cursor-not-allowed opacity-50">
                 Light (Disabled)
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};