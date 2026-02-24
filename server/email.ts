import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Blue Way Trading <noreply@bluewavetrading.live>";

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error };
    }

    console.log(`[Email] Sent "${subject}" to ${to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Error:", err);
    return { success: false, error: err };
  }
}

const LOGO_URL = "https://accessbluewave.site/logo.png";

function baseTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0 20px;">
          <img src="${LOGO_URL}" alt="Blue Wave Trading" style="height: 48px; max-width: 280px; object-fit: contain;" />
        </div>
        <div style="background: linear-gradient(135deg, #1a1f35 0%, #0d1225 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.08);">
          ${content}
        </div>
        <div style="text-align: center; padding: 24px 0; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Blue Way Trading &copy; ${new Date().getFullYear()}</p>
          <p style="margin: 4px 0 0;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const html = baseTemplate(`
    <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px;">Welcome, ${firstName}!</h2>
    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
      Your Blue Way Trading account has been successfully created. You're now ready to start trading across crypto, forex, stocks, and ETFs.
    </p>
    <div style="background: rgba(0, 122, 255, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(0, 122, 255, 0.2);">
      <p style="color: #60a5fa; font-size: 14px; margin: 0 0 8px; font-weight: 600;">Getting Started:</p>
      <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Explore live market data across multiple asset classes</li>
        <li>Open your first position with market, limit, or stop orders</li>
        <li>Track your portfolio performance in real-time</li>
      </ul>
    </div>
    <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0;">
      If you have any questions, our support team is here to help.
    </p>
  `);

  return sendEmail(to, "Welcome to Blue Way Trading", html);
}

export async function sendTradeOpenedEmail(
  to: string,
  firstName: string,
  data: {
    symbol: string;
    direction: string;
    volume: string;
    entryPrice: string;
    amount: string;
    orderType: string;
    stopLoss?: string;
    takeProfit?: string;
  }
) {
  const directionColor = data.direction === "buy" ? "#34C759" : "#FF3B30";
  const directionLabel = data.direction === "buy" ? "BUY (Long)" : "SELL (Short)";

  const html = baseTemplate(`
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px;">Position Opened</h2>
    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
      Hi ${firstName}, your ${data.orderType} order has been executed.
    </p>
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.06);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Symbol</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${data.symbol}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Direction</td>
          <td style="padding: 8px 0; color: ${directionColor}; font-size: 14px; text-align: right; font-weight: 600;">${directionLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Volume</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${data.volume} lots</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Entry Price</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">$${parseFloat(data.entryPrice).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Amount</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">$${parseFloat(data.amount).toFixed(2)}</td>
        </tr>
        ${data.stopLoss ? `<tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Stop Loss</td>
          <td style="padding: 8px 0; color: #FF3B30; font-size: 14px; text-align: right;">$${parseFloat(data.stopLoss).toFixed(2)}</td>
        </tr>` : ""}
        ${data.takeProfit ? `<tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Take Profit</td>
          <td style="padding: 8px 0; color: #34C759; font-size: 14px; text-align: right;">$${parseFloat(data.takeProfit).toFixed(2)}</td>
        </tr>` : ""}
      </table>
    </div>
    <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0;">
      Monitor your position live on your dashboard.
    </p>
  `);

  return sendEmail(to, `Position Opened: ${data.direction.toUpperCase()} ${data.symbol}`, html);
}

export async function sendTradeClosedEmail(
  to: string,
  firstName: string,
  data: {
    symbol: string;
    direction: string;
    volume: string;
    entryPrice: string;
    exitPrice: string;
    realizedPnl: string;
    closeReason: string;
  }
) {
  const pnl = parseFloat(data.realizedPnl);
  const isProfit = pnl >= 0;
  const pnlColor = isProfit ? "#34C759" : "#FF3B30";
  const pnlSign = isProfit ? "+" : "";

  const reasonLabels: Record<string, string> = {
    manual: "Manual Close",
    stop_loss: "Stop Loss Hit",
    take_profit: "Take Profit Hit",
    admin_close: "Closed by Admin",
    trade_logic: "Trade Logic",
  };
  const closeLabel = reasonLabels[data.closeReason] || data.closeReason;

  const html = baseTemplate(`
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px;">Position Closed</h2>
    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
      Hi ${firstName}, your ${data.symbol} position has been closed.
    </p>
    <div style="text-align: center; padding: 20px; margin: 0 0 20px; background: ${isProfit ? "rgba(52, 199, 89, 0.08)" : "rgba(255, 59, 48, 0.08)"}; border-radius: 12px; border: 1px solid ${isProfit ? "rgba(52, 199, 89, 0.2)" : "rgba(255, 59, 48, 0.2)"};">
      <div style="color: #9ca3af; font-size: 13px; margin-bottom: 4px;">Realized P&L</div>
      <div style="color: ${pnlColor}; font-size: 28px; font-weight: 700;">${pnlSign}$${Math.abs(pnl).toFixed(2)}</div>
    </div>
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.06);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Symbol</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${data.symbol}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Direction</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${data.direction.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Volume</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${data.volume} lots</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Entry Price</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">$${parseFloat(data.entryPrice).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Exit Price</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">$${parseFloat(data.exitPrice).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Close Reason</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${closeLabel}</td>
        </tr>
      </table>
    </div>
  `);

  return sendEmail(to, `Position Closed: ${data.symbol} ${pnlSign}$${Math.abs(pnl).toFixed(2)}`, html);
}

export async function sendBalanceAdjustmentEmail(
  to: string,
  firstName: string,
  data: {
    type: "profit" | "balance";
    amount: number;
    newBalance: string;
  }
) {
  const isPositive = data.amount >= 0;
  const amountColor = isPositive ? "#34C759" : "#FF3B30";
  const sign = isPositive ? "+" : "";
  const typeLabel = data.type === "profit" ? "Profit Adjustment" : "Balance Adjustment";

  const html = baseTemplate(`
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px;">Account Update</h2>
    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
      Hi ${firstName}, an adjustment has been made to your account.
    </p>
    <div style="text-align: center; padding: 20px; margin: 0 0 20px; background: rgba(0, 122, 255, 0.08); border-radius: 12px; border: 1px solid rgba(0, 122, 255, 0.2);">
      <div style="color: #9ca3af; font-size: 13px; margin-bottom: 4px;">${typeLabel}</div>
      <div style="color: ${amountColor}; font-size: 28px; font-weight: 700;">${sign}$${Math.abs(data.amount).toFixed(2)}</div>
    </div>
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.06);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Type</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${typeLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Amount</td>
          <td style="padding: 8px 0; color: ${amountColor}; font-size: 14px; text-align: right; font-weight: 600;">${sign}$${Math.abs(data.amount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">New Balance</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">$${parseFloat(data.newBalance).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0;">
      If you believe this adjustment was made in error, please contact support.
    </p>
  `);

  return sendEmail(to, `Account Update: ${typeLabel}`, html);
}
