import { subscriber } from "../../config/redis";
import { GAME_EVENT_CHANNEL, LEADERBOARD_DATA_EVENT } from "../../constants";
import { io } from "../../index";
import { getLeaderboard } from "./leaderboard";

const leaderboardEventListener = (
  userMap: Map<string, { playerId: string }>
) => {
  subscriber.subscribe(GAME_EVENT_CHANNEL, async (message) => {
    const { isTop100, surroundingPlayersIds } = JSON.parse(message);
    userMap.forEach(async ({ playerId: userId }, socketId) => {
      if (isTop100) {
        const leaderboardData = await getLeaderboard(userId);
        io.emit(LEADERBOARD_DATA_EVENT, leaderboardData);
      } else if (surroundingPlayersIds.includes(userId)) {
        const leaderboardData = await getLeaderboard(userId);
        io.to(socketId).emit(LEADERBOARD_DATA_EVENT, leaderboardData);
      }
    });
  });
};

export { leaderboardEventListener };
