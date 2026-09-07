const { redisClient } = require("../config/redis");

const getOrSetRedis = async (key, cb, expirationInSeconds = null) => {
    try {
        // 1. Try Redis first
        const cachedData = await redisClient.get(key);

        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // 2. Cache miss → get fresh data
        const newData = await cb();

        // 3. Store fresh data in Redis
        if (expirationInSeconds === null) {
            await redisClient.set(
                key,
                JSON.stringify(newData)
            );
        } else {
            await redisClient.setEx(
                key,
                expirationInSeconds,
                JSON.stringify(newData)
            );
        }

        // 4. Return fresh data
        return newData;

    } catch (err) {
        console.error("Redis cache error:", err);
        return null;
    }
};

module.exports = getOrSetRedis;