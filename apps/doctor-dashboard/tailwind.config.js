import mediKioskPreset from '../../packages/ui/tailwind-preset.cjs';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [mediKioskPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
