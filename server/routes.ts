import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { tradeExecutionSchema, insertWatchlistSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

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
      res.json(portfolio);
    } catch (error) {
      console.error("Error adjusting profit:", error);
      res.status(500).json({ message: "Failed to adjust profit" });
    }
  });

  // Get all trades (for admin trade monitoring)
  app.get("/api/admin/trades", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades.map(t => ({
        ...t,
        createdAt: t.createdAt?.toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
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

  return httpServer;
}
