import NodeCache from "node-cache";
import Redis from "ioredis";

const ttlSecondsDefault = 60;

let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch {
    redis = null;
  }
}

const memory = new NodeCache({ stdTTL: ttlSecondsDefault, checkperiod: 120 });

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  if (redis) {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }
  const val = memory.get<T>(key);
  return val ?? null;
}

export async function cacheSet(key: string, value: any, ttlSeconds = ttlSecondsDefault): Promise<void> {
  if (redis) {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return;
  }
  memory.set(key, value, ttlSeconds);
}


