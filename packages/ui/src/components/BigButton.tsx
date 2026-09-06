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
    primary: 'bg-primary-700 text-white hover:bg-primary-800 focus-visible:outline-primary-900',
    secondary: 'bg-white text-primary-900 border-4 border-primary-700 hover:bg-primary-50 focus-visible:outline-primary-900',
    danger: 'bg-danger-700 text-white hover:bg-danger-800 focus-visible:outline-danger-900',
  };

  return (
    <button
      className={`min-h-[72px] w-full rounded-2xl px-8 py-5 text-2xl font-semibold shadow-md transition-all duration-150 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
