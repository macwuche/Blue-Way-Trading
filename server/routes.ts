import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { tradeExecutionSchema, insertWatchlistSchema } from "@shared/schema";

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

  return httpServer;
}
