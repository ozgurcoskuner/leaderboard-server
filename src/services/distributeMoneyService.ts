import { client } from "../config/redis";
import Player from "../models/playerModel";

const rewards = {
  1: 0.2,
  2: 0.15,
  3: 0.1,
};

const LEADERBOARD_WEEKLY = "leaderboard:weekly";

export const distributeMoney = async () => {
  const allPlayers = await client.zRangeWithScores(LEADERBOARD_WEEKLY, 0, -1, {
    REV: true,
  });

  const totalMoney = allPlayers.reduce((acc, cur) => acc + cur.score, 0);
  console.log("totalMoney", totalMoney);
  const prizePool = totalMoney * 0.02;
  console.log("prizePool", prizePool);
  const [firstPlayer, secondPlayer, thirdPlayer, ...remainingPlayers] =
    allPlayers.slice(0, 100);
  const firstPlayerReward = prizePool * rewards[1];
  console.log("firstPlayerReward", firstPlayerReward);
  const secondPlayerReward = prizePool * rewards[2];
  console.log("secondPlayerReward", secondPlayerReward);
  const thirdPlayerReward = prizePool * rewards[3];
  console.log("thirdPlayerReward", thirdPlayerReward);
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
  console.log("paymentToTopPlayers", paymentToTopPlayers);
  const remainingPrize =
    prizePool - (firstPlayerReward + secondPlayerReward + thirdPlayerReward);
  console.log("remaniningPrize", remainingPrize);
  const rewardForEachRemainingPlayer = Math.round(
    remainingPrize / remainingPlayers.length
  );
  console.log("rewardForEachRemainingPlayerr", rewardForEachRemainingPlayer);
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
};
