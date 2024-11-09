import { client } from "../../config/redis";
import { LEADERBOARD_WEEKLY } from "../../constants";

export const resetLeaderboard = async () => {
  const allPlayers = await client.zRangeWithScores(LEADERBOARD_WEEKLY, 0, -1);
  const pipeline = client.multi();

  // this part written with huge disgust
  // in order to display leaderboard after weekly reset, player scores are assignin to 0 instead of dropping table

  allPlayers.forEach(({ value }) =>
    pipeline.zAdd(LEADERBOARD_WEEKLY, { value, score: 0 })
  );
  pipeline.exec();
};
