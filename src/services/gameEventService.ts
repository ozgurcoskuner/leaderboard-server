import { subscriber } from "../config/redis";
import { io } from "../index";
import { getLeaderboard } from "./leaderboardService";

const GAME_EVENT_CHANNEL = "gameEvents";

const startListeningToGameEvents = (
  userMap: Map<string, { playerId: string }>
) => {
  subscriber.subscribe(GAME_EVENT_CHANNEL, async (message) => {
    const { top100, playerId, surroundingPlayersIds } = JSON.parse(message);
    // Send everyone
    if (top100) {
      const leaderboardData = await getLeaderboard(playerId);
      io.emit("leaderboardData", leaderboardData);
    } else if (surroundingPlayersIds) {
      // Send updats to surrndng ranks
      userMap.forEach(async ({ playerId: userId }, socketId) => {
        if (surroundingPlayersIds.includes(userId) || userId === playerId) {
          io.to(socketId).emit("leaderboardData", await getLeaderboard(userId));
        }
      });
    }
  });
};

export { startListeningToGameEvents };
