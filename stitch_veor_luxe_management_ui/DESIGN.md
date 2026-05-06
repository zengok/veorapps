---
name: Aura Metalla
colors:
  surface: '#16130b'
  surface-dim: '#16130b'
  surface-bright: '#3d392f'
  surface-container-lowest: '#110e07'
  surface-container-low: '#1f1b13'
  surface-container: '#231f17'
  surface-container-high: '#2d2a21'
  surface-container-highest: '#38342b'
  on-surface: '#eae1d4'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#eae1d4'
  inverse-on-surface: '#343027'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#f3ca50'
  on-tertiary: '#3d2f00'
  tertiary-container: '#d5af37'
  on-tertiary-container: '#564300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffe08b'
  tertiary-fixed-dim: '#eac249'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#16130b'
  on-background: '#eae1d4'
  surface-variant: '#38342b'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 32px
  gutter: 24px
  section-gap: 64px
  component-padding-x: 20px
  component-padding-y: 12px
---

## Brand & Style

The visual identity of this design system is built on the concept of "Olfactory Opulence." It targets high-end boutique staff and discerning fragrance consultants, aiming to evoke a sense of exclusivity, timelessness, and sensory depth. The interface acts as a silent concierge, providing a canvas where the product photography takes center stage against a void-like backdrop.

The style is a sophisticated blend of **Dark Glassmorphism** and **Tactile Minimalism**. It utilizes depth through layered charcoal surfaces and elevates the experience with 3D metallic accents. The emotional goal is to make every interaction feel as intentional and premium as the application of a rare perfume.

## Colors

The palette is anchored by "Deep Anthracite," a black that isn't purely neutral but carries a subtle warmth to prevent visual fatigue. The primary "Luxury Gold" is used sparingly for critical actions and brand markers, ensuring it retains its value. 

- **Primary Gold:** Used for primary CTAs, active states, and branding.
- **Anthracite Background:** The foundation for all screens, providing maximum contrast for gold accents.
- **Smoky Charcoal Surface:** Semi-transparent layers used for cards and modals, creating a glassmorphic stack.
- **Off-White Text:** Used for body copy to ensure readability against dark backgrounds without the harshness of pure white.

## Typography

This design system employs a high-contrast typographic pairing to signal luxury. **Noto Serif** is used for all headlines and display text, evoking the heritage and prestige of classic perfume houses. It should be typeset with generous leading to allow the characters to breathe.

**Manrope** serves as the functional counterpart for body text and interface labels. Its modern, geometric construction ensures legibility in a fast-paced POS environment. For labels and small UI elements, use uppercase styling with increased letter spacing to maintain an architectural, curated feel.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy to maintain a sense of controlled, editorial composition. A 12-column grid is used for desktop and tablet views, with wide margins to create a "frame" around the content. 

Rhythm is maintained through an 8px base unit. Negative space is treated as a premium asset; components should never feel crowded. Information density is kept intentionally low to ensure the user can focus on the olfactory notes and brand storytelling of the products.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows. 

1.  **Base:** The anthracite background.
2.  **Surface:** Smoky charcoal panels with a 20px backdrop blur and 15% opacity.
3.  **Accents:** A 1px "Gold Wire" border is applied to surfaces to define their boundaries.
4.  **Shadows:** When necessary, use "Glow Shadows"—low-opacity (#D4AF37 at 10%) diffused blurs that suggest the gold elements are emitting a soft light onto the charcoal surfaces.

## Shapes

The shape language of this design system is **Soft and Precise**. A consistent 4px (0.25rem) corner radius is applied to buttons, cards, and input fields. This subtle rounding mimics the "softened edge" of a high-end glass perfume bottle or a polished obsidian stone. Larger containers may use an 8px radius, but the overall aesthetic should lean toward architectural sharpness rather than organic roundness.

## Components

### Buttons
- **Primary:** Matte Gold background (#D4AF37) with Anthracite text. No gradient, but a subtle 1px inner highlight on the top edge to create a 3D "brushed metal" effect.
- **Secondary:** Ghost style with a 1px Gold border and Gold text.

### Cards
- Surfaces use the smoky glassmorphic effect. Content is separated by thin, 0.5px gold dividers with 30% opacity.

### Input Fields
- Dark charcoal backgrounds with bottom-only gold borders for a minimalist, "boutique ledger" look. Placeholder text should be in a muted grey, becoming Gold on focus.

### Chips & Tags
- Used for fragrance notes (e.g., "Oud", "Bergamot"). These should be pill-shaped with a very thin gold stroke and off-white serif text.

### Interactive Elements
- Hover states on gold elements should trigger a subtle "outer glow" effect, suggesting the metal is catching the light.
- Checkboxes and Radio buttons use a custom gold-rimmed circular design to maintain the premium aesthetic.