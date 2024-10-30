import { client } from "../config/redis";
import Player from "../models/playerModel";
import {
  LEADERBOARD_WEEKLY,
  RANKING_CHANGE_DAILY,
  TOP_PLAYERS_COUNT,
} from "../constants";

export const getLeaderboard = async (playerId: string) => {
  try {
    const playerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);
    if (!playerRank) return;
    let surrondingPlayers: { score: number; value: string }[] = [];
    // check cases for 98, 99, 100, 101
    if (playerRank > 97) {
      surrondingPlayers = await client.zRangeWithScores(
        LEADERBOARD_WEEKLY,
        Math.max(playerRank - 3, 0),
        playerRank + 2,
        { REV: true }
      );
    }
    const top100Players = await client.zRangeWithScores(
      LEADERBOARD_WEEKLY,
      0,
      TOP_PLAYERS_COUNT - 1,
      { REV: true }
    );

    const allPlayers = [...top100Players, ...surrondingPlayers];

    const playerIds = allPlayers.map(({ value }) => Number(value));
    const dbPlayers = await Player.find({ playerId: { $in: playerIds } });
    const dbPlayersMap = new Map(
      dbPlayers.map((player) => [player.playerId, player.toObject()])
    );

    const leaderboard = await Promise.all(
      allPlayers.map(async ({ value, score }) => ({
        ...dbPlayersMap.get(Number(value)),
        weeklyMoney: score,
        dailyDiff: (await client.hGet(RANKING_CHANGE_DAILY, value)) || 0,
      }))
    );

    return leaderboard;
  } catch (e) {
    console.error(e);
  }
};
