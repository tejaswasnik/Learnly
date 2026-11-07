import mongoose from "mongoose";
import { getConfig } from "@/lib/server/config";

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
