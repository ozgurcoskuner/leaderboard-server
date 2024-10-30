import { client } from "../config/redis";
import { LEADERBOARD_WEEKLY, RANKING_CHANGE_DAILY } from "../constants";

export const updatePlayerRanks = async (
  playerId: string,
  oldPlayerRank: number,
  newPlayerRank: number
) => {
  const pipeline = client.multi();
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
    pipeline.hIncrBy(RANKING_CHANGE_DAILY, playerId, rankDiff);
    changedRankDiffPlayers.forEach(({ value }) =>
      pipeline.hIncrBy(RANKING_CHANGE_DAILY, value, rankDiff > 0 ? -1 : 1)
    );
  }

  await pipeline.exec();
};
