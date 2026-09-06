import React from 'react';

export interface TopbarProps {
  userTitle?: string;
  userSubtitle?: string;
  notificationCount?: number;
  onLogout?: () => void;
}

export function Topbar({
  userTitle = 'Dr. Rohan Mehta',
  userSubtitle = 'Cardiologist',
  notificationCount = 3,
  onLogout,
}: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Search Input */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search patients, conditions, records..."
          className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 font-mono">⌘K</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Quick Add Button */}
        <button
          type="button"
          className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-lg font-bold transition-colors"
          title="Quick Action"
        >
          +
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors"
          title="Notifications"
        >
          <span className="text-lg">🔔</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {userTitle.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{userTitle}</p>
            <p className="text-[11px] text-slate-500 font-medium">{userSubtitle}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-red-600 font-medium ml-1"
              title="Sign Out"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
