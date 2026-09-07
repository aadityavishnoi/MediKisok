import type { ReactNode } from 'react';
import type { WsConnectionState } from '@medikiosk/api-client';
import { Sidebar, type NavKey } from './Sidebar.js';
import { TopBar } from './TopBar.js';

export interface DashboardShellProps {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  alertCount: number;
  onSignOut: () => void;
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  wsState: WsConnectionState;
  doctorName: string;
  onOpenSession?: (sessionId: string) => void;
  children: ReactNode;
}

export function DashboardShell({
  active,
  onNavigate,
  alertCount,
  onSignOut,
  title,
  subtitle,
  search,
  onSearchChange,
  wsState,
  doctorName,
  onOpenSession,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar active={active} onNavigate={onNavigate} alertCount={alertCount} onSignOut={onSignOut} />
      <div className="flex-1">
        <TopBar
          title={title}
          subtitle={subtitle}
          search={search}
          onSearchChange={onSearchChange}
          wsState={wsState}
          alertCount={alertCount}
          onBellClick={() => onNavigate('alerts')}
          doctorName={doctorName}
          onOpenSession={onOpenSession}
        />
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

