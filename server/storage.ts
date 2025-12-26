import { 
  portfolios, holdings, trades, watchlist,
  type Portfolio, type InsertPortfolio,
  type Holding, type InsertHolding,
  type Trade, type InsertTrade,
  type WatchlistItem, type InsertWatchlistItem 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getPortfolioByUserId(userId: string): Promise<Portfolio | undefined>;
  createPortfolio(data: InsertPortfolio): Promise<Portfolio>;
  updatePortfolioBalance(id: string, balance: string, profit: string, profitPercent: string): Promise<Portfolio>;
  
  getHoldingsByPortfolioId(portfolioId: string): Promise<Holding[]>;
  getHoldingBySymbol(portfolioId: string, symbol: string): Promise<Holding | undefined>;
  createHolding(data: InsertHolding): Promise<Holding>;
  updateHolding(id: string, quantity: string, avgBuyPrice: string, currentPrice: string): Promise<Holding>;
  deleteHolding(id: string): Promise<void>;
  
  getTradesByPortfolioId(portfolioId: string): Promise<Trade[]>;
  createTrade(data: InsertTrade): Promise<Trade>;
  
  getWatchlistByUserId(userId: string): Promise<WatchlistItem[]>;
  addToWatchlist(data: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, symbol: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPortfolioByUserId(userId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    return portfolio;
  }

  async createPortfolio(data: InsertPortfolio): Promise<Portfolio> {
    const [portfolio] = await db.insert(portfolios).values(data).returning();
    return portfolio;
  }

  async updatePortfolioBalance(id: string, balance: string, profit: string, profitPercent: string): Promise<Portfolio> {
    const [portfolio] = await db
      .update(portfolios)
      .set({ balance, totalProfit: profit, totalProfitPercent: profitPercent })
      .where(eq(portfolios.id, id))
      .returning();
    return portfolio;
  }

  async getHoldingsByPortfolioId(portfolioId: string): Promise<Holding[]> {
    return db.select().from(holdings).where(eq(holdings.portfolioId, portfolioId));
  }

  async getHoldingBySymbol(portfolioId: string, symbol: string): Promise<Holding | undefined> {
    const [holding] = await db
      .select()
      .from(holdings)
      .where(and(eq(holdings.portfolioId, portfolioId), eq(holdings.symbol, symbol)));
    return holding;
  }

  async createHolding(data: InsertHolding): Promise<Holding> {
    const [holding] = await db.insert(holdings).values(data).returning();
    return holding;
  }

  async updateHolding(id: string, quantity: string, avgBuyPrice: string, currentPrice: string): Promise<Holding> {
    const [holding] = await db
      .update(holdings)
      .set({ quantity, avgBuyPrice, currentPrice })
      .where(eq(holdings.id, id))
      .returning();
    return holding;
  }

  async deleteHolding(id: string): Promise<void> {
    await db.delete(holdings).where(eq(holdings.id, id));
  }

  async getTradesByPortfolioId(portfolioId: string): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(eq(trades.portfolioId, portfolioId))
      .orderBy(desc(trades.createdAt));
  }

  async createTrade(data: InsertTrade): Promise<Trade> {
    const [trade] = await db.insert(trades).values(data).returning();
    return trade;
  }

  async getWatchlistByUserId(userId: string): Promise<WatchlistItem[]> {
    return db.select().from(watchlist).where(eq(watchlist.userId, userId));
  }

  async addToWatchlist(data: InsertWatchlistItem): Promise<WatchlistItem> {
    const [item] = await db.insert(watchlist).values(data).returning();
    return item;
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    await db.delete(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol)));
  }
}

export const storage = new DatabaseStorage();
