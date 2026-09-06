import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * The kiosk's default interactive control: large touch target, high contrast, readable
 * at arm's length - built for elderly/low-literacy/first-time users, not a dense admin UI.
 */
export function BigButton({ children, variant = 'primary', className = '', ...rest }: BigButtonProps) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-900',
    secondary: 'bg-white text-blue-900 border-4 border-blue-700 hover:bg-blue-50 focus-visible:outline-blue-900',
    danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-900',
  };

  return (
    <button
      className={`min-h-[72px] w-full rounded-2xl px-8 py-5 text-2xl font-semibold shadow-md transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
