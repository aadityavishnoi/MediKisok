import React, { useState } from 'react';
import {
  Home,
  FileText,
  Calendar,
  Pill,
  Bell,
  User,
  AlertTriangle,
  PhoneCall,
  Activity,
  ShieldCheck,
  X,
  Radio,
} from 'lucide-react';

export type MobileTab = 'home' | 'records' | 'appointments' | 'prescriptions' | 'notifications' | 'profile';

interface MobileAppShellProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  unreadCount: number;
  userName?: string;
  uhid?: string;
  isOnline?: boolean;
  onSosTrigger: () => void;
  children: React.ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  activeTab,
  onSelectTab,
  unreadCount,
  userName,
  uhid,
  isOnline = true,
  onSosTrigger,
  children,
}) => {
  const [showSosModal, setShowSosModal] = useState(false);

  const tabs: { id: MobileTab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'appointments', label: 'Slots', icon: Calendar },
    { id: 'prescriptions', label: 'Rx Meds', icon: Pill },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 max-w-md mx-auto relative shadow-2xl border-x border-slate-800/60 overflow-x-hidden">
      {/* Native-style Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-bold text-sm text-white tracking-wide">MediKiosk</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                  APP
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{userName ? `Hi, ${userName.split(' ')[0]}` : 'Patient Portal'}</span>
                {uhid && <span className="text-slate-500">| #{uhid}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick SOS button in header */}
            <button
              onClick={() => setShowSosModal(true)}
              className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center space-x-1 hover:bg-red-500/25 active:scale-95 transition-all"
              title="Emergency Hospital SOS"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span>SOS</span>
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => onSelectTab('notifications')}
              className={`relative p-2 rounded-xl transition-all ${
                activeTab === 'notifications'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 px-3 pt-3 overflow-y-auto">{children}</main>

      {/* Floating Action SOS Bar when scrolled */}
      <div className="fixed bottom-20 right-4 z-30 pointer-events-auto">
        <button
          onClick={() => setShowSosModal(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xl shadow-red-600/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
          title="Emergency Help"
        >
          <Radio className="w-6 h-6 animate-pulse text-white" />
        </button>
      </div>

      {/* Bottom Thumb Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 max-w-md mx-auto pb-safe">
        <div className="grid grid-cols-6 h-16 items-center px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center h-full transition-all py-1 ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-1 ring-slate-900">
                      {tab.badge! > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full px-0.5">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-lg">
                <AlertTriangle className="w-6 h-6" />
                <span>Clinical Emergency SOS</span>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Immediate distress broadcast to hospital emergency desk and registered kin.
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="tel:108"
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center space-x-2 text-sm shadow-lg shadow-red-600/30"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Ambulance (108)</span>
              </a>

              <button
                onClick={() => {
                  onSosTrigger();
                  setShowSosModal(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-red-500/30 hover:bg-slate-700 text-red-300 font-semibold flex items-center justify-center space-x-2 text-sm"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Send Hospital Triage Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
