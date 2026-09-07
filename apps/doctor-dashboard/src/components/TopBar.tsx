import { Bell, Search } from 'lucide-react';
import type { WsConnectionState } from '@medikiosk/api-client';
import { InitialsAvatar } from './InitialsAvatar.js';
import { RfidIntakeListener } from './RfidIntakeListener.js';

const CONNECTION_DOT: Record<WsConnectionState, string> = {
  open: 'bg-success-500',
  connecting: 'bg-warning-400',
  closed: 'bg-danger-500',
};

const CONNECTION_LABEL: Record<WsConnectionState, string> = {
  open: 'Live',
  connecting: 'Connecting…',
  closed: 'Reconnecting…',
};

export interface TopBarProps {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  wsState: WsConnectionState;
  alertCount: number;
  onBellClick: () => void;
  doctorName: string;
  onOpenSession?: (sessionId: string) => void;
}

export function TopBar({
  title,
  subtitle,
  search,
  onSearchChange,
  wsState,
  alertCount,
  onBellClick,
  doctorName,
  onOpenSession,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-8 py-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">{title}</h1>
        <p className="text-xs text-neutral-400">{subtitle}</p>
      </div>

      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patients, complaints…"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-700 focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        {onOpenSession && <RfidIntakeListener onOpenSession={onOpenSession} />}

        <span className="hidden items-center gap-1.5 text-xs font-medium text-neutral-500 sm:flex">
          <span className={`h-2 w-2 rounded-full ${CONNECTION_DOT[wsState]} ${wsState !== 'open' ? 'motion-safe:animate-pulse' : ''}`} />
          {CONNECTION_LABEL[wsState]}
        </span>


        <button type="button" onClick={onBellClick} className="relative text-neutral-500 hover:text-neutral-800">
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={doctorName} size={34} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-neutral-800">{doctorName}</p>
            <p className="text-xs text-neutral-400">Physician</p>
          </div>
        </div>
      </div>
    </header>
  );
}
