---
name: SecuGuard Enterprise
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an elite, authoritative visual identity tailored for high-stakes enterprise security platforms. The brand personality is uncompromising, vigilant, and precise, evoking absolute reliability and immediate situational awareness. 

The aesthetic style merges **Minimalism** with high-contrast structural data density, optimized for continuous monitoring environments where cognitive load must be minimized and critical anomalies must stand out instantly.

## Colors

The color palette is anchored by clean light backgrounds, layered slate gray structural containers, and high-visibility amber accents. High contrast ratios ensure readability under varying operational conditions.

- **Primary (`#0F172A`):** Deep navy base canvas, providing a commanding and readable light mode operational environment.
- **Secondary (`#334155`):** Slate gray used for container fills, inactive states, and structural borders.
- **Accent (`#F59E0B`):** Radiant amber reserved strictly for critical alerts, active state indicators, and security badges.
- **Neutrals (`#F8FAFC` to `#0F172A`):** Crisp dark text for primary typography, transitioning through high-legibility slate scales for secondary text and disabled elements.

## Typography

The typographical hierarchy pairs **Hanken Grotesk** for razor-sharp, geometric headlines and security badges with **Plus Jakarta Sans** for soft-rounded, highly readable body text. This combination projects elite precision while reducing eye fatigue during extended monitoring sessions.

## Layout & Spacing

The layout relies on a rigid 12-column fluid grid system optimized for dense operational dashboards, security feeds, and telemetry panels. 

- **Gutters & Margins:** Generous 1.5rem gutters separate dashboard widgets, while 2rem outer canvas margins ensure clear framing on desktop displays.
- **Responsive Behavior:** On tablet and mobile viewports, the grid collapses gracefully into a single-column stacked feed, prioritizing critical threat logs at the top of the viewport.

## Elevation & Depth

Depth is conveyed through **low-contrast outlines and tonal layering** rather than heavy drop shadows, maintaining a sleek, modern enterprise interface. 

- **Surface Tiers:** Use clean light backgrounds for the foundational canvas, elevated containers in soft slate tones, and interactive floating panels for clear visual hierarchy.
- **Borders:** Subtle ghost borders delineate card boundaries, while active state components are accented with thin amber strokes (`#F59E0B`).

## Shapes

The shape language employs a balanced **roundedness value of 2** (0.5rem base radius, 1rem for large cards). This softens the starkness of high-security data displays without sacrificing professional authority, creating approachable yet secure interactive touchpoints.

## Components

- **Buttons:** Primary action buttons feature solid amber (`#F59E0B`) backgrounds with dark navy text for maximum conversion and noticeability. Secondary actions use transparent fills with slate borders and crisp text.
- **Chips & Badges:** Pill-shaped metadata tags with high-contrast text. Security status indicators flash or display solid amber tones for active threat states.
- **Input Fields:** Clean container backgrounds with clear input text, subtle focus rings in amber, and embedded validation icons.
- **Cards:** Structured data containers featuring distinct header rows, thin slate borders, and generous internal padding (`space-lg`) to organize telemetry feeds and threat logs.
- **Checkboxes & Radios:** Precision-engineered square and circular controls with high-contrast amber selected states.