import { client, publisher } from "../config/redis";
const LEADERBOARD_WEEKLY = "leaderboard:weekly";

const updatePlayerScore = async (playerId: string, newScore: number) => {
  try {
    const pipeline = client.multi();
    const oldPlayerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);

    await client.zAdd(LEADERBOARD_WEEKLY, { score: newScore, value: playerId });

    const newPlayerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);

    console.log(playerId, oldPlayerRank, newPlayerRank);
    if (newPlayerRank === null || oldPlayerRank === null)
      return "User not found";

    const rankDiff = oldPlayerRank - newPlayerRank;
    if (rankDiff != 0) {
      const [start, end] =
        rankDiff > 0
          ? [newPlayerRank + 1, oldPlayerRank]
          : [oldPlayerRank, newPlayerRank - 1];
      const changedRankDiffPlayers = await client.zRangeWithScores(
        LEADERBOARD_WEEKLY,
        start,
        end,
        { REV: true }
      );
      pipeline.hIncrBy("ranking-change:daily", playerId, rankDiff);
      changedRankDiffPlayers.forEach(({ value }) =>
        pipeline.hIncrBy("ranking-change:daily", value, rankDiff > 0 ? -1 : 1)
      );
    }

    await pipeline.exec();

    let surroundingPlayersIds: string[] = [];
    if (newPlayerRank < 100) {
      publisher.publish(
        "gameEvents",
        JSON.stringify({ top100: true, playerId })
      );
    } else {
      const surroundingPlayers = await client.zRangeWithScores(
        LEADERBOARD_WEEKLY,
        Math.max(newPlayerRank - 3, 0),
        newPlayerRank + 2,
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
