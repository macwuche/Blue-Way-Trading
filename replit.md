# Blue Way Trading - Multi-Asset Trading Platform

## Overview

Blue Way Trading is a comprehensive web-based binary options trading platform that enables users to trade cryptocurrencies, forex, stocks, and ETFs. The platform features a React frontend with a Node.js/Express backend, using PostgreSQL for data persistence. It provides real-time market data integration, interactive trading dashboards, portfolio management, and trade execution capabilities with a sleek, iOS-inspired glassmorphism design.

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
- Currently uses static mock data in `client/src/lib/market-data.ts`
- Architecture supports future integration with external APIs (CoinGecko, AlphaVantage, TwelveData, etc.)