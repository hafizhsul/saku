---
name: Saku Financial System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#404944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#52625c'
  on-secondary: '#ffffff'
  secondary-container: '#d3e3dc'
  on-secondary-container: '#566660'
  tertiary: '#003623'
  on-tertiary: '#ffffff'
  tertiary-container: '#004f34'
  on-tertiary-container: '#31c98f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#d5e6df'
  secondary-fixed-dim: '#bacac3'
  on-secondary-fixed: '#101e1a'
  on-secondary-fixed-variant: '#3b4a44'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter-mobile: 12px
---

## Brand & Style
The design system is centered on the concept of "Safe Stewardship"—combining the institutional trust of a traditional bank with the accessibility of a modern digital wallet. The aesthetic follows a **Corporate Modern** approach with a **Tactile** twist, using soft surfaces and clear boundaries to represent the "pockets" (Saku) where users organize their finances.

The target audience is the modern Indonesian professional who values order and growth. The UI should evoke a sense of calm, security, and effortless organization. Every interaction must feel intentional and grounded, avoiding unnecessary flourishes in favor of high-utility clarity.

## Colors
The palette is built around "Emerald Growth." 
- **Primary (#064E3B):** A deep, rich emerald used for core branding, primary actions, and headers to establish authority and trust.
- **Secondary (#ECFDF5):** A soft mint used for large background surfaces and container fills to keep the interface airy and friendly.
- **Tertiary (#10B981):** A vibrant accent green for positive growth indicators, success states, and call-to-action highlights.
- **Neutral (#64748B):** A professional slate gray used for secondary text and icons, ensuring high legibility without the harshness of pure black.
- **Surface:** Use an off-white (#F8FAFC) for the main background to reduce eye strain.

## Typography
This design system utilizes **Inter** exclusively to maintain a systematic and utilitarian feel. The hierarchy is strictly enforced to guide users through complex financial data. 

- **Numerical Data:** Always use `tabular-nums` OpenType features for transaction lists and balances to ensure vertical alignment of digits.
- **Language:** All micro-copy is in Bahasa Indonesia. Use clear, imperative verbs (e.g., "Bayar," "Transfer," "Tambah Saku").
- **Contrast:** Headlines should use the Primary color or the darkest neutral to ensure they anchor the page.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile-first consumption. 
- **Grid:** Use a 4-column grid for mobile screens with 20px side margins and 12px gutters.
- **Rhythm:** An 8px linear scale (base 4px) governs all spatial relationships. 
- **Containment:** Use cards to group "Saku" (pockets). Each card should have a standard padding of `md` (16px) to maintain a breathable layout.
- **Vertical Flow:** Related items (like transaction history) should use `xs` (8px) spacing, while distinct sections (like Wallet vs. Analytics) use `xl` (32px) to signify a hard break.

## Elevation & Depth
Elevation in this design system is communicated through **Tonal Layers** combined with **Ambient Shadows**.
- **Level 0 (Background):** The off-white base layer.
- **Level 1 (Cards/Pockets):** Pure white background with a very soft, diffused shadow (0px 4px 20px, 5% opacity of the Primary color). This creates a "lifted" effect that makes the pockets feel interactive.
- **Level 2 (Active States/Modals):** A slightly more pronounced shadow (0px 10px 30px, 8% opacity).
- **Interactions:** When a user taps a "Saku" card, it should subtly shrink (scale 0.98) to mimic physical pressure.

## Shapes
The shape language is defined by a consistent 16px radius (`rounded-lg` in this system).
- **Core Elements:** Buttons and Main Cards use the `rounded-lg` (16px) setting to appear friendly and safe.
- **Small Elements:** Form inputs and tags use the base `rounded` (8px) for a sharper, more precise look.
- **Icon Enclosures:** Use circular containers (pill-shaped) for category icons (e.g., Food, Transport) to differentiate them from functional UI blocks.

## Components
- **Buttons:** Primary buttons use the Primary Emerald fill with white text. Secondary buttons use the Mint fill with Primary Emerald text. Minimum height: 52px for touch accessibility.
- **The "Saku" Card:** A white container with a 16px radius. It must include a title (e.g., "Tabungan Haji"), a balance in `headline-sm`, and a progress bar showing the goal percentage.
- **Input Fields:** Outlined style with a 1px border in a light neutral. On focus, the border thickens to 2px and changes to the Tertiary green.
- **Chips:** Small, rounded-pill indicators for categories (e.g., "Kebutuhan," "Keinginan"). Use Tertiary green for positive flow and a soft coral for expenses.
- **Transaction Lists:** Clean rows with a minimalist line icon on the left, the merchant name in `body-md` (bold), and the amount on the far right. Amounts should be color-coded (Red for outflow, Tertiary Green for inflow).
- **Navigation:** A bottom navigation bar with a glassmorphism effect (backdrop-blur) to maintain context of the background content while scrolling.