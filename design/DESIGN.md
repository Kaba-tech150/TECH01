---
name: Aegis Executive Security
colors:
  surface: '#faf8ff'
  surface-dim: '#d0d8ff'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ebedff'
  surface-container-high: '#e3e7ff'
  surface-container-highest: '#dce1ff'
  on-surface: '#00164e'
  on-surface-variant: '#3c494e'
  inverse-surface: '#00287c'
  inverse-on-surface: '#eff0ff'
  outline: '#6c797f'
  outline-variant: '#bbc9cf'
  surface-tint: '#00677f'
  primary: '#00677f'
  on-primary: '#ffffff'
  primary-container: '#00d2ff'
  on-primary-container: '#00566a'
  inverse-primary: '#47d6ff'
  secondary: '#004ad1'
  on-secondary: '#ffffff'
  secondary-container: '#1a62fe'
  on-secondary-container: '#f3f3ff'
  tertiary: '#865300'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffb14b'
  on-tertiary-container: '#714500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b6ebff'
  primary-fixed-dim: '#47d6ff'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b5c4ff'
  on-secondary-fixed: '#00164d'
  on-secondary-fixed-variant: '#003cac'
  tertiary-fixed: '#ffddb9'
  tertiary-fixed-dim: '#ffb961'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#663e00'
  background: '#faf8ff'
  on-background: '#00164e'
  surface-variant: '#dce1ff'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes an executive-grade private protection aesthetic, engineered for high-stakes physical security, asset escort, and rapid tactical dispatch. It blends uncompromising operational authority with contemporary mission-control technology. The visual direction projects absolute discretion, elite tactical competence, and sovereign reliability.

The visual style merges structured light-mode architectural surfaces with precision instrumentation. It utilizes crisp white and slate-tinted strata paired with luminous cyan optical cues, hairline luminescence on critical active panels, and burnished amber accents reserved specifically for official accreditations, certifications, and compliance clearance. Visual density is disciplined, eliminating decorative clutter in favor of tactical legibility, crisp structural dividers, and high-readability telemetry.

## Colors

The palette relies on a tactical luminance hierarchy engineered to guarantee legibility across bright daylight operations and high-visibility command centers:

- **Primary (`#00D2FF`)**: Luminescent Tech Cyan. Applied exclusively to active telemetry states, primary action focal points, real-time tracking radars, and precision line accents.
- **Secondary (`#1D63FF`)**: Deep Cobalt Command. Drives tactical action buttons, verified security perimeters, and active navigation structures.
- **Tertiary (`#F39C12`)**: Burnished Amber Accreditation. Reserved strictly for official ministerial licenses, certified operative badges, security clearance tiers, and warning alerts.
- **Neutral Palette**:
  - `Neutral Base (#F0F4FC)`: Clean light canvas serving as the root background.
  - `Neutral Slate Surface (#FFFFFF)`: Elevated structural card background providing clean contrast against the base canvas.
  - `Neutral Border Glow (`rgba(0, 210, 255, 0.18)` / `rgba(29, 99, 255, 0.3)`): Semi-luminescent stroke system framing tactical modules.
  - `Text Primary (#0A1128)`: Deep obsidian text ensuring maximum contrast without eye strain.
  - `Text Muted (#6C88E6)`: Low-priority telemetry labels, metadata, and passive readouts.

## Typography

The typographic system balances the geometric authority of **Plus Jakarta Sans** for titles, status markers, and numerical operational data, with the balanced readability of **Manrope** for narrative context, briefing debriefs, and agent activity logs.

- **Headlines & Metric Data**: Rendered in Plus Jakarta Sans with tighter tracking to deliver an authoritative, military-precision presence.
- **Labels & Micro-Badges**: Set with deliberate letter spacing (up to +0.06em) and uppercase transformation on tactical indicators (`label-xs`) to ensure instant recognition during split-second actions.
- **Body & Logs**: Manrope handles variable-length telemetry text, mission reports, and multi-line communication feeds, preserving horizontal rhythm across narrow mobile viewports.

## Layout & Spacing

The layout is anchored on an 8px spatial grid, optimized for ergonomic thumb-zone interactions and high-density surveillance views:

- **Mobile Viewport Grid**: 4-column layout with 16px (`1rem`) outer margins and 12px (`0.75rem`) internal gutters. Bottom navigation and critical emergency triggers anchor directly into persistent safe-area containers.
- **Tablet / Dispatch Grid**: 8-to-12 column fluid layout with 24px (`1.5rem`) outer margins and 16px (`1rem`) gutters, enabling split viewports between live tactical maps and operative rosters.
- **Component Rhythms**: Component gaps strictly use `space-xs` (4px) for grouped badges/chips, `space-sm` (8px) for icon-to-label pairs, `space-md` (16px) for module-internal stacking, and `space-xl` (32px) to partition distinct security sectors.

## Elevation & Depth

Depth is constructed through subtle luminance stacking and clean shadow containment:

- **Base Elevation (Level 0 - Ground Zero)**: `#F0F4FC`. Canvas background for full-screen satellite maps, live radar meshes, and root container wrappers.
- **Card & Sheet Elevation (Level 1 - Monitored Surface)**: `#FFFFFF`. Layered with a 1px solid hairline border of `rgba(0, 210, 255, 0.14)` and a delicate ambient halo: `0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 1px 0 rgba(0, 210, 255, 0.25)`.
- **Raised Interactive Modules (Level 2 - Action Nodes)**: `#FFFFFF` with a 1px border of `rgba(29, 99, 255, 0.25)`. Shadow: `0 8px 30px rgba(0, 0, 0, 0.08), 0 0 12px rgba(0, 210, 255, 0.12)`.
- **High-Alert Overlays & Modals (Level 3 - Tactical Command)**: Elevated light glassmorphism. Background `#FFFFFF` at 92% opacity with `backdrop-filter: blur(16px)` and perimeter glow `0 0 24px rgba(0, 210, 255, 0.22)`.

## Shapes

The interface embraces a calibrated architectural curvature defined by `roundedness: 2`. Corners are disciplined and controlled, avoiding hyper-casual capsule forms while eliminating severe, industrial 90-degree points:

- **Standard Elements (0.5rem / 8px)**: Input fields, tactical buttons, operative badge frames, sensor list items, and standard cards.
- **Featured Panels (1rem / 16px)**: High-level incident overview containers, map overlays, and modal dialogues.
- **Micro-Indicators (0.25rem / 4px)**: Status pips, official accreditation stamps, and live telemetry pill tags.

## Components

### Buttons
- **Primary Tactical Action**: `#1D63FF` base with `#00D2FF` top hairline highlight, white text (`#FFFFFF`), 8px border radius, 48px minimum hit target height. Subtle cyan neon bloom on hover/press.
- **Emergency Priority Action**: Deep crimson gradient (`#E53935` to `#B71C1C`) with a crisp alert glow for immediate panic or protocol override interactions.
- **Secondary / Telemetry Action**: Clean surface fill (`#FFFFFF`), 1px border of `rgba(0, 210, 255, 0.28)`, icon prefix (radar, shield, target), text in `#1D63FF`.

### Cards & Mission Panels
- Constructed on `#FFFFFF` with 8px to 12px corner radii. Equipped with an inset top-border accent of 1px `rgba(0, 210, 255, 0.35)` creating a sharp structural rim lighting effect.
- Content sections inside cards are partitioned with hairline dividers (`rgba(0, 0, 0, 0.06)`).

### Accreditations & Badges
- **Accredited Official Stamp**: Burnished amber background (`rgba(243, 156, 18, 0.12)`), 1px solid border (`#F39C12`), text `#B36B00`, accompanied by official CNAPS / security verification seal icons.
- **Operative Status Indicators**: Cyan or emerald pulsating dot radar indicators (`#00D2FF` or `#00C853`) denoting real-time GPS telemetry, patrol-in-progress, or escort assigned.

### Inputs & Verification Selectors
- Background `#FFFFFF` with 1px border of `#D0D7DE`. On active focus: border transitions to `#00D2FF` accompanied by a localized cyan ambient glow (`box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.2)`).
- Input labels rendered in `Plus Jakarta Sans` `label-md` with muted tone (`#6C88E6`).

### Tactical Lists & Surveillance Rows
- Strict, edge-to-edge light slate list elements separated by single-pixel divider lines. Left visual anchors prioritize security clearance status icons (Shield, Radar ping, Geofence node), with timestamp telemetry aligned to the right in high-visibility monospaced or tabular digits.