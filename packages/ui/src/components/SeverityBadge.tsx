import type { AlertSeverity } from '@medikiosk/shared-types';

const STYLES: Record<AlertSeverity, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800 animate-pulse',
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STYLES[severity]}`}>
      ⚠ {severity}
    </span>
  );
}
