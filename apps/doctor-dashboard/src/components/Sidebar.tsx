import { AlertTriangle, ClipboardCheck, FolderGit2, LayoutDashboard, LogOut, Stethoscope } from 'lucide-react';

export type NavKey = 'dashboard' | 'alerts' | 'consultation' | 'records';

export interface SidebarProps {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  alertCount: number;
  onSignOut: () => void;
}

const NAV_ITEMS: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'OPD Queue', icon: LayoutDashboard },
  { key: 'alerts', label: 'Red Flags', icon: AlertTriangle },
  { key: 'consultation', label: 'Consultations', icon: ClipboardCheck },
  { key: 'records', label: 'Patient Records', icon: FolderGit2 },
];

export function Sidebar({ active, onNavigate, alertCount, onSignOut }: SidebarProps) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Stethoscope size={18} />
        </span>
        <div>
          <p className="text-base font-bold leading-tight text-neutral-900">MediKiosk</p>
          <p className="text-[11px] leading-tight text-neutral-400">Clinical Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              active === key ? 'bg-primary-50 text-primary-800' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </span>
            {key === 'alerts' && alertCount > 0 && (
              <span className="rounded-full bg-danger-600 px-2 py-0.5 text-xs font-bold text-white">{alertCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-neutral-100 p-3">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-danger-700"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
