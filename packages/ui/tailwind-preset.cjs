// Shared MediKiosk design-system tokens. Every app's tailwind.config.js should add
// `presets: [require('@medikiosk/ui/tailwind-preset.cjs')]` so patient-kiosk,
// doctor-dashboard, and admin-dashboard all draw from the same palette instead of each
// picking its own ad-hoc Tailwind colors.
const colors = require('tailwindcss/colors');

module.exports = {
  theme: {
    extend: {
      colors: {
        // Deep clinical blue/indigo - primary actions, brand.
        primary: colors.indigo,
        // Teal/cyan healthcare accent - secondary actions, informational.
        secondary: colors.teal,
        // Accessible green - success/confirmation only.
        success: colors.emerald,
        // Amber - caution, needs-attention (never used for critical clinical alerts).
        warning: colors.amber,
        // Red - reserved ONLY for clinically important alerts/errors, never decorative.
        danger: colors.red,
        // White/light gray backgrounds and body text.
        neutral: colors.slate,
      },
    },
  },
};
