import { client } from "../config/redis";
import Player from "../models/playerModel";
import {
  LEADERBOARD_WEEKLY,
  RANKING_CHANGE_DAILY,
  TOP_PLAYERS_COUNT,
  ABOVE_PLAYER_COUNT,
  BELOW_PLAYER_COUNT,
} from "../constants";

export const getLeaderboard = async (playerId: string) => {
  try {
    const dailyDiffPipeline = client.multi();
    const ranksPipeline = client.multi();
    const playerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);

    if (playerRank === null) {
      return "User not found";
    }
    const [start, end] = [
      Math.max(playerRank - ABOVE_PLAYER_COUNT, 0),
      playerRank + BELOW_PLAYER_COUNT,
    ];

    const surrondingPlayers = await client.zRangeWithScores(
      LEADERBOARD_WEEKLY,
      start,
      end,
      { REV: true }
    );

    const top100Players = await client.zRangeWithScores(
      LEADERBOARD_WEEKLY,
      0,
      TOP_PLAYERS_COUNT - 1,
      { REV: true }
    );

    const top100PlayerIds = new Set(
      top100Players.map((player) => player.value)
    );
    const allPlayers = [
      ...top100Players,
      ...surrondingPlayers.filter(
        (player) => !top100PlayerIds.has(player.value)
      ),
    ];

    const playerIds = allPlayers.map(({ value }) => Number(value));
    const dbPlayers = await Player.find({ playerId: { $in: playerIds } });

    const dbPlayersMap = new Map(
      dbPlayers.map((player) => [player.playerId, player.toObject()])
    );
    allPlayers.forEach(({ value }) => {
      dailyDiffPipeline.hGet(RANKING_CHANGE_DAILY, value);
      ranksPipeline.zRevRank(LEADERBOARD_WEEKLY, value);
    });

    const [dailyRankDiffs, ranks] = await Promise.all([
      dailyDiffPipeline.exec(),
      ranksPipeline.exec(),
    ]);

    const leaderboard = allPlayers.map(({ value, score }, index) => ({
      ...dbPlayersMap.get(Number(value)),
      weeklyMoney: score,
      dailyDiff: dailyRankDiffs[index] || 0,
      rank: ((ranks[index] || 0) as number) + 1,
    }));

    return leaderboard;
  } catch (e) {
    console.error(e);
  }
};
