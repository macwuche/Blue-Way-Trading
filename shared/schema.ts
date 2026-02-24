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

export const deposits = pgTable("deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 20 }).notNull().default("USD"),
  method: varchar("method", { length: 50 }).notNull(),
  transactionId: varchar("transaction_id"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  processedBy: varchar("processed_by"),
  processedAt: timestamp("processed_at"),
});

export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 20 }).notNull().default("USD"),
  method: varchar("method", { length: 50 }).notNull(),
  destination: varchar("destination").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  note: text("note"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  processedBy: varchar("processed_by"),
  processedAt: timestamp("processed_at"),
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
export const insertDepositSchema = createInsertSchema(deposits).omit({ id: true, createdAt: true, updatedAt: true, processedBy: true, processedAt: true });
export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({ id: true, createdAt: true, updatedAt: true, processedBy: true, processedAt: true, rejectionReason: true });

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;

export const tradeExecutionSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetType: z.string().min(1),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
});

export type TradeExecution = z.infer<typeof tradeExecutionSchema>;

export const userPositions = pgTable("user_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  assetType: varchar("asset_type", { length: 20 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(),
  orderType: varchar("order_type", { length: 20 }).notNull().default("market"),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 18, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  exitPrice: decimal("exit_price", { precision: 18, scale: 8 }),
  triggerPrice: decimal("trigger_price", { precision: 18, scale: 8 }),
  stopLoss: decimal("stop_loss", { precision: 18, scale: 8 }),
  takeProfit: decimal("take_profit", { precision: 18, scale: 8 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 18, scale: 2 }).default("0.00"),
  adminProfit: decimal("admin_profit", { precision: 18, scale: 2 }).default("0.00"),
  realizedPnl: decimal("realized_pnl", { precision: 18, scale: 2 }),
  closeReason: varchar("close_reason", { length: 30 }),
  openedByAdmin: boolean("opened_by_admin").default(false),
  adminId: varchar("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
});

export type UserPosition = typeof userPositions.$inferSelect;
export const insertUserPositionSchema = createInsertSchema(userPositions).omit({ id: true, createdAt: true, closedAt: true, openedAt: true, unrealizedPnl: true, realizedPnl: true, closeReason: true, currentPrice: true, exitPrice: true });
export type InsertUserPosition = z.infer<typeof insertUserPositionSchema>;

export const openPositionSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetType: z.string().min(1),
  direction: z.enum(["buy", "sell"]),
  orderType: z.enum(["market", "limit", "stop"]),
  amount: z.number().positive(),
  volume: z.number().positive(),
  entryPrice: z.number().positive(),
  triggerPrice: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
});

export type OpenPositionInput = z.infer<typeof openPositionSchema>;

// Admin trade sessions for tracking trade-for-users feature
export const adminTradeSessions = pgTable("admin_trade_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const adminTradeSessionUsers = pgTable("admin_trade_session_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  tradeAmount: decimal("trade_amount", { precision: 18, scale: 2 }).notNull().default("100.00"),
});

export const adminTrades = pgTable("admin_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  adminId: varchar("admin_id").notNull(),
  userId: varchar("user_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  assetType: varchar("asset_type", { length: 20 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 18, scale: 8 }),
  profit: decimal("profit", { precision: 18, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  expiryTime: timestamp("expiry_time"),
  durationMs: integer("duration_ms"), // Duration in milliseconds for this trade
  durationGroup: varchar("duration_group", { length: 50 }), // Groups trades by same duration (e.g., "30s", "1h", "1d")
  profitStatus: varchar("profit_status", { length: 20 }).default("pending"), // pending, profit_added, loss
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export type AdminTradeSession = typeof adminTradeSessions.$inferSelect;
export type AdminTradeSessionUser = typeof adminTradeSessionUsers.$inferSelect;
export type AdminTrade = typeof adminTrades.$inferSelect;

export const tradeLogic = pgTable("trade_logic", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  totalTrades: integer("total_trades").notNull().default(10),
  winTrades: integer("win_trades").notNull().default(5),
  lossTrades: integer("loss_trades").notNull().default(5),
  currentWins: integer("current_wins").notNull().default(0),
  currentLosses: integer("current_losses").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTradeLogicSchema = createInsertSchema(tradeLogic).omit({ id: true, createdAt: true, updatedAt: true, currentWins: true, currentLosses: true });
export type TradeLogic = typeof tradeLogic.$inferSelect;
export type InsertTradeLogic = z.infer<typeof insertTradeLogicSchema>;

export const globalTradeLogic = pgTable("global_trade_logic", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalTrades: integer("total_trades").notNull().default(10),
  winTrades: integer("win_trades").notNull().default(7),
  lossTrades: integer("loss_trades").notNull().default(3),
  currentWins: integer("current_wins").notNull().default(0),
  currentLosses: integer("current_losses").notNull().default(0),
  slTpMode: varchar("sl_tp_mode", { length: 30 }).notNull().default("admin_override"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type GlobalTradeLogic = typeof globalTradeLogic.$inferSelect;
export const insertGlobalTradeLogicSchema = createInsertSchema(globalTradeLogic).omit({ id: true, createdAt: true, updatedAt: true, currentWins: true, currentLosses: true });
export type InsertGlobalTradeLogic = z.infer<typeof insertGlobalTradeLogicSchema>;

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  sentBy: varchar("sent_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  description: text("description").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ updatedAt: true });
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
