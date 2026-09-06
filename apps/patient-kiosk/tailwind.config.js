import mediKioskPreset from '../../packages/ui/tailwind-preset.cjs';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [mediKioskPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Hindi (Devanagari) content shares the kiosk UI with English, so the font stack
      // needs a Devanagari-capable fallback - Inter has no Devanagari glyphs at all.
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans Devanagari',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
