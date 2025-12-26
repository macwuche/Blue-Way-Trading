import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  balance: decimal("balance", { precision: 18, scale: 2 }).notNull().default("10000.00"),
  totalProfit: decimal("total_profit", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalProfitPercent: decimal("total_profit_percent", { precision: 8, scale: 2 }).notNull().default("0.00"),
});

export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  assetType: varchar("asset_type", { length: 20 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  avgBuyPrice: decimal("avg_buy_price", { precision: 18, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }).notNull(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  assetType: varchar("asset_type", { length: 20 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  total: decimal("total", { precision: 18, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  assetType: varchar("asset_type", { length: 20 }).notNull(),
});

export const portfolioRelations = relations(portfolios, ({ many }) => ({
  holdings: many(holdings),
  trades: many(trades),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [holdings.portfolioId],
    references: [portfolios.id],
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [trades.portfolioId],
    references: [portfolios.id],
  }),
}));

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true });
export const insertHoldingSchema = createInsertSchema(holdings).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, createdAt: true });
export const insertWatchlistSchema = createInsertSchema(watchlist).omit({ id: true });

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;

export const tradeExecutionSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetType: z.string().min(1),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
});

export type TradeExecution = z.infer<typeof tradeExecutionSchema>;
