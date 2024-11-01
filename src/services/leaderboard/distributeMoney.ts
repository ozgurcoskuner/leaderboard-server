import { client } from "../../config/redis";
import {
  LEADERBOARD_WEEKLY,
  PRIZE_POOL_RATIO,
  REWARDS,
  TOP_PLAYERS_COUNT,
} from "../../constants";
import Player from "../../models/playerModel";

export const distributeMoney = async () => {
  try {
    const allPlayers = await client.zRangeWithScores(
      LEADERBOARD_WEEKLY,
      0,
      -1,
      {
        REV: true,
      }
    );

    const totalMoney = allPlayers.reduce((acc, cur) => acc + cur.score, 0);
    const prizePool = totalMoney * PRIZE_POOL_RATIO;
    const [firstPlayer, secondPlayer, thirdPlayer, ...remainingPlayers] =
      allPlayers.slice(0, TOP_PLAYERS_COUNT);
    const firstPlayerReward = prizePool * REWARDS[1];
    const secondPlayerReward = prizePool * REWARDS[2];
    const thirdPlayerReward = prizePool * REWARDS[3];
    const paymentToTopPlayers = [
      {
        playerId: Number(firstPlayer.value),
        earnedMoney: Math.round(firstPlayerReward + firstPlayer.score),
      },
      {
        playerId: Number(secondPlayer.value),
        earnedMoney: Math.round(secondPlayerReward + secondPlayer.score),
      },
      {
        playerId: Number(thirdPlayer.value),
        earnedMoney: Math.round(thirdPlayerReward + thirdPlayer.score),
      },
    ];

    const remainingPrize =
      prizePool - (firstPlayerReward + secondPlayerReward + thirdPlayerReward);

    const rewardForEachRemainingPlayer = Math.round(
      remainingPrize / remainingPlayers.length
    );

    const rewardsToRemainingPlayers = remainingPlayers.map(
      ({ value, score }) => ({
        playerId: Number(value),
        earnedMoney: rewardForEachRemainingPlayer + score,
      })
    );

    const bulkOperations = [
      ...paymentToTopPlayers.map(({ playerId, earnedMoney }) => ({
        updateOne: {
          filter: { playerId },
          update: { $inc: { totalMoney: earnedMoney } },
        },
      })),
      ...rewardsToRemainingPlayers.map(({ playerId, earnedMoney }) => ({
        updateOne: {
          filter: { playerId },
          update: { $inc: { totalMoney: earnedMoney } },
        },
      })),
    ];

    await Player.bulkWrite(bulkOperations);
  } catch (e) {
    console.error(e);
  }
};
