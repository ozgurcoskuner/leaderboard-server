import { client, publisher } from "../config/redis";
import {
  ABOVE_PLAYER_COUNT,
  BELOW_PLAYER_COUNT,
  GAME_EVENT_CHANNEL,
  LEADERBOARD_WEEKLY,
  TOP_PLAYERS_COUNT,
} from "../constants";
import { updatePlayerRanks } from "./updatePlayerRanks";

const updatePlayerScore = async (playerId: string, newScore: number) => {
  try {
    const oldPlayerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);

    await client.zAdd(LEADERBOARD_WEEKLY, { score: newScore, value: playerId });

    const newPlayerRank = await client.zRevRank(LEADERBOARD_WEEKLY, playerId);

    if (newPlayerRank === null || oldPlayerRank === null)
      return "User not found";

    await updatePlayerRanks(playerId, oldPlayerRank, newPlayerRank);

    let surroundingPlayersIds: string[] = [];
    if (newPlayerRank < TOP_PLAYERS_COUNT) {
      publisher.publish(
        GAME_EVENT_CHANNEL,
        JSON.stringify({ top100: true, playerId })
      );
    } else {
      const surroundingPlayers = await client.zRangeWithScores(
        LEADERBOARD_WEEKLY,
        Math.max(newPlayerRank - ABOVE_PLAYER_COUNT, 0),
        newPlayerRank + BELOW_PLAYER_COUNT,
        { REV: true }
      );
      surroundingPlayersIds = surroundingPlayers.map(({ value }) => value);

      publisher.publish(
        GAME_EVENT_CHANNEL,
        JSON.stringify({ top100: false, playerId, surroundingPlayersIds })
      );
    }
  } catch (e) {
    console.error(e);
  }
};

export { updatePlayerScore };
