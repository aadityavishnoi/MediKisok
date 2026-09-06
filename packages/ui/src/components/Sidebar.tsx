import React, { type ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
}

export interface SidebarProps {
  brandTitle?: string;
  brandSubtitle?: string;
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({
  brandTitle = 'MediCore AI',
  brandSubtitle = 'Clinical Platform',
  items,
  activeId,
  onSelect,
}: SidebarProps) {
  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ✚
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight font-display">{brandTitle}</h1>
            <p className="text-xs text-slate-400 font-medium">{brandSubtitle}</p>
          </div>
        </div>

        {/* Nav list */}
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-base ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* App Promo Bottom Card */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-center">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-sm">
          💡
        </div>
        <h4 className="text-xs font-bold text-slate-900">AI Clinical Copilot</h4>
        <p className="text-xs text-slate-500">Every statement backed by traceable evidence.</p>
      </div>
    </aside>
  );
}
