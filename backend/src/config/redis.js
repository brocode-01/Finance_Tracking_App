const Redis = require('ioredis');

let redis;
let isConnected = false;

const getRedisClient = () => {
  if (!redis) {
    const password = process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== ''
      ? process.env.REDIS_PASSWORD
      : undefined;

    redis = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        })
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          ...(password && { password }),
          tls: process.env.NODE_ENV === 'production' ? {} : undefined,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 200, 2000);
          },
        });

    redis.on('connect', () => { isConnected = true; console.log(' Redis connected'); });
    redis.on('ready', () => { isConnected = true; console.log(' Redis ready'); });
    redis.on('error', (err) => { isConnected = false; console.error(' Redis error:', err.message); });
    redis.on('close', () => { isConnected = false; });
  }
  return redis;
};

const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    if (!isConnected) return null;
    const data = await client.get(key);
    if (data) { console.log(` Cache HIT: ${key}`); return JSON.parse(data); }
    console.log(` Cache MISS: ${key}`);
    return null;
  } catch (err) {
    console.error('Cache GET error:', err.message);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 900) => {
  try {
    const client = getRedisClient();
    if (!isConnected) return;
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    console.log(` Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error('Cache SET error:', err.message);
  }
};

const cacheDel = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!isConnected) return;
    if (pattern.includes('*')) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(...keys);
    } else {
      await client.del(pattern);
    }
  } catch (err) {
    console.error('Cache DEL error:', err.message);
  }
};

const checkRedisConnection = async () => {
  try {
    await getRedisClient().ping();
    console.log(' Redis health check passed');
    return true;
  } catch (err) {
    console.error(' Redis health check failed:', err.message);
    console.warn('  App will run WITHOUT caching');
    return false;
  }
};

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel, checkRedisConnection };