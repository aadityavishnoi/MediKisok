import type { ReactNode } from 'react';

export interface KioskLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

/** Full-screen, high-contrast, minimal-clutter shell shared by every kiosk screen. */
export function KioskLayout({ children, footer }: KioskLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">{children}</div>
      </main>
      {footer && <footer className="border-t border-slate-200 bg-white px-6 py-4">{footer}</footer>}
    </div>
  );
}
