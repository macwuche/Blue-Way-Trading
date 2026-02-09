-- Blue Way Trading - Database Setup Script
-- Run this on the VPS: sudo -u postgres psql -d bluewave_db -f /root/bluewave/scripts/setup-db.sql

-- Sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar PRIMARY KEY,
  "sess" jsonb NOT NULL,
  "expire" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar UNIQUE NOT NULL,
  "password" varchar,
  "first_name" varchar,
  "last_name" varchar,
  "phone" varchar,
  "country" varchar(100),
  "profile_image_url" varchar,
  "status" varchar(20) DEFAULT 'active',
  "vip_level" varchar(20) DEFAULT 'Bronze',
  "is_verified" boolean DEFAULT false,
  "email_verified" boolean DEFAULT false,
  "two_factor_enabled" boolean DEFAULT false,
  "kyc_verified" boolean DEFAULT false,
  "is_admin" boolean DEFAULT false,
  "custom_payout_rate" varchar,
  "referred_by" varchar,
  "auth_provider" varchar(20) DEFAULT 'email',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS "portfolios" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "balance" decimal(18,2) NOT NULL DEFAULT 10000.00,
  "total_profit" decimal(18,2) NOT NULL DEFAULT 0.00,
  "total_profit_percent" decimal(8,2) NOT NULL DEFAULT 0.00
);

-- Holdings table
CREATE TABLE IF NOT EXISTS "holdings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "portfolio_id" varchar NOT NULL,
  "symbol" varchar(20) NOT NULL,
  "name" varchar(100) NOT NULL,
  "asset_type" varchar(20) NOT NULL,
  "quantity" decimal(18,8) NOT NULL,
  "avg_buy_price" decimal(18,8) NOT NULL,
  "current_price" decimal(18,8) NOT NULL
);

-- Trades table
CREATE TABLE IF NOT EXISTS "trades" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "portfolio_id" varchar NOT NULL,
  "symbol" varchar(20) NOT NULL,
  "name" varchar(100) NOT NULL,
  "asset_type" varchar(20) NOT NULL,
  "type" varchar(10) NOT NULL,
  "quantity" decimal(18,8) NOT NULL,
  "price" decimal(18,8) NOT NULL,
  "total" decimal(18,2) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'completed',
  "created_at" timestamp DEFAULT now()
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS "watchlist" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "symbol" varchar(20) NOT NULL,
  "name" varchar(100) NOT NULL,
  "asset_type" varchar(20) NOT NULL
);

-- Deposits table
CREATE TABLE IF NOT EXISTS "deposits" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "amount" decimal(18,2) NOT NULL,
  "currency" varchar(20) NOT NULL DEFAULT 'USD',
  "method" varchar(50) NOT NULL,
  "transaction_id" varchar,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "note" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "processed_by" varchar,
  "processed_at" timestamp
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "amount" decimal(18,2) NOT NULL,
  "currency" varchar(20) NOT NULL DEFAULT 'USD',
  "method" varchar(50) NOT NULL,
  "destination" varchar NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "note" text,
  "rejection_reason" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "processed_by" varchar,
  "processed_at" timestamp
);

-- Site settings table
CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" varchar(100) UNIQUE NOT NULL,
  "value" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Admin trade sessions table
CREATE TABLE IF NOT EXISTS "admin_trade_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" varchar NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "created_at" timestamp DEFAULT now(),
  "closed_at" timestamp
);

-- Admin trade session users table
CREATE TABLE IF NOT EXISTS "admin_trade_session_users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "trade_amount" decimal(18,2) NOT NULL DEFAULT 100.00
);

-- Admin trades table
CREATE TABLE IF NOT EXISTS "admin_trades" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" varchar NOT NULL,
  "admin_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "symbol" varchar(20) NOT NULL,
  "name" varchar(100) NOT NULL,
  "asset_type" varchar(20) NOT NULL,
  "direction" varchar(10) NOT NULL,
  "amount" decimal(18,2) NOT NULL,
  "entry_price" decimal(18,8) NOT NULL,
  "exit_price" decimal(18,8),
  "profit" decimal(18,2),
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "expiry_time" timestamp,
  "duration_ms" integer,
  "duration_group" varchar(50),
  "profit_status" varchar(20) DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "closed_at" timestamp
);

-- Create admin user with bcrypt-hashed password for: MAC_T08140615640_Tt
-- This hash is generated with bcrypt, 10 salt rounds
INSERT INTO "users" ("id", "email", "password", "first_name", "last_name", "is_admin", "is_verified", "status", "auth_provider")
VALUES (
  gen_random_uuid(),
  'admin@bluewavetrading.live',
  '$2b$10$5lIb8c9T97.5FmlvPda73OzWMjNBx1.uzGSqRW1UPVx9LdNUkGlOm',
  'Admin',
  'BlueWave',
  true,
  true,
  'active',
  'email'
) ON CONFLICT (email) DO NOTHING;

SELECT 'Database setup complete!' AS status;
