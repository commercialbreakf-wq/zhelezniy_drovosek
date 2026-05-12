---
name: Iron Woodman Identity
colors:
  surface: '#151311'
  surface-dim: '#151311'
  surface-bright: '#3b3936'
  surface-container-lowest: '#0f0e0c'
  surface-container-low: '#1d1b19'
  surface-container: '#211f1d'
  surface-container-high: '#2c2a27'
  surface-container-highest: '#373431'
  on-surface: '#e7e2dd'
  on-surface-variant: '#d7c1c7'
  inverse-surface: '#e7e2dd'
  inverse-on-surface: '#32302d'
  outline: '#a08c91'
  outline-variant: '#534347'
  surface-tint: '#ffb0cc'
  primary: '#ffb0cc'
  on-primary: '#5a1536'
  primary-container: '#cf7498'
  on-primary-container: '#520d2f'
  inverse-primary: '#944365'
  secondary: '#ffb1c0'
  on-secondary: '#660029'
  secondary-container: '#8e093d'
  on-secondary-container: '#ff96ad'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#909191'
  on-tertiary-container: '#282a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9e4'
  primary-fixed-dim: '#ffb0cc'
  on-primary-fixed: '#3e0020'
  on-primary-fixed-variant: '#772c4d'
  secondary-fixed: '#ffd9df'
  secondary-fixed-dim: '#ffb1c0'
  on-secondary-fixed: '#3f0017'
  on-secondary-fixed-variant: '#8e093d'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#151311'
  on-background: '#e7e2dd'
  surface-variant: '#373431'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 120px
    fontWeight: '700'
    lineHeight: 110px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '600'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1em
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-edge: 64px
  section-gap: 160px
---

## Brand & Style

This design system establishes a high-end, digital-first presence for the metal trading industry. It balances the raw, industrial strength of metallurgy with a sophisticated, high-fashion aesthetic. The brand personality is authoritative yet disruptive, moving away from "dusty" industrial tropes toward a sleek, tech-driven future.

The visual style is a fusion of **Minimalism** and **High-Contrast Digitalism**. It utilizes expansive negative space, oversized typography, and a refined "Metallic Silver" foundation. To differentiate from competitors, a vibrant Pink accent is used strategically to signal innovation and precision. The atmosphere is intended to feel heavy, like cold steel, but move with the frictionless fluidity of high-end digital interfaces, utilizing sophisticated masking and staggered reveal animations inspired by premium creative agencies.

## Colors

The palette is anchored in a dark, atmospheric environment to emphasize the "Iron" aspect of the brand. 

*   **Primary Pink (#CA7093):** Used as a surgical strike—for calls to action, active states, and high-importance data points. It provides a sharp, modern contrast against the dark base.
*   **Secondary Deep Wine (#900C3F):** Provides depth and tonal variation for hover states or subtle backgrounds behind pink elements.
*   **Metallic Silver (#EEEEEE):** Acts as the primary surface for light modes or high-contrast content blocks, evoking the sheen of processed metal.
*   **Iron Charcoal (#2F2D2A):** The foundation of the design system. This off-black provides a softer, more premium feel than pure black, suggesting the weight of heavy machinery.

## Typography

The typography strategy employs a "Scale & Impact" philosophy. **Space Grotesk** is chosen for its geometric, technical skeleton, reflecting the precision of metal cutting and engineering. It should be used at large scales with tight tracking to create a sense of structural density.

**Inter** provides a clean, utilitarian balance for long-form content and technical specifications, ensuring that complex trading data remains legible. 

All headings should follow a strict hierarchy. "Display" styles are reserved for hero sections and key brand statements, often paired with elegant entry transitions (e.g., text splitting by character or line).

## Layout & Spacing

The layout utilizes a **12-column fixed-width grid** centered within the viewport. To maintain the "high-end" feel, the design system mandates generous vertical spacing (Section Gaps) to allow the content to breathe and to facilitate long-scroll storytelling.

Rhythm is built on an 8px base unit. Margins are intentionally wide (64px+) to frame the content like a gallery piece. Content should often span 6 or 8 columns to create asymmetrical balance, leaving room for large-scale background typography or high-resolution imagery of industrial textures.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. Depth is communicated through the "stacking" of containers with varying shades of grey and subtle 1px borders (#EEEEEE at 10% opacity).

To mimic the Upperquad aesthetic, use **Glassmorphism** for navigational elements and overlays. Backdrop blurs (20px-40px) on semi-transparent charcoal surfaces create a sense of sophisticated layering without cluttering the industrial aesthetic. When an element is "active," it should glow with a soft, diffused pink bloom rather than a hard shadow.

## Shapes

The shape language is strictly **Sharp (0px)**. 

To evoke the feeling of cut metal and industrial beams, every button, input, and card must have 90-degree corners. This uncompromising geometry reinforces the "sturdy" and "professional" atmosphere. Softness is introduced only through motion and transitions, not through corner radii. 1px strokes are the primary decorative element, used to define boundaries and create a technical, blueprint-like appearance.

## Components

### Buttons
Primary buttons are solid Iron Charcoal with a 1px Pink border and Pink text. On hover, the button should fill with Pink using a rapid "color slide" transition from left to right, with text flipping to White.

### Input Fields
Inputs are "Ghost" style: a single 1px bottom border that thickens and changes to Pink upon focus. Labels use the `label-caps` style and sit above the field.

### Cards
Cards are defined by their 1px subtle borders. They do not have background fills by default; instead, they use a background-blur effect when hovering over images or complex backgrounds.

### Chips & Tags
Small, rectangular boxes with `label-caps` typography. Use them for metal types (e.g., STEEL, ALUMINUM) with a light grey border.

### Sophisticated Motion
Incorporate "Smooth Scroll" and "Parallax" on image containers. Components should use staggered entry animations—when a page loads, elements should slide up and fade in with a custom Cubic Bezier (0.16, 1, 0.3, 1) for a "weighted" feel.

### Trading Dashboard Elements
Data visualizations (charts and graphs) should use the Pink and Deep Wine colors for data lines, set against a dark grid background to maintain the high-end industrial aesthetic.