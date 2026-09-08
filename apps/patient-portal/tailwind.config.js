import mediKioskPreset from '../../packages/ui/tailwind-preset.cjs';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  presets: [mediKioskPreset],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        danger: { DEFAULT: '#DC2626', bg: '#FEF2F2', 50: '#FEF2F2', 600: '#DC2626', 700: '#B91C1C' },
        warning: { DEFAULT: '#D97706', bg: '#FFFBEB', 50: '#FFFBEB', 600: '#D97706', 700: '#B45309' },
        success: { DEFAULT: '#059669', bg: '#ECFDF5', 50: '#ECFDF5', 600: '#059669', 700: '#047857' },
        appbg: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'ui-sans-serif'],
      },
      borderRadius: { '2xl': '16px' },
      boxShadow: { sm: '0 1px 3px rgba(15,23,42,0.06)' },
    },
  },
  plugins: [],
};
