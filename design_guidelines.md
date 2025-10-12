# MoneyTrack Design Guidelines

## Design Approach

**Selected Framework**: Apple Human Interface Guidelines (HIG) with Custom Taiwan-Localized Identity

The app follows Apple's HIG principles for iOS-optimized experiences, enhanced with a custom color system and Taiwan-specific design elements. This ensures native-feeling interactions while maintaining brand identity for Taiwanese users.

---

## Core Design Elements

### A. Color Palette

**Light Mode (Primary)**
- Primary Blue: 220 88% 63% (#4C7EF3) - Primary actions, key metrics, interactive elements
- Accent Navy: 215 25% 29% (#3A506B) - Section headers, secondary emphasis
- Background: 220 20% 98% (#F7F8FA) - App canvas
- Text Primary: 0 0% 12% (#1E1E1E) - Main content
- Text Secondary: 0 0% 48% (#7A7A7A) - Descriptions, metadata
- Border: 0 0% 88% (#E0E0E0) - Dividers, cards
- Success Green: 142 76% 36% - Profit indicators
- Error Red: 0 84% 60% - Loss indicators

**Dark Mode**
- Primary Blue: 220 88% 68% - Slightly lighter for contrast
- Accent Navy: 215 25% 65% - Brightened for readability
- Background: 220 15% 10% - Dark canvas
- Surface: 220 12% 15% - Card/panel backgrounds
- Text Primary: 0 0% 95% - Main content
- Text Secondary: 0 0% 65% - Descriptions
- Border: 0 0% 25% - Subtle dividers

### B. Typography

**Font Stack**
- Primary: 'Noto Sans TC', -apple-system, sans-serif (body text, UI elements)
- Secondary: 'PingFang TC', system-ui (alternative for iOS)
- Display: 'Source Han Sans TC', 'Noto Sans TC' (headings, emphasis)

**Type Scale**
- Hero Numbers: text-5xl font-bold (48px) - Net worth display
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Captions/Labels: text-sm (14px)
- Metadata: text-xs (12px)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: px-4 md:px-6 lg:px-8
- Card spacing: p-6

**Container Strategy**
- Max width: max-w-7xl mx-auto (main container)
- Dashboard cards: max-w-md to max-w-2xl
- Tables: w-full with horizontal scroll on mobile

### D. Component Library

**Navigation**
- Bottom tab bar (iOS style) with 5 tabs
- Icon + label format, 56px height
- Active state: Primary blue fill, inactive: text-secondary
- Safe area padding on iPhone models

**Cards & Surfaces**
- Rounded corners: rounded-xl (12px)
- Subtle shadows: shadow-sm (light), border in dark mode
- Background: white (light) / surface color (dark)
- Padding: p-6 standard

**Data Visualization**
- Animated transparent piggy bank icon (SVG with gradient fill showing net worth)
- Line charts: Smooth curves, primary blue with gradient fill
- Pie charts: Distinct colors for each category with percentage labels
- Bar charts: Rounded caps, spacing between bars
- Tables: Striped rows (optional), sticky headers, right-aligned numbers

**Forms & Inputs**
- Text fields: rounded-lg, border-2, focus:ring-2 ring-primary
- Dropdowns: Native iOS select styling with chevron icon
- Sliders: Custom styled with primary color track, percentage labels
- Buttons: 
  - Primary: bg-primary text-white rounded-lg px-6 py-3
  - Secondary: border-2 border-primary text-primary
  - Icon buttons: rounded-full p-3

**Interactive Elements**
- Category icons: 48px containers, flat UI style (HeroIcons/Feather)
- Add buttons: Floating action button (FAB) bottom-right, primary color, rounded-full
- Toggle switches: iOS native style
- Date pickers: Calendar modal with month/year selector

### E. Animations & Interactions

**Micro-interactions** (use sparingly)
- Number count-up animation for net worth display (1-2 second duration)
- Pie chart segment expand on tap
- Smooth transitions between month/quarter/year views (300ms ease)
- Card hover/tap: subtle scale transform (scale-[1.02])

**Page Transitions**
- Tab switching: Crossfade (200ms)
- Modal entry: Slide up from bottom (iOS native)
- Sheet dismissal: Swipe down gesture

---

## Feature-Specific Design

### Asset Overview Dashboard
- Hero section: Centered piggy bank icon (120px) with net worth below
- Trend graph: Full-width card, toggle buttons for M/Q/Y above chart
- Pie chart: 50% width on desktop, full on mobile, legend on right
- Asset table: Accordion rows by type, expandable to show accounts

### Cash Flow Planner
- Split layout: Left 40% category list, Right 60% allocation pie chart
- Sliders: Horizontal with percentage labels, live update pie chart
- Fixed vs Extra income: Tabbed interface with visual separation

### Ledger
- Month selector: Horizontal scrollable pill navigation
- Entry list: Card-based with left-side category icon (colored circle)
- Quick add: Bottom sheet modal with icon grid selector
- Summary cards: 3-column grid showing totals, comparisons, balances

### Investment Portfolio
- Holdings table: Sortable columns, P/L colored cells (green/red)
- Transaction history: Expandable rows showing details
- Portfolio pie: Category breakdown with drill-down capability

---

## Taiwan-Specific Touches

- Bank/brokerage logos: Local institutions (CTBC, Cathay, Firstrade) as 32px icons
- Currency symbols: Show NT$, US$, ¥ prominently
- Number formatting: Comma separators for Traditional Chinese (12,345.67)
- Date format: YYYY/MM/DD (Taiwan standard)

---

## Images

**Dashboard Hero**: Animated SVG piggy bank illustration (not raster image)
- Transparent glass effect with gradient fill indicating net worth level
- Confetti animation on positive monthly growth

**Onboarding**: Illustration set for feature introduction (SVG)
- 3-4 simple scenes showing key features
- Flat style matching primary color palette

**Empty States**: Icon-based illustrations when no data exists
- Centered 80px icon with descriptive text below
- Soft gray tone, encouraging action