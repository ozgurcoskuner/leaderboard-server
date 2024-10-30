import { subscriber } from "../config/redis";
import { GAME_EVENT_CHANNEL, LEADERBOARD_DATA_EVENT } from "../constants";
import { io } from "../index";
import { getLeaderboard } from "./leaderboardService";

const startListeningToGameEvents = (
  userMap: Map<string, { playerId: string }>
) => {
  subscriber.subscribe(GAME_EVENT_CHANNEL, async (message) => {
    const { top100, playerId, surroundingPlayersIds } = JSON.parse(message);
    if (top100) {
      const leaderboardData = await getLeaderboard(playerId);
      io.emit(LEADERBOARD_DATA_EVENT, leaderboardData);
    } else if (surroundingPlayersIds) {
      userMap.forEach(async ({ playerId: userId }, socketId) => {
        if (surroundingPlayersIds.includes(userId) || userId === playerId) {
          const leaderboardData = await getLeaderboard(userId);
          io.to(socketId).emit(LEADERBOARD_DATA_EVENT, leaderboardData);
        }
      });
    }
  });
};

export { startListeningToGameEvents };
