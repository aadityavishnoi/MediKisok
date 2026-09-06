/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3B82F6',
        },
        surface: '#FFFFFF',
        appbg: '#F8FAFC',
        darkbg: '#090D16',
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
          50: '#FFFBEB',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          800: '#92400E',
        },
        success: {
          DEFAULT: '#059669',
          bg: '#ECFDF5',
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: '#EFF6FF',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(15,23,42,0.06)',
      },
    },
  },
};
