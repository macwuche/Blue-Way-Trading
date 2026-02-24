import { storage } from "./storage";
import { getAllAssetsFromCache } from "./massive-api";
import { sendUserUpdate } from "./sse";
import type { UserPosition, GlobalTradeLogic } from "@shared/schema";
import { sendTradeClosedEmail } from "./email";

let engineInterval: NodeJS.Timeout | null = null;

function getAssetPrice(symbol: string): number | null {
  const assets = getAllAssetsFromCache();
  const asset = assets.find(a => a.symbol === symbol);
  return asset?.price ?? null;
}

function calculatePnl(position: UserPosition, currentPrice: number): number {
  const entryPrice = parseFloat(position.entryPrice);
  const amount = parseFloat(position.amount);

  if (position.direction === "buy") {
    return ((currentPrice - entryPrice) / entryPrice) * amount;
  } else {
    return ((entryPrice - currentPrice) / entryPrice) * amount;
  }
}

function shouldTradeWin(logic: GlobalTradeLogic): boolean {
  const remainingWins = logic.winTrades - logic.currentWins;
  const remainingLosses = logic.lossTrades - logic.currentLosses;
  const remaining = remainingWins + remainingLosses;

  if (remaining <= 0) return Math.random() > 0.5;
  if (remainingWins <= 0) return false;
  if (remainingLosses <= 0) return true;

  return Math.random() < (remainingWins / remaining);
}

async function checkPendingOrders() {
  try {
    const pendingPositions = await storage.getAllPendingPositions();

    for (const position of pendingPositions) {
      const currentPrice = getAssetPrice(position.symbol);
      if (!currentPrice) continue;

      const triggerPrice = position.triggerPrice ? parseFloat(position.triggerPrice) : null;
      if (!triggerPrice) continue;

      let shouldTrigger = false;

      if (position.orderType === "limit") {
        if (position.direction === "buy" && currentPrice <= triggerPrice) {
          shouldTrigger = true;
        } else if (position.direction === "sell" && currentPrice >= triggerPrice) {
          shouldTrigger = true;
        }
      } else if (position.orderType === "stop") {
        if (position.direction === "buy" && currentPrice >= triggerPrice) {
          shouldTrigger = true;
        } else if (position.direction === "sell" && currentPrice <= triggerPrice) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        await storage.updateUserPosition(position.id, {
          status: "open",
          entryPrice: currentPrice.toFixed(8),
          currentPrice: currentPrice.toFixed(8),
          openedAt: new Date(),
        });

        const portfolio = await storage.getPortfolioByUserId(position.userId);
        if (portfolio) {
          const newBalance = (parseFloat(portfolio.balance) - parseFloat(position.amount)).toFixed(2);
          await storage.updatePortfolioBalance(portfolio.id, newBalance, portfolio.totalProfit, portfolio.totalProfitPercent);
        }

        sendUserUpdate(position.userId, {
          type: "position_opened",
          positionId: position.id,
          symbol: position.symbol,
          direction: position.direction,
          orderType: position.orderType,
          entryPrice: currentPrice,
          amount: position.amount,
        });
      }
    }
  } catch (error) {
    console.error("[TradingEngine] Error checking pending orders:", error);
  }
}

async function checkOpenPositions() {
  try {
    const openPositions = await storage.getAllOpenPositions();
    const logic = await storage.getGlobalTradeLogic();

    for (const position of openPositions) {
      const currentPrice = getAssetPrice(position.symbol);
      if (!currentPrice) continue;

      const pnl = calculatePnl(position, currentPrice);

      await storage.updateUserPosition(position.id, {
        currentPrice: currentPrice.toFixed(8),
        unrealizedPnl: pnl.toFixed(2),
      });

      const slTpMode = logic?.slTpMode || "natural_priority";
      const sl = position.stopLoss ? parseFloat(position.stopLoss) : null;
      const tp = position.takeProfit ? parseFloat(position.takeProfit) : null;

      let closeReason: string | null = null;

      if (slTpMode === "natural_priority" || slTpMode === "admin_choose") {
        if (sl !== null) {
          if (position.direction === "buy" && currentPrice <= sl) closeReason = "stop_loss";
          if (position.direction === "sell" && currentPrice >= sl) closeReason = "stop_loss";
        }
        if (tp !== null && !closeReason) {
          if (position.direction === "buy" && currentPrice >= tp) closeReason = "take_profit";
          if (position.direction === "sell" && currentPrice <= tp) closeReason = "take_profit";
        }
      }

      if (closeReason) {
        await closePosition(position, currentPrice, pnl, closeReason);
      }
    }
  } catch (error) {
    console.error("[TradingEngine] Error checking open positions:", error);
  }
}

async function closePosition(position: UserPosition, exitPrice: number, pnl: number, closeReason: string) {
  const logic = await storage.getGlobalTradeLogic();

  let finalPnl = pnl;

  if (logic && logic.active && closeReason === "manual") {
    const isWin = shouldTradeWin(logic);
    if (isWin) {
      finalPnl = Math.abs(pnl) || parseFloat(position.amount) * 0.1;
    } else {
      finalPnl = -(Math.abs(pnl) || parseFloat(position.amount) * 0.1);
    }

    const newWins = logic.currentWins + (isWin ? 1 : 0);
    const newLosses = logic.currentLosses + (isWin ? 0 : 1);
    const totalCompleted = newWins + newLosses;

    if (totalCompleted >= logic.totalTrades) {
      await storage.updateGlobalTradeLogicCounters(0, 0);
    } else {
      await storage.updateGlobalTradeLogicCounters(newWins, newLosses);
    }
  }

  if (closeReason === "stop_loss") {
    finalPnl = -Math.abs(finalPnl || parseFloat(position.amount) * 0.05);
  } else if (closeReason === "take_profit") {
    finalPnl = Math.abs(finalPnl || parseFloat(position.amount) * 0.1);
  }

  const adminProfit = parseFloat(position.adminProfit || "0");
  const totalPnl = finalPnl + adminProfit;

  const closedPosition = await storage.closeUserPosition(
    position.id,
    exitPrice.toFixed(8),
    totalPnl.toFixed(2),
    closeReason
  );

  const portfolio = await storage.getPortfolioByUserId(position.userId);
  if (portfolio) {
    const currentBalance = parseFloat(portfolio.balance);
    const tradeAmount = parseFloat(position.amount);
    const newBalance = (currentBalance + tradeAmount + finalPnl).toFixed(2);
    const currentProfit = parseFloat(portfolio.totalProfit);
    const newProfit = (currentProfit + finalPnl).toFixed(2);
    const profitPercent = parseFloat(newBalance) > 0 ? ((parseFloat(newProfit) / parseFloat(newBalance)) * 100).toFixed(2) : "0.00";

    await storage.updatePortfolioBalance(portfolio.id, newBalance, newProfit, profitPercent);

    sendUserUpdate(position.userId, {
      type: "position_closed",
      positionId: position.id,
      symbol: position.symbol,
      direction: position.direction,
      closeReason,
      realizedPnl: finalPnl.toFixed(2),
      exitPrice: exitPrice.toFixed(8),
      newBalance,
    });

    sendUserUpdate(position.userId, {
      type: "portfolio_update",
      balance: newBalance,
      totalProfit: newProfit,
      totalProfitPercent: profitPercent,
    });

    const user = await storage.getUserById(position.userId);
    if (user?.email) {
      sendTradeClosedEmail(user.email, user.firstName || "Trader", {
        symbol: position.symbol,
        direction: position.direction,
        volume: position.volume,
        entryPrice: position.entryPrice,
        exitPrice: exitPrice.toFixed(8),
        realizedPnl: totalPnl.toFixed(2),
        closeReason,
      }).catch(err => console.error("[Email] Trade closed email error:", err));
    }
  }

  return closedPosition;
}

export async function openPosition(
  userId: string,
  data: {
    symbol: string;
    name: string;
    assetType: string;
    direction: "buy" | "sell";
    orderType: "market" | "limit" | "stop";
    amount: number;
    volume: number;
    entryPrice: number;
    triggerPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    openedByAdmin?: boolean;
    adminId?: string;
  }
): Promise<UserPosition> {
  const portfolio = await storage.getPortfolioByUserId(userId);
  if (!portfolio) throw new Error("No portfolio found");

  const currentBalance = parseFloat(portfolio.balance);

  if (data.orderType === "market") {
    if (data.amount > currentBalance) throw new Error("Insufficient balance");

    const position = await storage.createUserPosition({
      userId,
      symbol: data.symbol,
      name: data.name,
      assetType: data.assetType,
      direction: data.direction,
      orderType: data.orderType,
      status: "open",
      amount: data.amount.toFixed(2),
      volume: data.volume.toFixed(8),
      entryPrice: data.entryPrice.toFixed(8),
      stopLoss: data.stopLoss?.toFixed(8),
      takeProfit: data.takeProfit?.toFixed(8),
      openedByAdmin: data.openedByAdmin || false,
      adminId: data.adminId,
    });

    const newBalance = (currentBalance - data.amount).toFixed(2);
    await storage.updatePortfolioBalance(portfolio.id, newBalance, portfolio.totalProfit, portfolio.totalProfitPercent);

    sendUserUpdate(userId, {
      type: "portfolio_update",
      balance: newBalance,
      totalProfit: portfolio.totalProfit,
      totalProfitPercent: portfolio.totalProfitPercent,
    });

    return position;
  } else {
    const position = await storage.createUserPosition({
      userId,
      symbol: data.symbol,
      name: data.name,
      assetType: data.assetType,
      direction: data.direction,
      orderType: data.orderType,
      status: "pending",
      amount: data.amount.toFixed(2),
      volume: data.volume.toFixed(8),
      entryPrice: data.entryPrice.toFixed(8),
      triggerPrice: data.triggerPrice?.toFixed(8),
      stopLoss: data.stopLoss?.toFixed(8),
      takeProfit: data.takeProfit?.toFixed(8),
      openedByAdmin: data.openedByAdmin || false,
      adminId: data.adminId,
    });

    return position;
  }
}

export async function manualClosePosition(positionId: string): Promise<UserPosition> {
  const position = await storage.getUserPositionById(positionId);
  if (!position) throw new Error("Position not found");
  if (position.status !== "open") throw new Error("Position is not open");

  const currentPrice = getAssetPrice(position.symbol);
  if (!currentPrice) throw new Error("Cannot get current price");

  const pnl = calculatePnl(position, currentPrice);
  return closePosition(position, currentPrice, pnl, "manual");
}

export async function cancelPendingOrder(positionId: string): Promise<UserPosition> {
  const position = await storage.getUserPositionById(positionId);
  if (!position) throw new Error("Position not found");
  if (position.status !== "pending") throw new Error("Position is not pending");

  const updated = await storage.updateUserPosition(positionId, {
    status: "cancelled",
    closedAt: new Date(),
    closeReason: "cancelled",
  });

  return updated;
}

export function startTradingEngine(intervalMs: number = 2000) {
  if (engineInterval) {
    clearInterval(engineInterval);
  }

  console.log(`[TradingEngine] Started with ${intervalMs}ms interval`);

  engineInterval = setInterval(async () => {
    await checkPendingOrders();
    await checkOpenPositions();
  }, intervalMs);
}

export function stopTradingEngine() {
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
    console.log("[TradingEngine] Stopped");
  }
}
