import dns from "node:dns";
import mongoose from "mongoose";
import { getConfig } from "@/lib/server/config";

// Optional: some local setups (VPN/WARP/DNS proxies) break SRV lookups, which mongodb+srv:// needs.
// Setting DNS_SERVERS=8.8.8.8,1.1.1.1 makes Node resolve through those servers instead. Unset in production.
if (process.env.DNS_SERVERS) {
  try {
    const servers = process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean);
    dns.setServers(servers);
    dns.promises.setServers(servers); // the MongoDB driver resolves SRV records through the promises API
  } catch (err) {
    console.error("Ignoring invalid DNS_SERVERS:", err.message);
  }
}

const globalCache = globalThis.__mongoose || (globalThis.__mongoose = { conn: null, promise: null });

export async function connectDb() {
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(getConfig().MONGO_URI, { bufferCommands: false })
      .catch((err) => {
        globalCache.promise = null;
        throw err;
      });
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
