import { CURRENCY_SYMBOLS } from "./constants.js";

export function formatPrice(amount, currency = "INR") {
  if (!amount) return "Free";
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  const n = Number(amount);
  const digits = Number.isInteger(n) ? 0 : 2;
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Lecture length as mm:ss (e.g. "04:12"), or h:mm:ss for an hour or more. */
export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/** Total course length for headings, e.g. "6 h 40 min" or "45 min". */
export function formatTotalLength(seconds) {
  const minutes = Math.round(Math.max(0, Number(seconds) || 0) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Price with two decimals for previews and forms, e.g. "₹1,499.00". Returns null when the input is not a valid price. */
export function formatPriceExact(value, currency = "INR") {
  const n = typeof value === "string" ? (value.trim() === "" ? NaN : Number(value)) : value;
  if (!Number.isFinite(n) || n < 0) return null;
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

/** "just now", "5 minutes ago", "3 days ago"; a month or more falls back to the date. */
export function formatTimeAgo(iso, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 45) return "just now";
  if (seconds < 3600) return plural(Math.max(1, Math.floor(seconds / 60)), "minute");
  if (seconds < 86400) return plural(Math.floor(seconds / 3600), "hour");
  const days = Math.floor(seconds / 86400);
  return days < 30 ? plural(days, "day") : new Date(iso).toLocaleDateString();
}
