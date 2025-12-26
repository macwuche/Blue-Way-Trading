# Trading Platform Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Robinhood, Coinbase Pro, and Apple's iOS design language, combining sleek financial interfaces with smooth interactions and glassmorphism effects.

## Color System
- **Primary**: #007AFF (iOS blue)
- **Secondary**: #5856D6 (purple)
- **Success**: #34C759 (green for profits/buy actions)
- **Danger**: #FF3B30 (red for losses/sell actions)
- **Background**: Linear gradient from #000000 to #1C1C1E (dark)
- **Surface**: #2C2C2E with 80% opacity (frosted glass effect)
- **Text Primary**: #FFFFFF (white)
- **Text Secondary**: #98989D (grey)

## Typography
- **Primary Font**: SF Pro Display (fallback to Inter)
- **Hierarchy**: 
  - Dashboard headers: 32px bold
  - Section titles: 24px semibold
  - Body text: 16px regular
  - Labels/captions: 14px medium
  - Trade amounts: 28px bold (tabular numbers)

## Layout System
**Spacing Units**: Use Tailwind classes - primary spacing of 4, 6, 8, 12, and 24 (e.g., p-4, gap-6, mt-8, mb-12, py-24)

**Grid Structure**:
- Dashboard: 12-column grid with 24px gutters
- Trading cards: Floating panels with consistent 24px internal padding
- Responsive breakpoints: Mobile-first, tablet at md:, desktop at lg:

## Component Library

### Navigation
- Fixed sidebar (desktop) with glassmorphism background, 280px width
- Bottom navigation bar (mobile) with blur effect
- Logo placement: Top-left with 24px margin
- Navigation items: Icons + labels, 48px height, hover state with 10% white overlay

### Trading Dashboard Cards
- Glassmorphism cards: `backdrop-filter: blur(20px)`, 16px border-radius
- Translucent backgrounds: 70-85% opacity on #2C2C2E
- Subtle shadows: `0 8px 32px rgba(0, 0, 0, 0.3)`
- Gradient accents on card borders (1px, subtle purple-blue)

### Market Selection Modal
- Animated popup: Slide-up transition (0.3s ease)
- Backdrop: Black with 60% opacity, blur(10px)
- Search bar: Glassmorphism with white 10% background
- Asset list: Cards with icons, name, price, 24hr change (color-coded)

### Trade Execution Interface
- Buy/Sell toggle: Segmented control, 48px height
- Input fields: Glassmorphism, white 10% background, 48px height
- Sliders: Custom styled with gradient fill (primary color)
- Action buttons: Full-width, 56px height, gradient backgrounds (#007AFF to #5856D6), white text

### Charts
- Real-time candlestick/line charts with gradient fills
- Time selector tabs: 1H, 4H, 1D, 1W, 1M, 1Y
- Interactive tooltips with glassmorphism background
- Grid lines: White 5% opacity

### Portfolio Overview
- Balance card: Prominent display, gradient background (#1C1C1E to #2C2C2E)
- Profit/Loss indicators: Color-coded with arrow icons
- Asset allocation: Donut chart with segment labels
- Trade history: List view with timestamps, amounts, status badges

## Animations
- **Page transitions**: 0.3s ease
- **Modal animations**: Slide-up/slide-down (0.3s cubic-bezier)
- **Hover states**: 0.15s ease-in-out
- **Chart updates**: Smooth line drawing (0.5s)
- **Button clicks**: Scale(0.95) on active state

## Images
- **Hero Section**: Full-width abstract gradient visualization of market data/trading graphs (1920x800px), dark themed with blue/purple accents, overlaid with glassmorphism welcome panel
- **Asset Icons**: Use cryptocurrency/stock logos from APIs (40x40px, circular)
- **Empty States**: Illustrations for no trades, no portfolio (centered, 240x180px)

Hero buttons should have blurred backgrounds (`backdrop-filter: blur(20px)`) without custom hover states.

## Accessibility
- Focus states: 2px outline in primary color with 4px offset
- ARIA labels on all interactive elements
- Keyboard navigation for trading forms
- Color contrast: Minimum 4.5:1 for all text
- Form validation: Inline error messages below fields, red text with warning icons

## Special UI Patterns
- **Glassmorphism**: Apply backdrop-filter blur(20px) consistently across cards, modals, navigation
- **Floating panels**: Elevate primary content with subtle shadows and translucent backgrounds
- **Gradient accents**: Use on buttons, progress indicators, and premium features
- **Smooth micro-interactions**: All state changes animated (loading spinners, success checkmarks)