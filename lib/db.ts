import { Pool } from "pg";

const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

// Reuse the pool across hot reloads in development instead of leaking sockets.
if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}
