# MediKiosk — Visual Design System & UX Standards

## 1. Visual Design Principles

Inspired by modern clinical SaaS platforms, the MediKiosk visual design system balances high information density with high readability, calm clinical color palettes, rounded visual cards, and accessible touch targets.

---

## 2. Color Palette & Semantics

- **Primary Clinical Blue**: `#1E40AF` (Deep Navy), `#3B82F6` (Vibrant Clinical Blue), `#EFF6FF` (Soft Sky Tint).
- **Surface & Background**: `#F8FAFC` (Calm Slate Background), `#FFFFFF` (Card Surfaces), `#F1F5F9` (Subtle Dividers).
- **Risk & Alert Semantics**:
  - **CRITICAL / RED FLAG**: Crimson `#DC2626`, Tint `#FEF2F2`.
  - **HIGH RISK**: Amber `#D97706`, Tint `#FFFBEB`.
  - **MODERATE / LOW**: Emerald `#059669`, Tint `#ECFDF5`.
  - **INFO / AI**: Indigo `#4F46E5`, Tint `#EEF2FF`.

---

## 3. Typography & Cards

- **Typography**: Inter / Outfit sans-serif font family.
- **Card Styling**: `rounded-2xl` corners (16px border-radius), soft shadows (`shadow-sm hover:shadow-md`), high contrast headers.
- **Touch & Accessibility Standards**:
  - **Patient Kiosk**: Minimum touch target size 56px × 56px, high-contrast text, clear visual feedback state.
  - **Doctor Dashboard**: Information-dense multi-column layout with Patient 360 drawers, source evidence chips, and sticky copilot sidebars.
