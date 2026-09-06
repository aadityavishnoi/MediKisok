import type { AlertSeverity } from '@medikiosk/shared-types';

const STYLES: Record<AlertSeverity, string> = {
  LOW: 'bg-neutral-100 text-neutral-700',
  MEDIUM: 'bg-warning-100 text-warning-800',
  HIGH: 'bg-danger-100 text-danger-800',
  CRITICAL: 'bg-danger-100 text-danger-800 motion-safe:animate-pulse',
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STYLES[severity]}`}>
      ⚠ {severity}
    </span>
  );
}
