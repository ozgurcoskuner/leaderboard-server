import { client, publisher } from "../config/redis";

const updatePlayerScore = async (playerId: string, newScore: number) => {
  try {
    const LEADERBOARD_WEEKLY = "leaderboard:weekly";

    await client.zAdd(LEADERBOARD_WEEKLY, { score: newScore, value: playerId });

    const updatedPlayerRank = await client.zRevRank(
      LEADERBOARD_WEEKLY,
      playerId
    );
    if (updatedPlayerRank === null) return "User not found";

    let surroundingPlayersIds: string[] = [];
    if (updatedPlayerRank < 100) {
      publisher.publish(
        "gameEvents",
        JSON.stringify({ top100: true, playerId })
      );
    } else {
      const surroundingPlayers = await client.zRangeWithScores(
        LEADERBOARD_WEEKLY,
        Math.max(updatedPlayerRank - 3, 0),
        updatedPlayerRank + 2,
        { REV: true }
      );
      surroundingPlayersIds = surroundingPlayers.map(({ value }) => value);

      publisher.publish(
        "gameEvents",
        JSON.stringify({ top100: false, playerId, surroundingPlayersIds })
      );
    }
  } catch (e) {
    console.error(e);
  }
};

export { updatePlayerScore };
