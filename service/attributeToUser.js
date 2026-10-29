
const redisClient = require("../config/redis");

async function main(affectedSessions, recommendationMap) {
    // 1. Fetch affected sessions from Redis
    const rawSessions = await Promise.all(
        affectedSessions.map(sessionId =>
            redisClient.get(`conversation:session:${sessionId}`)
        )
    );

    const attributeMap = new Map();

    // 2. Map each attribute value directly to its users
    for (let i = 0; i < rawSessions.length; i++) {
        if (!rawSessions[i]) continue;

        let sessionData;

        try {
            sessionData = JSON.parse(rawSessions[i]);
        } catch {
            continue;
        }

        const { sessionId, selection } = sessionData;

        if (!Array.isArray(selection)) continue;

        for (const { attribute, value } of selection) {
            // Use value directly as the key.
            // If values can overlap across attributes,
            // replace this with `${attribute}:${value}`.
            if (!attributeMap.has(value)) {
                attributeMap.set(value, new Set());
            }

            attributeMap.get(value).add(sessionId);
        }
    }

    return {
        attributeMap,
        recommendationMap
    };
}

module.exports = { main };
