
function buildUserScoreMap(attributeMap, recommendationMap) {
    const userScoreMap = new Map();

    for (const [completePath, storedScore] of Object.entries(recommendationMap)) {

        // Extract attribute values from the path.
        // Example: "color:black/size:M" -> ["black", "M"]
        const attributes = completePath
            .split("/")
            .map(part => part.split(":")[1]);

        const totalAttributes = attributes.length;

        if (totalAttributes === 0) continue;

        // Track each user's number of matching attributes.
        const userMatchCount = new Map();

        for (const value of attributes) {
            const users = attributeMap.get(value);

            if (!users) continue;

            for (const userId of users) {
                userMatchCount.set(
                    userId,
                    (userMatchCount.get(userId) || 0) + 1
                );
            }
        }

        // Calculate the final score for each matching user.
        for (const [userId, matchCount] of userMatchCount) {
            const attributeMatchScore = matchCount / totalAttributes;

            const finalScore =
                0.6 * attributeMatchScore +
                0.4 * storedScore;

            if (!userScoreMap.has(userId)) {
                userScoreMap.set(userId, new Map());
            }

            userScoreMap
                .get(userId)
                .set(completePath, finalScore);
        }
    }

    return userScoreMap;
}

module.exports = { buildUserScoreMap };