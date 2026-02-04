import { 
  portfolios, holdings, trades, watchlist, deposits, withdrawals,
  users, adminTradeSessions, adminTradeSessionUsers, adminTrades,
  type Portfolio, type InsertPortfolio,
  type Holding, type InsertHolding,
  type Trade, type InsertTrade,
  type WatchlistItem, type InsertWatchlistItem,
  type User, type Deposit, type InsertDeposit,
  type Withdrawal, type InsertWithdrawal,
  type AdminTradeSession, type AdminTradeSessionUser, type AdminTrade
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, or, sql } from "drizzle-orm";

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
  getAllTrades(): Promise<Trade[]>;
  createTrade(data: InsertTrade): Promise<Trade>;
  
  getWatchlistByUserId(userId: string): Promise<WatchlistItem[]>;
  addToWatchlist(data: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, symbol: string): Promise<void>;

  // User authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: Partial<User>): Promise<User>;

  // Admin user management
  getAllUsers(search?: string): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  updateUserStatus(id: string, status: string): Promise<User>;
  updateUserVipLevel(id: string, vipLevel: string, customPayoutRate?: string): Promise<User>;
  updateUserVerification(id: string, isVerified: boolean): Promise<User>;
  updateUserVerificationField(id: string, field: 'emailVerified' | 'twoFactorEnabled' | 'kycVerified', value: boolean): Promise<User>;
  updateUserAdmin(id: string, isAdmin: boolean): Promise<User>;
  
  // Admin balance/profit management
  adjustUserBalance(userId: string, amount: number, operation: 'add' | 'subtract'): Promise<Portfolio>;
  adjustUserProfit(userId: string, amount: number, operation: 'add' | 'subtract'): Promise<Portfolio>;
  
  // Admin stats
  getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalDeposits: string;
    pendingWithdrawals: string;
    totalTrades: number;
    totalProfit: string;
  }>;

  // Deposits
  getAllDeposits(filters?: { status?: string; userId?: string }): Promise<(Deposit & { user?: User })[]>;
  getDepositById(id: string): Promise<Deposit | undefined>;
  createDeposit(data: InsertDeposit): Promise<Deposit>;
  updateDepositStatus(id: string, status: string, processedBy: string): Promise<Deposit>;
  
  // Withdrawals
  getAllWithdrawals(filters?: { status?: string; userId?: string }): Promise<(Withdrawal & { user?: User })[]>;
  getWithdrawalById(id: string): Promise<Withdrawal | undefined>;
  createWithdrawal(data: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawalStatus(id: string, status: string, processedBy: string, rejectionReason?: string): Promise<Withdrawal>;
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

  async getAllTrades(): Promise<Trade[]> {
    return db.select().from(trades).orderBy(desc(trades.createdAt));
  }

  // User authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(data as any).returning();
    return user;
  }

  // Admin user management
  async getAllUsers(search?: string): Promise<User[]> {
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      return db.select().from(users).where(
        or(
          like(sql`LOWER(${users.email})`, searchPattern),
          like(sql`LOWER(${users.firstName})`, searchPattern),
          like(sql`LOWER(${users.lastName})`, searchPattern),
          like(sql`LOWER(${users.phone})`, searchPattern)
        )
      ).orderBy(desc(users.createdAt));
    }
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserStatus(id: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserVipLevel(id: string, vipLevel: string, customPayoutRate?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ vipLevel, customPayoutRate: customPayoutRate || null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserVerification(id: string, isVerified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserVerificationField(id: string, field: 'emailVerified' | 'twoFactorEnabled' | 'kycVerified', value: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ [field]: value, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserAdmin(id: string, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Admin balance/profit management
  async adjustUserBalance(userId: string, amount: number, operation: 'add' | 'subtract'): Promise<Portfolio> {
    console.log(`[Admin] adjustUserBalance called - userId: ${userId}, amount: ${amount}, operation: ${operation}`);
    
    let portfolio = await this.getPortfolioByUserId(userId);
    if (!portfolio) {
      console.log(`[Admin] No portfolio found for userId ${userId}, creating new one`);
      portfolio = await this.createPortfolio({
        userId,
        balance: "0.00",
        totalProfit: "0.00",
        totalProfitPercent: "0.00",
      });
    }
    
    const currentBalance = parseFloat(portfolio.balance);
    const newBalance = operation === 'add' 
      ? (currentBalance + amount).toFixed(2)
      : Math.max(0, currentBalance - amount).toFixed(2);
    
    console.log(`[Admin] Updating balance for portfolioId ${portfolio.id}: ${currentBalance} -> ${newBalance}`);
    
    const [updated] = await db
      .update(portfolios)
      .set({ balance: newBalance })
      .where(eq(portfolios.id, portfolio.id))
      .returning();
    
    console.log(`[Admin] Balance updated successfully - new balance: ${updated.balance}`);
    return updated;
  }

  async adjustUserProfit(userId: string, amount: number, operation: 'add' | 'subtract'): Promise<Portfolio> {
    console.log(`[Admin] adjustUserProfit called - userId: ${userId}, amount: ${amount}, operation: ${operation}`);
    
    let portfolio = await this.getPortfolioByUserId(userId);
    if (!portfolio) {
      console.log(`[Admin] No portfolio found for userId ${userId}, creating new one`);
      portfolio = await this.createPortfolio({
        userId,
        balance: "0.00",
        totalProfit: "0.00",
        totalProfitPercent: "0.00",
      });
    }
    
    const currentProfit = parseFloat(portfolio.totalProfit);
    const currentBalance = parseFloat(portfolio.balance);
    
    const profitChange = operation === 'add' ? amount : -amount;
    const newProfit = (currentProfit + profitChange).toFixed(2);
    const newBalance = Math.max(0, currentBalance + profitChange).toFixed(2);
    
    console.log(`[Admin] Updating profit for portfolioId ${portfolio.id}: profit ${currentProfit} -> ${newProfit}, balance ${currentBalance} -> ${newBalance}`);
    
    const initialBalance = 10000;
    const totalValue = parseFloat(newBalance) + parseFloat(newProfit);
    const profitPercent = (((totalValue - initialBalance) / initialBalance) * 100).toFixed(2);
    
    const [updated] = await db
      .update(portfolios)
      .set({ 
        totalProfit: newProfit, 
        totalProfitPercent: profitPercent,
        balance: newBalance
      })
      .where(eq(portfolios.id, portfolio.id))
      .returning();
    
    console.log(`[Admin] Profit updated successfully - new profit: ${updated.totalProfit}, new balance: ${updated.balance}`);
    return updated;
  }

  // Admin stats
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalDeposits: string;
    pendingWithdrawals: string;
    totalTrades: number;
    totalProfit: string;
  }> {
    const allUsers = await db.select().from(users);
    const activeUsers = allUsers.filter(u => u.status === 'active');
    const allTrades = await db.select().from(trades);
    const allPortfolios = await db.select().from(portfolios);
    const allDeposits = await db.select().from(deposits).where(eq(deposits.status, 'confirmed'));
    const pendingWithdrawalList = await db.select().from(withdrawals).where(eq(withdrawals.status, 'pending'));
    
    const totalProfit = allPortfolios.reduce((sum, p) => sum + parseFloat(p.totalProfit || "0"), 0);
    const totalDepositAmount = allDeposits.reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);
    const pendingWithdrawalAmount = pendingWithdrawalList.reduce((sum, w) => sum + parseFloat(w.amount || "0"), 0);
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalDeposits: totalDepositAmount.toFixed(2),
      pendingWithdrawals: pendingWithdrawalAmount.toFixed(2),
      totalTrades: allTrades.length,
      totalProfit: totalProfit.toFixed(2),
    };
  }

  // Deposits
  async getAllDeposits(filters?: { status?: string; userId?: string }): Promise<(Deposit & { user?: User })[]> {
    let query = db.select().from(deposits).orderBy(desc(deposits.createdAt));
    
    let allDeposits: Deposit[];
    if (filters?.status && filters?.userId) {
      allDeposits = await db.select().from(deposits)
        .where(and(eq(deposits.status, filters.status), eq(deposits.userId, filters.userId)))
        .orderBy(desc(deposits.createdAt));
    } else if (filters?.status) {
      allDeposits = await db.select().from(deposits)
        .where(eq(deposits.status, filters.status))
        .orderBy(desc(deposits.createdAt));
    } else if (filters?.userId) {
      allDeposits = await db.select().from(deposits)
        .where(eq(deposits.userId, filters.userId))
        .orderBy(desc(deposits.createdAt));
    } else {
      allDeposits = await db.select().from(deposits).orderBy(desc(deposits.createdAt));
    }
    
    const depositsWithUsers = await Promise.all(allDeposits.map(async (d) => {
      const user = await this.getUserById(d.userId);
      return { ...d, user };
    }));
    
    return depositsWithUsers;
  }

  async getDepositById(id: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async createDeposit(data: InsertDeposit): Promise<Deposit> {
    const [deposit] = await db.insert(deposits).values(data).returning();
    return deposit;
  }

  async updateDepositStatus(id: string, status: string, processedBy: string): Promise<Deposit> {
    const [deposit] = await db
      .update(deposits)
      .set({ 
        status, 
        processedBy, 
        processedAt: new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(deposits.id, id))
      .returning();
    
    // If deposit is confirmed, add the amount to user's balance
    if (status === 'confirmed' && deposit) {
      await this.adjustUserBalance(deposit.userId, parseFloat(deposit.amount), 'add');
    }
    
    return deposit;
  }

  // Withdrawals
  async getAllWithdrawals(filters?: { status?: string; userId?: string }): Promise<(Withdrawal & { user?: User })[]> {
    let allWithdrawals: Withdrawal[];
    if (filters?.status && filters?.userId) {
      allWithdrawals = await db.select().from(withdrawals)
        .where(and(eq(withdrawals.status, filters.status), eq(withdrawals.userId, filters.userId)))
        .orderBy(desc(withdrawals.createdAt));
    } else if (filters?.status) {
      allWithdrawals = await db.select().from(withdrawals)
        .where(eq(withdrawals.status, filters.status))
        .orderBy(desc(withdrawals.createdAt));
    } else if (filters?.userId) {
      allWithdrawals = await db.select().from(withdrawals)
        .where(eq(withdrawals.userId, filters.userId))
        .orderBy(desc(withdrawals.createdAt));
    } else {
      allWithdrawals = await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
    }
    
    const withdrawalsWithUsers = await Promise.all(allWithdrawals.map(async (w) => {
      const user = await this.getUserById(w.userId);
      return { ...w, user };
    }));
    
    return withdrawalsWithUsers;
  }

  async getWithdrawalById(id: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal;
  }

  async createWithdrawal(data: InsertWithdrawal): Promise<Withdrawal> {
    // Deduct the amount from user's balance when withdrawal is requested
    await this.adjustUserBalance(data.userId, parseFloat(data.amount), 'subtract');
    
    const [withdrawal] = await db.insert(withdrawals).values(data).returning();
    return withdrawal;
  }

  async updateWithdrawalStatus(id: string, status: string, processedBy: string, rejectionReason?: string): Promise<Withdrawal> {
    const withdrawal = await this.getWithdrawalById(id);
    
    const updateData: any = { 
      status, 
      processedBy, 
      processedAt: new Date(), 
      updatedAt: new Date() 
    };
    
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const [updated] = await db
      .update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, id))
      .returning();
    
    // If withdrawal is rejected, refund the amount to user's balance
    if (status === 'rejected' && withdrawal) {
      await this.adjustUserBalance(withdrawal.userId, parseFloat(withdrawal.amount), 'add');
    }
    
    return updated;
  }

  // Admin Trade Sessions
  async createAdminTradeSession(adminId: string): Promise<AdminTradeSession> {
    const [session] = await db.insert(adminTradeSessions).values({ adminId }).returning();
    return session;
  }

  async getAdminTradeSession(id: string): Promise<AdminTradeSession | undefined> {
    const [session] = await db.select().from(adminTradeSessions).where(eq(adminTradeSessions.id, id));
    return session;
  }

  async getActiveAdminTradeSessions(adminId: string): Promise<AdminTradeSession[]> {
    return db.select().from(adminTradeSessions)
      .where(and(eq(adminTradeSessions.adminId, adminId), eq(adminTradeSessions.status, 'active')))
      .orderBy(desc(adminTradeSessions.createdAt));
  }

  async closeAdminTradeSession(id: string): Promise<AdminTradeSession> {
    const [session] = await db.update(adminTradeSessions)
      .set({ status: 'closed', closedAt: new Date() })
      .where(eq(adminTradeSessions.id, id))
      .returning();
    return session;
  }

  async addUsersToTradeSession(sessionId: string, users: { userId: string; tradeAmount: string }[]): Promise<AdminTradeSessionUser[]> {
    const values = users.map(u => ({ sessionId, userId: u.userId, tradeAmount: u.tradeAmount }));
    const inserted = await db.insert(adminTradeSessionUsers).values(values).returning();
    return inserted;
  }

  async getSessionUsers(sessionId: string): Promise<(AdminTradeSessionUser & { user?: User })[]> {
    const sessionUsers = await db.select().from(adminTradeSessionUsers)
      .where(eq(adminTradeSessionUsers.sessionId, sessionId));
    
    const usersWithDetails = await Promise.all(sessionUsers.map(async (su) => {
      const user = await this.getUserById(su.userId);
      return { ...su, user };
    }));
    
    return usersWithDetails;
  }

  async updateSessionUserAmount(id: string, tradeAmount: string): Promise<AdminTradeSessionUser> {
    const [updated] = await db.update(adminTradeSessionUsers)
      .set({ tradeAmount })
      .where(eq(adminTradeSessionUsers.id, id))
      .returning();
    return updated;
  }

  // Admin Trades
  async createAdminTrade(data: {
    sessionId: string;
    adminId: string;
    userId: string;
    symbol: string;
    name: string;
    assetType: string;
    direction: string;
    amount: string;
    entryPrice: string;
    expiryTime?: Date;
    durationMs?: number;
    durationGroup?: string;
  }): Promise<AdminTrade> {
    const [trade] = await db.insert(adminTrades).values(data).returning();
    return trade;
  }

  async getAdminTrades(filters?: { sessionId?: string; adminId?: string; status?: string; userId?: string }): Promise<(AdminTrade & { user?: User })[]> {
    let allTrades: AdminTrade[];
    
    // Build conditions array dynamically
    const conditions = [];
    if (filters?.sessionId) conditions.push(eq(adminTrades.sessionId, filters.sessionId));
    if (filters?.userId) conditions.push(eq(adminTrades.userId, filters.userId));
    if (filters?.adminId) conditions.push(eq(adminTrades.adminId, filters.adminId));
    if (filters?.status) conditions.push(eq(adminTrades.status, filters.status));
    
    if (conditions.length === 1) {
      // Single condition - don't use and()
      allTrades = await db.select().from(adminTrades)
        .where(conditions[0])
        .orderBy(desc(adminTrades.createdAt));
    } else if (conditions.length > 1) {
      // Multiple conditions - use and()
      allTrades = await db.select().from(adminTrades)
        .where(and(...conditions))
        .orderBy(desc(adminTrades.createdAt));
    } else {
      allTrades = await db.select().from(adminTrades).orderBy(desc(adminTrades.createdAt));
    }
    
    const tradesWithUsers = await Promise.all(allTrades.map(async (t) => {
      const user = await this.getUserById(t.userId);
      return { ...t, user };
    }));
    
    return tradesWithUsers;
  }

  async updateAdminTrade(id: string, data: { exitPrice?: string; profit?: string; status?: string; closedAt?: Date; profitStatus?: string }): Promise<AdminTrade> {
    const [trade] = await db.update(adminTrades)
      .set(data)
      .where(eq(adminTrades.id, id))
      .returning();
    return trade;
  }

  async getUsersWithBalance(): Promise<(User & { balance: string })[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    const usersWithBalance = await Promise.all(allUsers.map(async (user) => {
      const portfolio = await this.getPortfolioByUserId(user.id);
      const balance = portfolio?.balance || "0.00";
      return { ...user, balance };
    }));
    
    return usersWithBalance.filter(u => parseFloat(u.balance) > 0);
  }
}

export const storage = new DatabaseStorage();
