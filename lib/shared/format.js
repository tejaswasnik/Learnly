import { CURRENCY_SYMBOLS } from "./constants.js";

export function formatPrice(amount, currency = "INR") {
  if (!amount) return "Free";
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
