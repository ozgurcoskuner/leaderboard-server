import { client, publisher } from "../../config/redis";
import {
  ABOVE_PLAYER_COUNT,
  BELOW_PLAYER_COUNT,
  GAME_EVENT_CHANNEL,
  LEADERBOARD_WEEKLY,
  RANKING_CHANGE_DAILY,
  TOP_PLAYERS_COUNT,
} from "../../constants";

const updatePlayerScore = async (playerId: string, newScore: number) => {
  try {
    await client.zAdd(LEADERBOARD_WEEKLY, { score: newScore, value: playerId });
  } catch (e) {
    console.error(e);
  }
};

const updatePlayerRanks = async (
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

const updateAffectedPlayers = async (
  oldPlayerRank: number,
  newPlayerRank: number
) => {
  const isTop100 = newPlayerRank < TOP_PLAYERS_COUNT;
  const pipeline = client.multi();
  pipeline.zRange(
    LEADERBOARD_WEEKLY,
    Math.max(oldPlayerRank - ABOVE_PLAYER_COUNT, 0),
    oldPlayerRank + ABOVE_PLAYER_COUNT,
    { REV: true }
  );
  pipeline.zRange(
    LEADERBOARD_WEEKLY,
    Math.max(newPlayerRank - ABOVE_PLAYER_COUNT, 0),
    newPlayerRank + ABOVE_PLAYER_COUNT,
    { REV: true }
  );
  const result = await pipeline.exec();
  const surrondingPlayersSet = new Set(result.flat());
  const surroundingPlayersIds = Array.from(surrondingPlayersSet);

  publisher.publish(
    GAME_EVENT_CHANNEL,
    JSON.stringify({ isTop100, surroundingPlayersIds })
  );
};
const handleScoreUpdate = async (playerId: string, newScore: number) => {
  try {
    const oldPlayerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);
    await updatePlayerScore(playerId, newScore);
    const newPlayerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);

    if (newPlayerRank === null || oldPlayerRank === null) {
      throw new Error("Rank not found");
    }

    await updatePlayerRanks(playerId, oldPlayerRank, newPlayerRank);
    await updateAffectedPlayers(oldPlayerRank, newPlayerRank);
  } catch (e) {
    console.error(e);
  }
};

export { handleScoreUpdate };
