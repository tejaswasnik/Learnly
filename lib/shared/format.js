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
