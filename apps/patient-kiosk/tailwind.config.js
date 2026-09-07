import mediKioskPreset from '../../packages/ui/tailwind-preset.cjs';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [mediKioskPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // The kiosk ships UI text in 13 Indian languages across 9 different scripts.
      // Inter only covers Latin, so every other script needs its own Noto Sans fallback
      // - the browser picks whichever font in this stack actually has the glyph.
      fontFamily: {
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
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Headings/display text: Outfit's geometric, slightly rounded letterforms read
        // better at the large kiosk sizes headings use than the preset's Plus Jakarta
        // Sans default. Carries the same Noto Sans fallback chain as font-sans above
        // so native-script text set in font-display (e.g. language names on the
        // LanguageScreen) doesn't drop to a generic system font when Outfit/Plus
        // Jakarta Sans/Inter have no glyph for it.
        display: [
          'Outfit',
          'Plus Jakarta Sans',
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
      },
    },
  },
  plugins: [],
};
