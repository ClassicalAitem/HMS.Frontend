/**
 * Lightweight in-memory cache and promise deduplicator for Admin data
 * Keeps pages blazing fast and avoids redundant API round-trips.
 */

const cacheStore = new Map();
const inFlightPromises = new Map();

export const getCachedData = async (key, fetcher, ttlMs = 60000, forceRefresh = false) => {
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (!forceRefresh && cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // Deduplicate in-flight requests
  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cacheStore.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
};

export const clearAdminCache = (key) => {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
};

