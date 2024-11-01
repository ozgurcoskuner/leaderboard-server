import { client } from "../../config/redis";
import { LEADERBOARD_WEEKLY } from "../../constants";

export const resetLeaderboard = async () => {
  const allPlayers = await client.zRangeWithScores(LEADERBOARD_WEEKLY, 0, -1);
  const pipeline = client.multi();
  allPlayers.forEach(({ value }) =>
    pipeline.zAdd(LEADERBOARD_WEEKLY, { value, score: 0 })
  );
  pipeline.exec();
};
