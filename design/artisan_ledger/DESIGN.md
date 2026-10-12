---
name: Artisan Ledger
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#504440'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#827470'
  outline-variant: '#d3c3be'
  surface-tint: '#74584e'
  primary: '#090100'
  on-primary: '#ffffff'
  primary-container: '#2c1810'
  on-primary-container: '#9e7e73'
  inverse-primary: '#e3bfb2'
  secondary: '#486554'
  on-secondary: '#ffffff'
  secondary-container: '#c7e7d2'
  on-secondary-container: '#4c6958'
  tertiary: '#070200'
  on-tertiary: '#ffffff'
  tertiary-container: '#311600'
  on-tertiary-container: '#c96d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#e3bfb2'
  on-primary-fixed: '#2a170f'
  on-primary-fixed-variant: '#5a4137'
  secondary-fixed: '#caead4'
  secondary-fixed-dim: '#aeceb9'
  on-secondary-fixed: '#042013'
  on-secondary-fixed-variant: '#304d3d'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
  surface-base: '#FBF9F5'
  surface-card: '#FFFFFF'
  surface-subtle: '#F4EFEA'
  border-subtle: '#EBE5DF'
  border-strong: '#D5CCC1'
  text-primary: '#2C1810'
  text-secondary: '#635852'
  text-muted: '#9A8F86'
  profit-emerald: '#1E3A2B'
  profit-sage: '#38A169'
  alert-amber: '#D97706'
  loss-rose: '#C53030'
  accent-foam: '#E6F4EA'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Epilogue
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Epilogue
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  numeric-hero:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  numeric-table:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is tailored for independent cafe operators and boutique food-and-beverage entrepreneurs managing inventory, daily closing, sales revenue, and margins. It merges the warmth and artisanal pride of coffee culture with the high-reliability precision of modern B2B fintech tools. 

### Core Personality & Emotional Target
- **Artisan Precision**: Balances organic warmth with rigorous financial clarity. Operators feel calm and in control during high-stress operational peaks and end-of-day reconciliation.
- **Trustworthy & Grounded**: Avoids cold, sterile enterprise conventions in favor of deep espresso and natural botanical tones that mirror physical store craftsmanship.
- **Clarity under Pressure**: High scannability, zero visual clutter, and instant distinction between healthy margins, critical stock alerts, and settlement figures.

### Visual Style
The design style integrates **Warm Corporate SaaS** with **Tactile Minimalist Accents**:
- Crisp, low-contrast structural grids paired with fine 1px warm borders (`#EBE5DF`).
- Tactile warmth introduced via soft cream backdrops, deep roasted coffee anchors, and muted forest botanicals.
- Tabular numeric alignment with explicit fiscal status signifiers (surplus amber, settled sage green, and deficit rust).

## Colors

The palette establishes an organic financial hierarchy. It completely rejects cold synthetic blues in favor of grounded roasts, garden sages, and warm amber tones.

### Functional Palette Roles
- **Primary (`#2C1810`)**: Deep Espresso. Used for primary branding elements, high-emphasis headlines, active navigation states, and primary button fills. Conveys authority and grounded heritage.
- **Secondary (`#1E3A2B`)**: Dark Forest Pine. Represents profitability, confirmed transactions, and solvent balance sheets.
- **Tertiary (`#D97706`)**: Toasted Amber. Serves as the attention beacon for low stock thresholds, pending reconciliations, and tax warning callouts.
- **Neutral (`#FBF9F5`)**: Cream Canvas. The global application background, neutralizing screen fatigue and mimicking unbleached paper ledgers.

### Data & State Semantics
- **Metrics & Ledgers**: Positive net gains use `profit-sage` (`#38A169`) alongside `accent-foam` (`#E6F4EA`) badges. Shrinkage, waste, and net loss use `loss-rose` (`#C53030`).
- **Hierarchy of Surfaces**: Background canvas is set to `#FBF9F5`, foreground analytical cards sit cleanly on pure white `#FFFFFF` with `#EBE5DF` hairline dividers, and secondary controls rest on `#F4EFEA`.

## Typography

Typography balances artisanal craft with fiscal accuracy.
- **Display & Headings (Epilogue)**: Imparts structural character, warmth, and quiet editorial authority.
- **Body & UI Controls (Manrope)**: Delivers geometric neutrality, clear Korean/Latin glyph harmony, and fatigue-free scannability across dense settings.
- **Financial & Tabular Metrics (JetBrains Mono)**: Guarantees fixed-width columnar alignment across POS entries, gram/milliliter inventories, and ledger tables.

All numeric values in tabular reports, cost breakdown sheets, and inventory matrices must force `font-feature-settings: "tnum" 1, "zero" 1`.

## Layout & Spacing

The layout runs on a responsive 12-column grid system for desktop and tablet screens, folding to a single or dual-column stream on mobile devices.

### Grid & Breakpoints
- **Desktop (>= 1280px)**: 12-column fluid grid, max-width `1440px`, with `margin: 2rem` and `gutter: 1.25rem`. Side navigation is fixed at `260px` with the main ledger area flexing to full width.
- **Tablet (768px – 1279px)**: 8-column grid with a collapsed icon-only sidebar (`64px`), dynamic fluid cards, and `gutter: 1rem`.
- **Mobile (< 768px)**: 4-column flow with persistent top/bottom app bars, `margin: 1rem`, and `gutter: 0.75rem`. Complex data grids automatically switch into accordion-style financial summary cards.

### Spatial Rationale
Spacing strictly obeys an 8px base rhythm (`0.5rem` steps). Internal metric panels enforce compact padding (`space-md`) to ensure critical KPIs (Revenue, COGS, Waste, Net Margin) remain visible above the fold on tablet-sized POS displays without requiring vertical scroll.

## Elevation & Depth

To sustain a grounded, tactile atmosphere, this design system minimizes heavy drop shadows in favor of **Tonal Layering** and **Micro-Borders**.

### Layering Hierarchy
1. **Canvas (Level 0)**: Tone `#FBF9F5`. No shadows. Houses base background regions.
2. **Card & Panel Layer (Level 1)**: Tone `#FFFFFF`. Defined by a 1px solid border `#EBE5DF` and an ambient warm shadow: `0 1px 3px rgba(44, 24, 16, 0.04), 0 1px 2px rgba(44, 24, 16, 0.02)`.
3. **Floating & Hover Surfaces (Level 2)**: Filter popovers, date-pickers, and hover cards. Border `#D5CCC1` with shadow: `0 4px 12px rgba(44, 24, 16, 0.08), 0 2px 4px rgba(44, 24, 16, 0.04)`.
4. **Modal Overlays & Drawers (Level 3)**: Batch recipe editor, inventory adjustments, and closing modals. Backdrop blur `4px` with a 40% espresso scrim (`rgba(44, 24, 16, 0.45)`). Card shadow: `0 12px 32px rgba(44, 24, 16, 0.16)`.

## Shapes

The system implements subtle, tailored curvature (`roundedness: 1`). Soft corners retain architectural structure without sliding into overly playful, consumer-leaning forms.

### Corner Radius Standards
- **Base Components (`0.25rem` / `4px`)**: Table rows, badge tags, inline chips, status pills, and numeric inputs.
- **Interactive Units (`0.5rem` / `8px`)**: Buttons, modal shells, KPI containers, and standard data cards (`rounded-lg`).
- **Surface Panels (`0.75rem` / `12px`)**: Flyout drawers and persistent dashboard container groups (`rounded-xl`).
- **Circular Elements**: User avatars, step check indicators, and icon badges use full pill/circle radii (`9999px`).

## Components

### Buttons
- **Primary**: Background `#2C1810`, text `#FFFFFF`, radius `8px`. Hover: `#3E2318`. Active: `#20110B`. Focused: 2px offset ring in `#1E3A2B`.
- **Secondary / Ghost**: Background transparent, border 1px solid `#D5CCC1`, text `#2C1810`. Hover: `#F4EFEA`.
- **Positive Action (e.g., Closing Ledger Confirm)**: Background `#1E3A2B`, text `#FFFFFF`. Hover: `#284E3A`.

### Data Grids & Tables
- **Header**: `#F4EFEA` background, text in `label-sm` (uppercase, letter-spaced) colored `#635852`. 1px bottom border in `#EBE5DF`.
- **Rows**: `#FFFFFF` background, hover highlight `#FAF7F2`. Numeric entries must use `JetBrains Mono` right-aligned with unit tokens (`원`, `g`, `ml`, `EA`) styled with `text-muted`.
- **Alternating Highlights**: Subtle tint on summary rows (`#FBF9F5`) with double top-border treatment to convey ledger totals.

### Form Inputs & Numeric Steppers
- **Text & Currency Inputs**: 1px border in `#D5CCC1`, background `#FFFFFF`, text `#2C1810`. Focus ring in `#2C1810` with zero blur.
- **Unit Stepper Components**: Embedded increment/decrement buttons for quick unit adjustment on mobile tablets, utilizing tactile border partitions.

### KPI & Metric Cards
- White `#FFFFFF` container with `8px` corner radius, `space-md` internal padding, and 1px border `#EBE5DF`.
- Top row houses the indicator label and context badge (e.g., "전일 대비 +8.4%"). Middle row holds the primary metric in `numeric-hero`. Bottom row houses secondary data notes (e.g., "원가율 28.2%").

### Chips & Status Badges
- **Normal / Healthy**: Text `#1E3A2B`, background `#E6F4EA`, border 1px solid `#C2E7CB`.
- **Warning / Low Stock**: Text `#8D4A00`, background `#FEF3C7`, border 1px solid `#FCD34D`.
- **Critical / Loss**: Text `#9B1C1C`, background `#FDF2F2`, border 1px solid `#F8B4B4`.

### Modals & Drawers
- Centered dialogs for desktop (`540px` or `720px` width) and bottom sheets on mobile devices.
- Headers are divided by a subtle border (`#EBE5DF`) with an explicit cancel and confirm control group anchored at the bottom right.