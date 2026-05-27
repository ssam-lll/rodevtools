---
name: Technical Analytics
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191c23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e0e2ec'
  on-surface-variant: '#bdc8d2'
  inverse-surface: '#e0e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#87929b'
  outline-variant: '#3e4850'
  surface-tint: '#85cfff'
  primary: '#85cfff'
  on-primary: '#00344c'
  primary-container: '#00aff4'
  on-primary-container: '#003f5a'
  inverse-primary: '#00658f'
  secondary: '#f5fff3'
  on-secondary: '#003919'
  secondary-container: '#34ff8d'
  on-secondary-container: '#007239'
  tertiary: '#fdbc13'
  on-tertiary: '#402d00'
  tertiary-container: '#d39b00'
  on-tertiary-container: '#4d3700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c7e7ff'
  primary-fixed-dim: '#85cfff'
  on-primary-fixed: '#001e2e'
  on-primary-fixed-variant: '#004c6c'
  secondary-fixed: '#60ff99'
  secondary-fixed-dim: '#00e479'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#fdbc13'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#10131a'
  on-background: '#e0e2ec'
  surface-variant: '#32353c'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 12px
  container-max: 1440px
---

## Brand & Style
This design system is built for high-performance data analysis and technical oversight. It targets power users, developers, and investors who require maximum information density without cognitive fatigue. The aesthetic is "Engineering-Clean"—prioritizing legibility, precision, and functional hierarchy over decorative elements.

The style draws from **Minimalism** and **Modern Corporate** influences, utilizing a strict grid and a monochromatic foundation punctuated by high-vibrancy functional accents. It evokes a sense of being "under the hood" of complex systems, providing users with the confidence that the data they see is accurate, real-time, and exhaustive.

## Colors
The palette is engineered for a "Lights-Out" terminal environment. The background uses a deep navy-black (Bunker) to minimize eye strain during long sessions. 

- **Primary Accent:** Cerulean Blue is used exclusively for interactive elements, primary call-to-actions, and active navigation states.
- **Success/Growth:** A vivid Bright Green is reserved for positive deltas, "Up" trends, and healthy system statuses.
- **Surface & Borders:** A tiered hierarchy of dark grays defines depth. Containers use a slightly lighter shade than the background, separated by razor-thin borders to maintain a flat, structured appearance.
- **Typography:** Primary text is off-white (#E2E8F0) to prevent the "halo" effect of pure white on black, while secondary metadata uses a muted slate.

## Typography
The typography strategy employs a dual-font system to separate UI controls from raw data.

1.  **Geist (Sans-Serif):** Used for structural UI components, headers, and descriptive text. Its clean, geometric nature ensures that labels remain legible even at small sizes.
2.  **JetBrains Mono (Monospace):** Used for all numerical values, financial metrics, timestamps, and table data. The fixed-width character alignment is critical for scanning columns of numbers and comparing values vertically.

**Scale:** The system uses a compact scale. Avoid large display type; focus instead on semantic hierarchy using weight and color rather than excessive size differences.

## Layout & Spacing
This design system utilizes a **Tight Fluid Grid** based on a 4px baseline. High information density is achieved by reducing standard white space in favor of logical grouping.

- **Desktop:** A 12-column grid with narrow 12px gutters. Sidebars should be fixed (240px–280px) while the main data stage remains fluid.
- **Density:** Components use "compact" padding (8px–12px) to ensure as much data as possible is visible above the fold. 
- **Alignment:** All data points in tables must be top-aligned. Numeric columns should be right-aligned to allow for decimal point tracking.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows. 

- **Level 0 (Background):** The base canvas (#161920).
- **Level 1 (Cards/Panels):** Raised surfaces (#1C202B) with a 1px solid border (#28303F).
- **Level 2 (Popovers/Tooltips):** Floating elements use a slightly lighter surface (#242936) with a subtle 4px blur shadow to distinguish them from the underlying data grid.

Avoid using heavy drop shadows. The "elevation" should feel like stacked sheets of matte metal, not floating paper.

## Shapes
The shape language is disciplined and professional. A standard radius of **4px** is applied to almost all UI elements including cards, buttons, and input fields. This provides a subtle "softness" that prevents the UI from looking dated or overly aggressive while maintaining a sharp, modern technical edge.

- **Standard Radius:** 4px (Small elements, inputs).
- **Large Radius:** 6px (Main dashboard cards).
- **Pill:** Reserved exclusively for status badges (e.g., "Active", "Beta").

## Components
Consistent component behavior is vital for a data-heavy analytics platform.

- **Data Tables:** The most important component. Use zebra striping (odd rows 3% lighter) and a highlighted hover state (#28303F). All headers must be sticky. Include a "compact" mode that reduces vertical cell padding from 12px to 6px.
- **Buttons:** Primary buttons are solid Cerulean (#00AFF4) with white text. Secondary buttons are outlined with the border color. No gradients. Hover states should simply lighten the background color by 10%.
- **Status Badges:** Small, uppercase labels using JetBrains Mono. Use the Success Green for positive metrics and a muted Red for negative ones.
- **Input Fields:** Dark background (#161920), 1px border (#28303F). On focus, the border changes to Cerulean.
- **Charts:** Use a 1.5px stroke width for line charts. Use Cerulean as the primary data line and Success Green for the comparison/target line. Monospaced font for all axis labels.