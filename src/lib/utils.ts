import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMistakeLabel(m: string): string {
  const dictionary: Record<string, string> = {
    holding_losers_too_long: "Holding Losers Too Long",
    early_profit_booking: "Early Profit Booking",
    averaging_down: "Averaging Down",
    single_loss_breached: "Single Loss Breached",
    risk_breached: "Risk Limit Breached",
    daily_loss_breached: "Daily Loss Limit Breached",
    no_stop_loss: "No Stop Loss",
    revenge_trading: "Revenge Trading",
    overtrading: "Overtrading",
    missing_fields: "Missing Fields",
    data_integrity_buy_sell: "Data Integrity (Buy > Sell)",
    data_integrity_symbol_date: "Data Integrity (Symbol/Date)",
    over_risk: "Over Risk",
    plan_not_followed: "Plan Not Followed",
    over_leveraged: "Over Leveraged",
  };
  
  if (dictionary[m]) return dictionary[m];
  
  // Custom checks or simple capitalization
  return m
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

