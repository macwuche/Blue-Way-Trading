import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupCustomAuth, registerCustomAuthRoutes, isAuthenticated } from "./auth";
import { tradeExecutionSchema, insertWatchlistSchema, insertTradeLogicSchema, openPositionSchema } from "@shared/schema";
import { z } from "zod";
import { getMarketData, getAllAssetsFromCache, startMarketDataRefresh } from "./massive-api";
import { fetchMarketNews } from "./marketaux-api";
import { addSSEClient, sendUserUpdate } from "./sse";
import { openPosition, manualClosePosition, cancelPendingOrder, startTradingEngine } from "./trading-engine";

// Middleware to check if user is admin
const isAdmin = async (req: any, res: Response, next: Function) => {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUserById(req.user.claims.sub);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Helper to convert duration in ms to a readable label
function getDurationLabel(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupCustomAuth(app);
  registerCustomAuthRoutes(app);

  startMarketDataRefresh(5000);

  app.get("/api/market-data", async (req: Request, res: Response) => {
    try {
      const data = await getMarketData();
      const assets = getAllAssetsFromCache();
      res.json({
        assets,
        lastFetchTime: data.lastFetchTime,
        stale: Date.now() - data.lastFetchTime > 10000,
      });
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // SSE endpoint for real-time user updates
  app.get("/api/user/events", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user.claims.sub;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send initial heartbeat
    res.write("data: {\"type\":\"connected\"}\n\n");

    addSSEClient(userId, res);

    // Keep alive every 30 seconds
    const keepAlive = setInterval(() => {
      try {
        res.write(": keepalive\n\n");
      } catch {
        clearInterval(keepAlive);
      }
    }, 30000);

    req.on("close", () => {
      clearInterval(keepAlive);
    });
  });

  // Market News API endpoint
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const { symbols, search, published_after, published_before, page, limit } = req.query;
      
      const result = await fetchMarketNews({
        symbols: symbols as string | undefined,
        search: search as string | undefined,
        published_after: published_after as string | undefined,
        published_before: published_before as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      if (!result) {
        return res.json({
          articles: [],
          meta: { found: 0, returned: 0, limit: 10, page: 1 },
          cached: false,
        });
      }

      res.json({
        articles: result.data,
        meta: result.meta,
        cached: Date.now() - result.timestamp < 1000,
        cacheAge: Math.floor((Date.now() - result.timestamp) / 1000),
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get("/api/dashboard", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      let portfolio = await storage.getPortfolioByUserId(userId);
      if (!portfolio) {
        portfolio = await storage.createPortfolio({
          userId,
          balance: "10000.00",
          totalProfit: "0.00",
          totalProfitPercent: "0.00",
        });
      }

      const holdingsData = await storage.getHoldingsByPortfolioId(portfolio.id);
      const tradesData = await storage.getTradesByPortfolioId(portfolio.id);
      const watchlistData = await storage.getWatchlistByUserId(userId);

      res.json({
        portfolio,
        holdings: holdingsData,
        trades: tradesData.map(t => ({
          ...t,
          createdAt: t.createdAt?.toISOString() || new Date().toISOString(),
        })),
        watchlist: watchlistData,
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.post("/api/trades", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const result = tradeExecutionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid trade data", errors: result.error.errors });
      }

      const { symbol, name, assetType, type, quantity, price } = result.data;
      const total = quantity * price;

      let portfolio = await storage.getPortfolioByUserId(userId);
      if (!portfolio) {
        portfolio = await storage.createPortfolio({
          userId,
          balance: "10000.00",
          totalProfit: "0.00",
          totalProfitPercent: "0.00",
        });
      }

      const currentBalance = parseFloat(portfolio.balance);

      if (type === "buy") {
        if (total > currentBalance) {
          return res.status(400).json({ message: "Insufficient balance" });
        }

        const newBalance = (currentBalance - total).toFixed(2);
        await storage.updatePortfolioBalance(portfolio.id, newBalance, portfolio.totalProfit, portfolio.totalProfitPercent);

        const existingHolding = await storage.getHoldingBySymbol(portfolio.id, symbol);
        
        if (existingHolding) {
          const existingQty = parseFloat(existingHolding.quantity);
          const existingAvg = parseFloat(existingHolding.avgBuyPrice);
          const newQty = existingQty + quantity;
          const newAvg = ((existingQty * existingAvg) + (quantity * price)) / newQty;
          
          await storage.updateHolding(
            existingHolding.id,
            newQty.toFixed(8),
            newAvg.toFixed(8),
            price.toFixed(8)
          );
        } else {
          await storage.createHolding({
            portfolioId: portfolio.id,
            symbol,
            name,
            assetType,
            quantity: quantity.toFixed(8),
            avgBuyPrice: price.toFixed(8),
            currentPrice: price.toFixed(8),
          });
        }
      } else {
        const existingHolding = await storage.getHoldingBySymbol(portfolio.id, symbol);
        
        if (!existingHolding) {
          return res.status(400).json({ message: "No holdings to sell" });
        }

        const existingQty = parseFloat(existingHolding.quantity);
        
        if (quantity > existingQty) {
          return res.status(400).json({ message: "Insufficient holdings" });
        }

        const newBalance = (currentBalance + total).toFixed(2);
        const costBasis = quantity * parseFloat(existingHolding.avgBuyPrice);
        const profit = total - costBasis;
        const newTotalProfit = (parseFloat(portfolio.totalProfit) + profit).toFixed(2);
        const initialBalance = 10000;
        const totalValue = parseFloat(newBalance);
        const profitPercent = (((totalValue - initialBalance) / initialBalance) * 100).toFixed(2);
        
        await storage.updatePortfolioBalance(portfolio.id, newBalance, newTotalProfit, profitPercent);

        const newQty = existingQty - quantity;
        
        if (newQty <= 0) {
          await storage.deleteHolding(existingHolding.id);
        } else {
          await storage.updateHolding(
            existingHolding.id,
            newQty.toFixed(8),
            existingHolding.avgBuyPrice,
            price.toFixed(8)
          );
        }
      }

      const trade = await storage.createTrade({
        portfolioId: portfolio.id,
        symbol,
        name,
        assetType,
        type,
        quantity: quantity.toFixed(8),
        price: price.toFixed(8),
        total: total.toFixed(2),
        status: "completed",
      });

      res.json({ 
        success: true, 
        trade: {
          ...trade,
          createdAt: trade.createdAt?.toISOString() || new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error("Error executing trade:", error);
      res.status(500).json({ message: "Failed to execute trade" });
    }
  });

  app.get("/api/watchlist", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getWatchlistByUserId(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationSchema = insertWatchlistSchema.pick({
        symbol: true,
        name: true,
        assetType: true,
      });
      
      const result = validationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const { symbol, name, assetType } = result.data;
      const item = await storage.addToWatchlist({ userId, symbol, name, assetType });
      res.json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:symbol", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { symbol } = req.params;
      
      await storage.removeFromWatchlist(userId, symbol);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Admin authentication check
  app.get("/api/admin/auth", async (req: any, res: Response) => {
    try {
      // Check if user is authenticated via session
      if (!req.user) {
        return res.status(401).json({ isAdmin: false, message: "Not authenticated" });
      }
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ isAdmin: false, message: "Not authenticated" });
      }
      const user = await storage.getUserById(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ isAdmin: false, message: "Not authorized" });
      }
      res.json({ isAdmin: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Error checking admin auth:", error);
      res.status(500).json({ isAdmin: false, message: "Server error" });
    }
  });
  
  // Admin stats/dashboard
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Get all users (with optional search)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const users = await storage.getAllUsers(search);
      
      // Get portfolios for each user to include balance info
      const usersWithBalance = await Promise.all(users.map(async (user) => {
        const portfolio = await storage.getPortfolioByUserId(user.id);
        return {
          ...user,
          balance: portfolio?.balance || "0.00",
          totalProfit: portfolio?.totalProfit || "0.00",
          createdAt: user.createdAt?.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        };
      }));
      
      res.json(usersWithBalance);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get single user details
  app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const portfolio = await storage.getPortfolioByUserId(user.id);
      const trades = portfolio ? await storage.getTradesByPortfolioId(portfolio.id) : [];
      
      res.json({
        ...user,
        balance: portfolio?.balance || "0.00",
        totalProfit: portfolio?.totalProfit || "0.00",
        trades: trades.map(t => ({
          ...t,
          createdAt: t.createdAt?.toISOString(),
        })),
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user profile with full details (for profile page)
  app.get("/api/admin/users/:id/profile", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const portfolio = await storage.getPortfolioByUserId(user.id);
      const trades = portfolio ? await storage.getTradesByPortfolioId(portfolio.id) : [];
      
      // Get admin trades for this user
      const adminTradesForUser = await storage.getAdminTrades({ userId: user.id });
      
      // Get total withdrawals for this user (sum of approved withdrawals)
      const userWithdrawals = await storage.getAllWithdrawals({ userId: user.id });
      const totalWithdrawals = userWithdrawals
        .filter(w => w.status === "approved")
        .reduce((sum, w) => sum + parseFloat(w.amount), 0);
      
      // Get total referrals (users who have this user as their referrer)
      const allUsers = await storage.getAllUsers();
      const totalReferrals = allUsers.filter(u => u.referredBy === user.id).length;
      
      res.json({
        ...user,
        balance: portfolio?.balance || "0.00",
        totalProfit: portfolio?.totalProfit || "0.00",
        totalTransactions: trades.length,
        totalWithdrawals: totalWithdrawals.toFixed(2),
        totalReferrals,
        trades: trades.slice(0, 50).map(t => ({
          ...t,
          createdAt: t.createdAt?.toISOString(),
        })),
        adminTrades: adminTradesForUser.slice(0, 10).map(t => ({
          ...t,
          createdAt: t.createdAt?.toISOString(),
          closedAt: t.closedAt?.toISOString(),
          expiryTime: t.expiryTime?.toISOString(),
        })),
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Get all admin trades (for All Admin Trades page)
  app.get("/api/admin/trades", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const allAdminTrades = await storage.getAdminTrades();
      res.json(allAdminTrades.map(t => ({
        ...t,
        createdAt: t.createdAt?.toISOString(),
        closedAt: t.closedAt?.toISOString(),
        expiryTime: t.expiryTime?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching admin trades:", error);
      res.status(500).json({ message: "Failed to fetch admin trades" });
    }
  });

  // Update user status (active/suspended/pending)
  app.patch("/api/admin/users/:id/status", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({ status: z.enum(["active", "suspended", "pending"]) });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const user = await storage.updateUserStatus(req.params.id, result.data.status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Update user VIP level
  app.patch("/api/admin/users/:id/vip", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({ 
        vipLevel: z.enum(["Bronze", "Silver", "Gold", "Platinum", "Diamond"]),
        customPayoutRate: z.string().optional()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid VIP level" });
      }
      const user = await storage.updateUserVipLevel(req.params.id, result.data.vipLevel, result.data.customPayoutRate);
      res.json(user);
    } catch (error) {
      console.error("Error updating VIP level:", error);
      res.status(500).json({ message: "Failed to update VIP level" });
    }
  });

  // Verify/unverify user
  app.patch("/api/admin/users/:id/verify", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({ isVerified: z.boolean() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data" });
      }
      const user = await storage.updateUserVerification(req.params.id, result.data.isVerified);
      res.json(user);
    } catch (error) {
      console.error("Error updating verification:", error);
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  // Update user verification fields (emailVerified, twoFactorEnabled, kycVerified)
  app.patch("/api/admin/users/:id/verification", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({ 
        field: z.enum(["emailVerified", "twoFactorEnabled", "kycVerified"]),
        value: z.boolean()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data" });
      }
      const user = await storage.updateUserVerificationField(req.params.id, result.data.field, result.data.value);
      res.json(user);
    } catch (error) {
      console.error("Error updating verification field:", error);
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  // Adjust user balance
  app.post("/api/admin/users/:id/balance", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({ 
        amount: z.number().positive(),
        operation: z.enum(["add", "subtract"])
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data" });
      }
      const portfolio = await storage.adjustUserBalance(req.params.id, result.data.amount, result.data.operation);

      // Send real-time update to the affected user
      sendUserUpdate(req.params.id, {
        type: "portfolio_update",
        balance: portfolio.balance,
        totalProfit: portfolio.totalProfit,
        totalProfitPercent: portfolio.totalProfitPercent,
      });

      res.json(portfolio);
    } catch (error) {
      console.error("Error adjusting balance:", error);
      res.status(500).json({ message: "Failed to adjust balance" });
    }
  });

  // Adjust user profit
  app.post("/api/admin/users/:id/profit", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({ 
        amount: z.number().positive(),
        operation: z.enum(["add", "subtract"])
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data" });
      }
      const portfolio = await storage.adjustUserProfit(req.params.id, result.data.amount, result.data.operation);

      // Send real-time update to the affected user
      sendUserUpdate(req.params.id, {
        type: "portfolio_update",
        balance: portfolio.balance,
        totalProfit: portfolio.totalProfit,
        totalProfitPercent: portfolio.totalProfitPercent,
      });

      res.json(portfolio);
    } catch (error) {
      console.error("Error adjusting profit:", error);
      res.status(500).json({ message: "Failed to adjust profit" });
    }
  });

  // Admin trade for user
  app.post("/api/admin/trade-for-user", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({
        userId: z.string(),
        symbol: z.string().min(1),
        name: z.string().min(1),
        assetType: z.string().min(1),
        type: z.enum(["buy", "sell"]),
        quantity: z.number().positive(),
        price: z.number().positive(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid trade data", errors: result.error.errors });
      }

      const { userId, symbol, name, assetType, type, quantity, price } = result.data;
      const total = quantity * price;

      let portfolio = await storage.getPortfolioByUserId(userId);
      if (!portfolio) {
        portfolio = await storage.createPortfolio({
          userId,
          balance: "10000.00",
          totalProfit: "0.00",
          totalProfitPercent: "0.00",
        });
      }

      const currentBalance = parseFloat(portfolio.balance);

      if (type === "buy") {
        if (total > currentBalance) {
          return res.status(400).json({ message: "Insufficient balance for user" });
        }

        const newBalance = (currentBalance - total).toFixed(2);
        await storage.updatePortfolioBalance(portfolio.id, newBalance, portfolio.totalProfit, portfolio.totalProfitPercent);

        const existingHolding = await storage.getHoldingBySymbol(portfolio.id, symbol);
        
        if (existingHolding) {
          const existingQty = parseFloat(existingHolding.quantity);
          const existingAvg = parseFloat(existingHolding.avgBuyPrice);
          const newQty = existingQty + quantity;
          const newAvg = ((existingQty * existingAvg) + (quantity * price)) / newQty;
          
          await storage.updateHolding(
            existingHolding.id,
            newQty.toFixed(8),
            newAvg.toFixed(8),
            price.toFixed(8)
          );
        } else {
          await storage.createHolding({
            portfolioId: portfolio.id,
            symbol,
            name,
            assetType,
            quantity: quantity.toFixed(8),
            avgBuyPrice: price.toFixed(8),
            currentPrice: price.toFixed(8),
          });
        }
      } else {
        const existingHolding = await storage.getHoldingBySymbol(portfolio.id, symbol);
        
        if (!existingHolding) {
          return res.status(400).json({ message: "User has no holdings to sell" });
        }

        const existingQty = parseFloat(existingHolding.quantity);
        
        if (quantity > existingQty) {
          return res.status(400).json({ message: "Insufficient holdings for user" });
        }

        const newBalance = (currentBalance + total).toFixed(2);
        const costBasis = quantity * parseFloat(existingHolding.avgBuyPrice);
        const profit = total - costBasis;
        const newTotalProfit = (parseFloat(portfolio.totalProfit) + profit).toFixed(2);
        const initialBalance = 10000;
        const totalValue = parseFloat(newBalance);
        const profitPercent = (((totalValue - initialBalance) / initialBalance) * 100).toFixed(2);
        
        await storage.updatePortfolioBalance(portfolio.id, newBalance, newTotalProfit, profitPercent);

        const newQty = existingQty - quantity;
        
        if (newQty <= 0) {
          await storage.deleteHolding(existingHolding.id);
        } else {
          await storage.updateHolding(
            existingHolding.id,
            newQty.toFixed(8),
            existingHolding.avgBuyPrice,
            price.toFixed(8)
          );
        }
      }

      const trade = await storage.createTrade({
        portfolioId: portfolio.id,
        symbol,
        name,
        assetType,
        type,
        quantity: quantity.toFixed(8),
        price: price.toFixed(8),
        total: total.toFixed(2),
        status: "completed",
      });

      res.json({ 
        success: true, 
        trade: {
          ...trade,
          createdAt: trade.createdAt?.toISOString() || new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error("Error executing trade for user:", error);
      res.status(500).json({ message: "Failed to execute trade for user" });
    }
  });

  // ============ DEPOSIT ROUTES ============
  
  // Get all deposits (admin)
  app.get("/api/admin/deposits", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { status, userId } = req.query;
      const filters: { status?: string; userId?: string } = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      
      const depositList = await storage.getAllDeposits(filters);
      res.json(depositList.map(d => ({
        ...d,
        createdAt: d.createdAt?.toISOString(),
        updatedAt: d.updatedAt?.toISOString(),
        processedAt: d.processedAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  // Create deposit (user)
  app.post("/api/deposits", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        currency: z.string().default("USD"),
        method: z.string().min(1),
        transactionId: z.string().optional(),
        note: z.string().optional(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid deposit data", errors: result.error.errors });
      }

      const deposit = await storage.createDeposit({
        userId,
        amount: result.data.amount,
        currency: result.data.currency,
        method: result.data.method,
        transactionId: result.data.transactionId,
        note: result.data.note,
        status: "pending",
      });
      
      res.json({
        ...deposit,
        createdAt: deposit.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error creating deposit:", error);
      res.status(500).json({ message: "Failed to create deposit" });
    }
  });

  // Get user's deposits
  app.get("/api/deposits", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const depositList = await storage.getAllDeposits({ userId });
      res.json(depositList.map(d => ({
        ...d,
        createdAt: d.createdAt?.toISOString(),
        updatedAt: d.updatedAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching user deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  // Approve/Reject deposit (admin)
  app.patch("/api/admin/deposits/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      const schema = z.object({
        status: z.enum(["confirmed", "rejected"]),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status", errors: result.error.errors });
      }

      const deposit = await storage.updateDepositStatus(id, result.data.status, adminId);
      res.json({
        ...deposit,
        createdAt: deposit.createdAt?.toISOString(),
        updatedAt: deposit.updatedAt?.toISOString(),
        processedAt: deposit.processedAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error updating deposit:", error);
      res.status(500).json({ message: "Failed to update deposit" });
    }
  });

  // ============ WITHDRAWAL ROUTES ============
  
  // Get all withdrawals (admin)
  app.get("/api/admin/withdrawals", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { status, userId } = req.query;
      const filters: { status?: string; userId?: string } = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      
      const withdrawalList = await storage.getAllWithdrawals(filters);
      res.json(withdrawalList.map(w => ({
        ...w,
        createdAt: w.createdAt?.toISOString(),
        updatedAt: w.updatedAt?.toISOString(),
        processedAt: w.processedAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Create withdrawal (user)
  app.post("/api/withdrawals", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        currency: z.string().default("USD"),
        method: z.string().min(1),
        destination: z.string().min(1),
        note: z.string().optional(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid withdrawal data", errors: result.error.errors });
      }

      // Check if user has sufficient balance
      const portfolio = await storage.getPortfolioByUserId(userId);
      if (!portfolio || parseFloat(portfolio.balance) < parseFloat(result.data.amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const withdrawal = await storage.createWithdrawal({
        userId,
        amount: result.data.amount,
        currency: result.data.currency,
        method: result.data.method,
        destination: result.data.destination,
        note: result.data.note,
        status: "pending",
      });
      
      res.json({
        ...withdrawal,
        createdAt: withdrawal.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ message: "Failed to create withdrawal" });
    }
  });

  // Get user's withdrawals
  app.get("/api/withdrawals", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const withdrawalList = await storage.getAllWithdrawals({ userId });
      res.json(withdrawalList.map(w => ({
        ...w,
        createdAt: w.createdAt?.toISOString(),
        updatedAt: w.updatedAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching user withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Approve/Reject withdrawal (admin)
  app.patch("/api/admin/withdrawals/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      const schema = z.object({
        status: z.enum(["approved", "completed", "rejected"]),
        rejectionReason: z.string().optional(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status", errors: result.error.errors });
      }

      const withdrawal = await storage.updateWithdrawalStatus(
        id, 
        result.data.status, 
        adminId, 
        result.data.rejectionReason
      );
      res.json({
        ...withdrawal,
        createdAt: withdrawal.createdAt?.toISOString(),
        updatedAt: withdrawal.updatedAt?.toISOString(),
        processedAt: withdrawal.processedAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });

  // ============ ADMIN TRADE SESSIONS ============

  // Get users with balance (for selection)
  app.get("/api/admin/users-with-balance", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const users = await storage.getUsersWithBalance();
      res.json(users.map(u => ({
        ...u,
        createdAt: u.createdAt?.toISOString(),
        updatedAt: u.updatedAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching users with balance:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create admin trade session
  app.post("/api/admin/trade-sessions", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const adminId = req.user.claims.sub;
      const schema = z.object({
        users: z.array(z.object({
          userId: z.string(),
          tradeAmount: z.string(),
        })).min(1),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const session = await storage.createAdminTradeSession(adminId);
      await storage.addUsersToTradeSession(session.id, result.data.users);
      const sessionUsers = await storage.getSessionUsers(session.id);
      
      res.json({
        ...session,
        users: sessionUsers,
        createdAt: session.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error creating trade session:", error);
      res.status(500).json({ message: "Failed to create trade session" });
    }
  });

  // Get admin trade sessions
  app.get("/api/admin/trade-sessions", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const adminId = req.user.claims.sub;
      const sessions = await storage.getActiveAdminTradeSessions(adminId);
      
      const sessionsWithUsers = await Promise.all(sessions.map(async (s) => {
        const users = await storage.getSessionUsers(s.id);
        return {
          ...s,
          users,
          createdAt: s.createdAt?.toISOString(),
        };
      }));
      
      res.json(sessionsWithUsers);
    } catch (error) {
      console.error("Error fetching trade sessions:", error);
      res.status(500).json({ message: "Failed to fetch trade sessions" });
    }
  });

  // Get single session with users
  app.get("/api/admin/trade-sessions/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const session = await storage.getAdminTradeSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const users = await storage.getSessionUsers(session.id);
      res.json({
        ...session,
        users,
        createdAt: session.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching trade session:", error);
      res.status(500).json({ message: "Failed to fetch trade session" });
    }
  });

  // Close trade session
  app.patch("/api/admin/trade-sessions/:id/close", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const session = await storage.closeAdminTradeSession(req.params.id);
      res.json({
        ...session,
        createdAt: session.createdAt?.toISOString(),
        closedAt: session.closedAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error closing trade session:", error);
      res.status(500).json({ message: "Failed to close trade session" });
    }
  });

  // Execute batch trade for session users (supports multi-asset with individual durations)
  app.post("/api/admin/trade-sessions/:id/trade", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const adminId = req.user.claims.sub;
      const sessionId = req.params.id;
      
      // Schema for single asset trade (legacy support)
      const singleAssetSchema = z.object({
        symbol: z.string().min(1),
        name: z.string().min(1),
        assetType: z.string().min(1),
        direction: z.enum(["higher", "lower"]),
        entryPrice: z.number().positive(),
        expiryMs: z.number().positive(),
      });
      
      // Schema for multi-asset trades with individual durations
      const multiAssetSchema = z.object({
        assets: z.array(z.object({
          symbol: z.string().min(1),
          name: z.string().min(1),
          assetType: z.string().min(1),
          entryPrice: z.number().positive(),
          durationMs: z.number().positive(),
          durationLabel: z.string(), // e.g., "30s", "1h", "1d"
        })),
        direction: z.enum(["higher", "lower"]),
      });
      
      const sessionUsers = await storage.getSessionUsers(sessionId);
      let allTrades: any[] = [];
      
      // Check if multi-asset request
      if (req.body.assets) {
        const result = multiAssetSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ message: "Invalid trade data", errors: result.error.errors });
        }
        
        const { assets, direction } = result.data;
        
        // Create trades for each asset and each user
        for (const asset of assets) {
          const trades = await Promise.all(sessionUsers.map(async (su) => {
            const amount = parseFloat(su.tradeAmount);
            
            const adminTrade = await storage.createAdminTrade({
              sessionId,
              adminId,
              userId: su.userId,
              symbol: asset.symbol,
              name: asset.name,
              assetType: asset.assetType,
              direction,
              amount: amount.toFixed(2),
              entryPrice: asset.entryPrice.toFixed(8),
              expiryTime: new Date(Date.now() + asset.durationMs),
              durationMs: asset.durationMs,
              durationGroup: asset.durationLabel,
            });

            // Create trade record for user
            const portfolio = await storage.getPortfolioByUserId(su.userId);
            if (portfolio) {
              await storage.createTrade({
                portfolioId: portfolio.id,
                symbol: asset.symbol,
                name: asset.name,
                assetType: asset.assetType,
                type: direction === "higher" ? "buy" : "sell",
                quantity: (amount / asset.entryPrice).toFixed(8),
                price: asset.entryPrice.toFixed(8),
                total: amount.toFixed(2),
                status: "pending",
              });
            }

            return adminTrade;
          }));
          allTrades.push(...trades);
        }
      } else {
        // Legacy single asset trade
        const result = singleAssetSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ message: "Invalid trade data", errors: result.error.errors });
        }

        const { symbol, name, assetType, direction, entryPrice, expiryMs } = result.data;
        
        const trades = await Promise.all(sessionUsers.map(async (su) => {
          const amount = parseFloat(su.tradeAmount);
          
          const adminTrade = await storage.createAdminTrade({
            sessionId,
            adminId,
            userId: su.userId,
            symbol,
            name,
            assetType,
            direction,
            amount: amount.toFixed(2),
            entryPrice: entryPrice.toFixed(8),
            expiryTime: new Date(Date.now() + expiryMs),
            durationMs: expiryMs,
            durationGroup: getDurationLabel(expiryMs),
          });

          const portfolio = await storage.getPortfolioByUserId(su.userId);
          if (portfolio) {
            await storage.createTrade({
              portfolioId: portfolio.id,
              symbol,
              name,
              assetType,
              type: direction === "higher" ? "buy" : "sell",
              quantity: (amount / entryPrice).toFixed(8),
              price: entryPrice.toFixed(8),
              total: amount.toFixed(2),
              status: "pending",
            });
          }

          return adminTrade;
        }));
        allTrades = trades;
      }

      res.json({ success: true, trades: allTrades });
    } catch (error) {
      console.error("Error executing batch trade:", error);
      res.status(500).json({ message: "Failed to execute batch trade" });
    }
  });

  // Complete trades when countdown expires
  app.post("/api/admin/trades/complete", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({
        tradeIds: z.array(z.string()),
        exitPrice: z.number().positive(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const { tradeIds, exitPrice } = result.data;
      const now = new Date();

      const updatedTrades = await Promise.all(tradeIds.map(async (tradeId) => {
        const trade = await storage.updateAdminTrade(tradeId, {
          exitPrice: exitPrice.toFixed(8),
          status: "completed",
          closedAt: now,
        });
        return trade;
      }));

      // Invalidate queries to update UI
      res.json({ success: true, trades: updatedTrades });
    } catch (error) {
      console.error("Error completing trades:", error);
      res.status(500).json({ message: "Failed to complete trades" });
    }
  });

  // Get admin trades history
  app.get("/api/admin/trades-history", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const adminId = req.user.claims.sub;
      const { status } = req.query;
      
      const trades = await storage.getAdminTrades({ 
        adminId, 
        status: status as string | undefined 
      });
      
      res.json(trades.map(t => ({
        ...t,
        createdAt: t.createdAt?.toISOString(),
        closedAt: t.closedAt?.toISOString(),
        expiryTime: t.expiryTime?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching admin trades:", error);
      res.status(500).json({ message: "Failed to fetch admin trades" });
    }
  });

  // Add profit to users (legacy endpoint)
  app.post("/api/admin/trade-sessions/:id/add-profit", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const sessionId = req.params.id;
      const schema = z.object({
        profitAmounts: z.array(z.object({
          userId: z.string(),
          amount: z.number(),
        })),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const results = await Promise.all(result.data.profitAmounts.map(async ({ userId, amount }) => {
        // Add to balance
        const portfolio = await storage.adjustUserBalance(userId, Math.abs(amount), amount >= 0 ? 'add' : 'subtract');
        // Track profit
        await storage.adjustUserProfit(userId, Math.abs(amount), amount >= 0 ? 'add' : 'subtract');

        // Send real-time update to the affected user
        sendUserUpdate(userId, {
          type: "portfolio_update",
          balance: portfolio.balance,
          totalProfit: portfolio.totalProfit,
          totalProfitPercent: portfolio.totalProfitPercent,
        });

        return { userId, newBalance: portfolio.balance };
      }));

      res.json({ success: true, results });
    } catch (error) {
      console.error("Error adding profit:", error);
      res.status(500).json({ message: "Failed to add profit" });
    }
  });

  // Get trades awaiting profit (completed but profit not yet added)
  app.get("/api/admin/trades/awaiting-profit", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const adminId = req.user.claims.sub;
      const { sessionId, durationGroup } = req.query;
      
      const trades = await storage.getAdminTrades({ 
        adminId,
        sessionId: sessionId as string | undefined,
        status: "completed"
      });
      
      // Filter trades where profit status is pending
      const awaitingProfit = trades.filter(t => t.profitStatus === "pending" || !t.profitStatus);
      
      // Optionally filter by duration group
      const filtered = durationGroup 
        ? awaitingProfit.filter(t => t.durationGroup === durationGroup)
        : awaitingProfit;
      
      res.json(filtered.map(t => ({
        ...t,
        createdAt: t.createdAt?.toISOString(),
        closedAt: t.closedAt?.toISOString(),
        expiryTime: t.expiryTime?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching trades awaiting profit:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Add profit to specific trades (new endpoint for popup flow)
  app.post("/api/admin/trades/add-profit", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const schema = z.object({
        tradeIds: z.array(z.string()),
        profitPerTrade: z.record(z.string(), z.number()), // { tradeId: profitAmount }
        mode: z.enum(["group", "singular"]), // group = all at once, singular = one at a time
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const { tradeIds, profitPerTrade, mode } = result.data;
      
      const results = await Promise.all(tradeIds.map(async (tradeId) => {
        const profit = profitPerTrade[tradeId] || 0;
        
        // Update trade with profit
        const trade = await storage.updateAdminTrade(tradeId, {
          profit: profit.toFixed(2),
          profitStatus: "profit_added",
        });
        
        if (trade) {
          // Add profit to user's balance
          const portfolio = await storage.adjustUserBalance(
            trade.userId, 
            Math.abs(profit), 
            profit >= 0 ? 'add' : 'subtract'
          );
          await storage.adjustUserProfit(
            trade.userId, 
            Math.abs(profit), 
            profit >= 0 ? 'add' : 'subtract'
          );

          // Send real-time update to the affected user
          sendUserUpdate(trade.userId, {
            type: "portfolio_update",
            balance: portfolio.balance,
            totalProfit: portfolio.totalProfit,
            totalProfitPercent: portfolio.totalProfitPercent,
          });
          
          return { 
            tradeId, 
            userId: trade.userId, 
            profit, 
            newBalance: portfolio.balance 
          };
        }
        return null;
      }));

      res.json({ success: true, results: results.filter(r => r !== null) });
    } catch (error) {
      console.error("Error adding profit to trades:", error);
      res.status(500).json({ message: "Failed to add profit" });
    }
  });

  // Get active trades for a specific user (for user dashboard notification)
  app.get("/api/user/active-trades", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const trades = await storage.getAdminTrades({ userId, status: "active" });
      
      res.json(trades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        name: t.name,
        assetType: t.assetType,
        direction: t.direction,
        amount: t.amount,
        entryPrice: t.entryPrice,
        expiryTime: t.expiryTime?.toISOString(),
        durationMs: t.durationMs,
        createdAt: t.createdAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching user active trades:", error);
      res.status(500).json({ message: "Failed to fetch active trades" });
    }
  });

  // ========= Trade Logic Routes =========
  app.get("/api/admin/trade-logic", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const allLogic = await storage.getAllTradeLogic();
      res.json(allLogic);
    } catch (error) {
      console.error("Error fetching trade logic:", error);
      res.status(500).json({ message: "Failed to fetch trade logic" });
    }
  });

  app.get("/api/admin/trade-logic/:userId", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const logic = await storage.getTradeLogicByUserId(req.params.userId);
      if (!logic) {
        return res.status(404).json({ message: "No trade logic found for this user" });
      }
      res.json(logic);
    } catch (error) {
      console.error("Error fetching trade logic:", error);
      res.status(500).json({ message: "Failed to fetch trade logic" });
    }
  });

  const tradeLogicBodySchema = insertTradeLogicSchema.extend({
    totalTrades: z.number().int().min(1).max(100),
    winTrades: z.number().int().min(0),
    lossTrades: z.number().int().min(0),
  }).refine(data => data.winTrades + data.lossTrades === data.totalTrades, {
    message: "Win trades + Loss trades must equal Total trades",
  });

  app.post("/api/admin/trade-logic", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const parsed = tradeLogicBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const logic = await storage.upsertTradeLogic(parsed.data);
      res.json(logic);
    } catch (error) {
      console.error("Error saving trade logic:", error);
      res.status(500).json({ message: "Failed to save trade logic" });
    }
  });

  app.patch("/api/admin/trade-logic/:id/reset", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const logic = await storage.resetTradeLogicCounters(req.params.id);
      res.json(logic);
    } catch (error) {
      console.error("Error resetting trade logic:", error);
      res.status(500).json({ message: "Failed to reset trade logic" });
    }
  });

  app.delete("/api/admin/trade-logic/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      await storage.deleteTradeLogic(req.params.id);
      res.json({ message: "Trade logic deleted" });
    } catch (error) {
      console.error("Error deleting trade logic:", error);
      res.status(500).json({ message: "Failed to delete trade logic" });
    }
  });

  // ===== USER POSITIONS / TRADING ENGINE =====

  app.post("/api/positions/open", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const data = openPositionSchema.parse(req.body);
      const position = await openPosition(userId, data);
      res.json(position);
    } catch (error: any) {
      console.error("Error opening position:", error);
      res.status(400).json({ message: error.message || "Failed to open position" });
    }
  });

  app.get("/api/positions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const status = req.query.status as string | undefined;
      const positions = await storage.getUserPositions(userId, status);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions/:id/close", isAuthenticated, async (req: any, res: Response) => {
    try {
      const position = await storage.getUserPositionById(req.params.id);
      if (!position) return res.status(404).json({ message: "Position not found" });
      if (position.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });
      const closed = await manualClosePosition(req.params.id);
      res.json(closed);
    } catch (error: any) {
      console.error("Error closing position:", error);
      res.status(400).json({ message: error.message || "Failed to close position" });
    }
  });

  app.post("/api/positions/:id/cancel", isAuthenticated, async (req: any, res: Response) => {
    try {
      const position = await storage.getUserPositionById(req.params.id);
      if (!position) return res.status(404).json({ message: "Position not found" });
      if (position.userId !== req.user.claims.sub) return res.status(403).json({ message: "Not authorized" });
      const cancelled = await cancelPendingOrder(req.params.id);
      res.json(cancelled);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      res.status(400).json({ message: error.message || "Failed to cancel order" });
    }
  });

  // Admin: open position for a user
  app.post("/api/admin/positions/open", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { userId, ...data } = req.body;
      if (!userId) return res.status(400).json({ message: "userId required" });
      const parsed = openPositionSchema.parse(data);
      const position = await openPosition(userId, { ...parsed, openedByAdmin: true, adminId: req.user.claims.sub });
      res.json(position);
    } catch (error: any) {
      console.error("Error opening position for user:", error);
      res.status(400).json({ message: error.message || "Failed to open position" });
    }
  });

  // Admin: close position for a user
  app.post("/api/admin/positions/:id/close", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const closed = await manualClosePosition(req.params.id);
      res.json(closed);
    } catch (error: any) {
      console.error("Error closing position for user:", error);
      res.status(400).json({ message: error.message || "Failed to close position" });
    }
  });

  // Admin: get all open positions across all users
  app.get("/api/admin/positions-open", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const positions = await storage.getAllOpenPositions();
      const pendingPositions = await storage.getAllPendingPositions();
      const allUsers = await storage.getAllUsers();
      const userMap: Record<string, any> = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      const enriched = [...positions, ...pendingPositions].map(p => ({
        ...p,
        userName: userMap[p.userId] ? [userMap[p.userId].firstName, userMap[p.userId].lastName].filter(Boolean).join(" ") || userMap[p.userId].email || p.userId : p.userId,
        userEmail: userMap[p.userId]?.email || null,
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching all open positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Admin: get all closed positions across all users
  app.get("/api/admin/positions-closed", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const positions = await storage.getAllClosedPositions();
      const allUsers = await storage.getAllUsers();
      const userMap: Record<string, any> = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      const enriched = positions.map(p => ({
        ...p,
        userName: userMap[p.userId] ? [userMap[p.userId].firstName, userMap[p.userId].lastName].filter(Boolean).join(" ") || userMap[p.userId].email || p.userId : p.userId,
        userEmail: userMap[p.userId]?.email || null,
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching closed positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Admin: get positions for a specific user
  app.get("/api/admin/positions/:userId", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const positions = await storage.getUserPositions(req.params.userId, req.query.status as string | undefined);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching user positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // ===== GLOBAL TRADE LOGIC =====

  app.get("/api/admin/global-trade-logic", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      let logic = await storage.getGlobalTradeLogic();
      if (!logic) {
        logic = await storage.upsertGlobalTradeLogic({});
      }
      res.json(logic);
    } catch (error) {
      console.error("Error fetching global trade logic:", error);
      res.status(500).json({ message: "Failed to fetch global trade logic" });
    }
  });

  app.post("/api/admin/global-trade-logic", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { totalTrades, winTrades, lossTrades, slTpMode, active } = req.body;
      const logic = await storage.upsertGlobalTradeLogic({
        totalTrades, winTrades, lossTrades, slTpMode, active
      });
      res.json(logic);
    } catch (error) {
      console.error("Error updating global trade logic:", error);
      res.status(500).json({ message: "Failed to update global trade logic" });
    }
  });

  app.post("/api/admin/global-trade-logic/reset", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const logic = await storage.resetGlobalTradeLogicCounters();
      res.json(logic);
    } catch (error) {
      console.error("Error resetting global trade logic:", error);
      res.status(500).json({ message: "Failed to reset global trade logic" });
    }
  });

  // Start the trading engine
  startTradingEngine();

  return httpServer;
}
