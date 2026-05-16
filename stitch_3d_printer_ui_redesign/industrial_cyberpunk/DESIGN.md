---
name: Industrial Cyberpunk
colors:
  surface: '#0d1515'
  surface-dim: '#0d1515'
  surface-bright: '#323b3b'
  surface-container-lowest: '#081010'
  surface-container-low: '#151d1d'
  surface-container: '#192121'
  surface-container-high: '#232b2c'
  surface-container-highest: '#2e3637'
  on-surface: '#dce4e4'
  on-surface-variant: '#b9caca'
  inverse-surface: '#dce4e4'
  inverse-on-surface: '#2a3232'
  outline: '#849495'
  outline-variant: '#3a494a'
  surface-tint: '#00dce5'
  primary: '#e9feff'
  on-primary: '#003739'
  primary-container: '#00f5ff'
  on-primary-container: '#006c71'
  inverse-primary: '#00696e'
  secondary: '#ffb77d'
  on-secondary: '#4d2600'
  secondary-container: '#fd8b00'
  on-secondary-container: '#603100'
  tertiary: '#fff9f0'
  on-tertiary: '#3a3000'
  tertiary-container: '#ffdb40'
  on-tertiary-container: '#736000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#63f7ff'
  primary-fixed-dim: '#00dce5'
  on-primary-fixed: '#002021'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#0d1515'
  on-background: '#dce4e4'
  surface-variant: '#2e3637'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.2'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.2'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-padding: 20px
---

## Brand & Style

The design system is engineered for high-stakes precision and technical mastery. It targets power users and professionals who require a UI that feels like an extension of the machinery they operate. The aesthetic is "Industrial Cyberpunk"—a blend of rugged utility and futuristic sophistication.

The interface prioritizes function over decoration, utilizing a dark, low-fatigue environment suitable for long hours in workshop settings. High-contrast accents provide immediate status recognition, while the structural layout emphasizes data density without sacrificing clarity. The emotional response is one of absolute control, reliability, and technical edge.

## Colors

The palette is rooted in a deep charcoal base to minimize screen glare and maximize the "glow" of data elements. 

- **Primary (Neon Cyan):** Used for active states, extruders, and "go" actions. It represents the flow of energy and progress.
- **Secondary (Safety Orange):** Reserved strictly for warnings, errors, and high-heat hazards.
- **Tertiary (Warm Yellow):** Dedicated to the print bed status and auxiliary heater components.
- **Neutrals:** A range of grays from the absolute background (#121212) to container surfaces (#1E1E1E) and structural borders (#333333). 

High-contrast white is used for primary text, while muted grays are used for secondary labels to maintain a strict visual hierarchy.

## Typography

This design system employs a dual-font strategy to distinguish between UI navigation and machine data. 

- **Inter:** Used for all standard interface elements, navigation, and settings. It provides excellent legibility at small sizes and high-contrast environments.
- **JetBrains Mono:** Used for all technical telemetry, including X/Y/Z coordinates, temperature readings, G-code terminal lines, and filament specifications. The monospaced nature ensures that jumping numbers remain vertically aligned and easy to track during rapid changes.

Weight is used aggressively to create hierarchy: Bold headers for section titles and Medium weights for interactive labels.

## Layout & Spacing

The layout follows a strict 8px grid system, ensuring mathematical alignment across all technical components. 

- **Modular Grid:** Content is organized into modular cards that can reflow based on screen width. 
- **Sidebars:** On desktop, a 280px fixed sidebar contains high-level machine status and global controls.
- **Technical Density:** Information density is high. Spacing is used to group related data (e.g., extruder settings) while narrow 16px gutters keep components physically close to reduce eye travel.
- **Responsive Reflow:** On smaller screens (tablets), the sidebar collapses into a bottom navigation bar or a hamburger menu, and technical graphs scale horizontally to maintain detail.

## Elevation & Depth

Depth in this design system is conveyed through **Tonal Layers** and **Subtle Outlines** rather than traditional shadows.

1.  **Level 0 (Base):** #121212 - The main background.
2.  **Level 1 (Card):** #1E1E1E - Containers for graphs and control groups.
3.  **Level 2 (Interaction):** #2A2A2A - Hover states and nested inputs.

**Borders:** Every card and button features a 1px border (#333333). When an element is active or focused, the border color transitions to the Primary Neon Cyan, creating a "glowing" effect without the blur of a shadow. This maintains a sharp, industrial feel.

## Shapes

The design system uses a consistent 8px (0.5rem) corner radius for most UI elements. This provides a "modern-industrial" feel—neither too sharp and aggressive nor too soft and consumer-oriented.

- **Buttons & Inputs:** 8px radius.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Terminal & Code Blocks:** 4px radius for a more rigid, technical appearance.

## Components

### Buttons
- **Primary:** Neon Cyan background with black text. Tactile feel achieved through a subtle 1px inset top border.
- **Secondary:** Ghost style with #333333 borders and white text.
- **Danger:** Safety Orange border and text for emergency stops.

### Technical Graphs
Graphs utilize "glowing" lines (Primary Cyan for nozzles, Tertiary Yellow for the bed). The grid lines are muted at 10% opacity white. Data points should have a subtle outer glow (bloom) effect to mimic high-end hardware displays.

### Data Tables
Filament presets and log files use structured tables with no vertical borders. Horizontal borders between rows use #262626. Headers use `label-caps` for a professional, metadata-heavy look.

### Terminal
The terminal utilizes a solid #000000 background within a card, featuring JetBrains Mono text. Command inputs are preceded by a `>` prompt in Primary Cyan.

### Tactile Inputs
Number inputs for temperature and coordinates feature large "+" and "-" hit areas, designed for ease of use in environments where the user might be wearing gloves or using a touch screen.