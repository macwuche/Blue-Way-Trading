# Bluewave Trading - Multi-Asset Trading Platform

## Overview

Bluewave Trading is a comprehensive web-based binary options trading platform that enables users to trade cryptocurrencies, forex, stocks, and ETFs. The platform features a React frontend with a Node.js/Express backend, using PostgreSQL for data persistence. It provides real-time market data integration, interactive trading dashboards, portfolio management, and trade execution capabilities with a sleek, iOS-inspired glassmorphism design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom glassmorphism effects and iOS-inspired design tokens
- **Charts**: Recharts for price visualization and trading charts

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Authentication**: Replit Auth integration with OpenID Connect, using Passport.js
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**: 
  - `users` and `sessions` for authentication
  - `portfolios` for user portfolio data
  - `holdings` for asset positions
  - `trades` for transaction history
  - `watchlist` for tracked assets
- **Migrations**: Managed via Drizzle Kit with `drizzle-kit push` command

### Authentication Flow
- Uses Replit's OpenID Connect provider for authentication
- Sessions stored in PostgreSQL for persistence
- Protected routes use `isAuthenticated` middleware
- User data synced to local database on login via upsert pattern

### Build System
- Development: Vite dev server with HMR, proxied through Express
- Production: esbuild bundles server code, Vite builds client assets
- Output: `dist/` directory with `index.cjs` (server) and `public/` (static assets)

### Design System
- Dark theme with glassmorphism effects (backdrop-filter blur)
- Color palette: iOS blue (#007AFF), purple (#5856D6), green (#34C759), red (#FF3B30)
- Typography: Inter/SF Pro Display fonts
- Components use CSS custom properties for theming

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect provider via `ISSUER_URL` (defaults to replit.com/oidc)
- **Required Secrets**: `SESSION_SECRET`, `REPL_ID` for session management

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Recharts**: Chart library for price visualization
- **Embla Carousel**: Carousel component
- **date-fns**: Date formatting utilities

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across frontend and backend

### Market Data
- **Real-time Data**: Integrated with Massive.com API for live market prices
- **Server-side Caching**: `server/massive-api.ts` fetches data every 5 seconds to prevent API overload
- **API Endpoint**: `/api/market-data` serves cached prices to frontend clients
- **Frontend Hook**: `client/src/hooks/use-market-data.ts` provides `useMarketData()` hook for components
- **Supported Assets** (53 total):
  - Stocks (20): AAPL, GOOGL, MSFT, AMZN, NVDA, TSLA, META, AMD, INTC, NFLX, DIS, BA, JPM, V, MA, WMT, KO, XOM, PG, CRM
  - ETFs (8): SPY, QQQ, VTI, IWM, GLD, DIA, ARKK, XLF
  - Crypto (15): BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, ADA/USDT, DOGE/USDT, DOT/USDT, LTC/USDT, AVAX/USDT, LINK/USDT, SHIB/USDT, TRX/USDT, ATOM/USDT, UNI/USDT
  - Forex (10): EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, NZD/USD, USD/CAD, EUR/GBP, USD/SEK, USD/SGD
- **Static Fallback**: `client/src/lib/market-data.ts` contains fallback static data when API unavailable
- **Required Secret**: `MASSIVE_API_KEY` for API authentication

### Real-time Updates
- **Server-Sent Events (SSE)**: `server/sse.ts` manages SSE client connections per user
- **SSE Endpoint**: `/api/user/events` pushes portfolio updates to connected dashboard clients
- **Admin Triggers**: All admin balance/profit adjustment endpoints call `sendUserUpdate()` to push changes instantly
- **Dashboard Listener**: `client/src/pages/dashboard.tsx` connects to SSE and updates React Query cache in real-time

### Email Notifications
- **Provider**: Resend (`server/email.ts`)
- **Required Secret**: `RESEND_API_KEY`
- **From Address**: Currently `onboarding@resend.dev` (switch to custom domain after DNS verification)
- **Templates**: Welcome email, Trade opened, Trade closed (with P&L), Balance/Profit adjustment
- **Triggers**: Registration (auth.ts), Position open/close (trading-engine.ts, routes.ts), Admin balance/profit adjustments (routes.ts)
- **Non-blocking**: All email sends use `.catch()` to prevent failures from breaking core flows

### Asset Logos
- **Logo Utility**: `client/src/lib/asset-logos.ts` maps symbols to CDN logo URLs (CoinGecko for crypto, Parqet for stocks/ETFs, flagcdn for forex)
- **AssetLogo Component**: `client/src/components/asset-logo.tsx` renders logos with graceful fallback to initials on image load failure
- **Forex**: Shows overlapping base/quote country flags; separate error state per flag
- **Type Normalization**: Handles variants like "stocks" → "stock" automatically
- **Usage**: Replaces old `getSymbolInitials` circles in asset-row, traderoom, and admin trade-for-users

### Mobile UI
- **Responsive TradeRoom**: Mobile trading panel is collapsible — shows only amount input + Buy/Sell buttons by default; SL/TP, slider, positions, and margin info expand via toggle (max-h-[40vh] scrollable); page is scrollable on mobile (min-h-screen) with fixed bottom nav
- **Bottom Navigation**: Reusable `MobileBottomNav` component (`client/src/components/mobile-bottom-nav.tsx`) added to all secondary pages (Portfolio, History, Support, News, VIP, Deposit, Withdrawal, Verification, More)
- **Dashboard Sidebar**: Defaults closed on mobile (< 1024px), auto-adjusts on viewport resize, includes backdrop overlay when open
- **Notification Dropdown**: Responsive width using `w-[calc(100vw-1rem)] sm:w-96` to prevent overflow on narrow screens

### Session Management
- **Explicit Session Save**: All login/register endpoints call `req.session.save()` before responding to ensure session data is persisted to PostgreSQL before the client can refresh