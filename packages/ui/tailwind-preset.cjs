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
        // Teal/cyan healthcare accent - used for secondary stats/actions across the
        // doctor dashboard (kept alongside the primary blue scale above).
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          DEFAULT: '#0D9488',
        },
        surface: '#FFFFFF',
        appbg: '#F8FAFC',
        darkbg: '#090D16',
        // Full 50-900 scales (standard Tailwind red/amber/emerald values) so every shade
        // a component reaches for actually exists - a partial custom subset here just
        // means some utility classes silently render unstyled later.
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        success: {
          DEFAULT: '#059669',
          bg: '#ECFDF5',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
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
        // Patient-facing apps ship UI text in 13 Indian languages across 9 scripts;
        // Inter only covers Latin, so every other script needs its own Noto Sans
        // fallback here as the shared default (patient-kiosk also sets this locally).
        sans: [
          'Inter',
          'Noto Sans Devanagari',
          'Noto Sans Bengali',
          'Noto Sans Tamil',
          'Noto Sans Telugu',
          'Noto Sans Gujarati',
          'Noto Sans Kannada',
          'Noto Sans Malayalam',
          'Noto Sans Gurmukhi',
          'Noto Sans Oriya',
          'Noto Sans Arabic',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
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
