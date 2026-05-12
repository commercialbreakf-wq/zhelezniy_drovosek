---
name: Industrial Precision
colors:
  surface: '#151311'
  surface-dim: '#151311'
  surface-bright: '#3c3936'
  surface-container-lowest: '#100e0c'
  surface-container-low: '#1d1b19'
  surface-container: '#211f1d'
  surface-container-high: '#2c2927'
  surface-container-highest: '#373432'
  on-surface: '#e8e1dd'
  on-surface-variant: '#d7c1c7'
  inverse-surface: '#e8e1dd'
  inverse-on-surface: '#33302e'
  outline: '#a08c91'
  outline-variant: '#534347'
  surface-tint: '#ffb0cc'
  primary: '#ffb0cc'
  on-primary: '#5a1536'
  primary-container: '#cf7498'
  on-primary-container: '#520d2f'
  inverse-primary: '#944365'
  secondary: '#c5c6ca'
  on-secondary: '#2e3034'
  secondary-container: '#47494d'
  on-secondary-container: '#b7b8bc'
  tertiary: '#cac6c2'
  on-tertiary: '#32302e'
  tertiary-container: '#94908d'
  on-tertiary-container: '#2b2927'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9e4'
  primary-fixed-dim: '#ffb0cc'
  on-primary-fixed: '#3e0020'
  on-primary-fixed-variant: '#772c4d'
  secondary-fixed: '#e2e2e6'
  secondary-fixed-dim: '#c5c6ca'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474a'
  tertiary-fixed: '#e7e1de'
  tertiary-fixed-dim: '#cac6c2'
  on-tertiary-fixed: '#1d1b19'
  on-tertiary-fixed-variant: '#494644'
  background: '#151311'
  on-background: '#e8e1dd'
  surface-variant: '#373432'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
spacing:
  unit: 4px
  gutter: 24px
  margin: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system embodies the raw power and technical accuracy of the metalworking industry. For 'Железный Дровосек' (Iron Woodman), the visual language shifts away from generic industrial aesthetics toward a **High-Contrast Minimalism** that feels like a precision instrument. 

The personality is authoritative, cold-forged, and unwavering. By combining a deep, matte charcoal base with a striking industrial pink, we create a "cyber-industrial" atmosphere that distinguishes the brand from the traditional blue-and-orange palettes of competitors. The interface should feel heavy yet fast, utilizing sharp lines and technical typography to evoke the feeling of a digital control panel for heavy machinery.

## Colors

The palette is anchored in a dark-mode-only experience to maintain high perceived value and "stealth" industrial aesthetics.

- **Primary (#CA7093):** An "Industrial Pink" used sparingly for high-priority actions, critical status indicators, and branding accents. It provides a sharp, neon-like contrast against the dark base.
- **Secondary (#A8A9AD):** A "Metallic Silver" used for supportive text, icons, and subtle borders. It mimics the sheen of brushed steel.
- **Tertiary (#32302E):** A lighter charcoal for container backgrounds and hover states, providing depth without breaking the dark theme.
- **Background (#151311):** A "Deep Charcoal" base that reduces eye strain and makes the primary color pop with extreme vibrancy.

## Typography

Typography is used as a structural element. **Space Grotesk** is the primary driver for headlines and labels, providing a technical, geometric rhythm that feels engineered. All headers should favor a tight letter-spacing to emphasize the "heavy" nature of the brand.

**Inter** is utilized for body copy to ensure maximum legibility when reading technical specifications, price lists, or logistics data. Labels are frequently set in uppercase with increased tracking to mimic the serial numbers found on industrial steel beams and plates.

## Layout & Spacing

This design system uses a **Fixed Grid** model for desktop to maintain a sense of controlled, rigid engineering. A 12-column grid provides the framework for content, with wide margins to allow the dark background to frame the interface.

Spacing follows a strict 4px base unit. Visual density should be medium-to-high, reflecting the complex data requirements of metal supplying. Information is grouped into logical "modules" that align strictly to the grid, avoiding organic or offset placements. Use generous vertical "stacks" between major sections to prevent the dark UI from feeling claustrophobic.

## Elevation & Depth

In this system, depth is achieved through **Tonal Layers** rather than shadows. 

- **Level 0 (Background):** The base #151311 surface.
- **Level 1 (Containers):** Surfaces use #1C1A18 with a 1px solid border of #32302E. This creates a "machined" look where elements feel inlaid rather than floating.
- **Interactive Elements:** Use a subtle internal glow or the Primary color for borders to indicate focus. 
- **Overlays:** Modals use a background blur (12px) with a semi-transparent dark fill to maintain context while isolating the task. Avoid drop shadows; if necessary, use a sharp, 0-blur offset shadow to maintain the brutalist feel.

## Shapes

The shape language is strictly **Sharp (0px)**. To reflect the nature of cut metal and industrial beams, every UI element—from buttons and input fields to large cards—must have 90-degree corners. 

Any sense of softness is removed to reinforce the brand values of strength and precision. Structural lines should be thin (1px) but high-contrast, acting as wireframes that organize the information.

## Components

- **Buttons:** Primary buttons are solid #CA7093 with black text (Inter Bold). Secondary buttons are transparent with a 1px silver border and silver text. All buttons are rectangular with no corner radius.
- **Input Fields:** Dark backgrounds (#1C1A18) with a 1px silver bottom border. On focus, the bottom border changes to #CA7093.
- **Chips/Tags:** Used for metal types (e.g., "Stainless Steel"). Small, rectangular, with a subtle silver stroke.
- **Cards:** Used for product categories. They should feature high-contrast photography of metal textures, with labels overlaid in Space Grotesk Bold. Use 1px #32302E borders to separate grid items.
- **Data Tables:** High-density, utilizing the silver secondary color for row dividers. Headers are uppercase Space Grotesk with a subtle metallic background tint.
- **Status Indicators:** Use the primary industrial pink for "active" or "in progress" states, as it commands immediate attention against the dark void.